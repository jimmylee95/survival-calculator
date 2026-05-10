'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import {
  type BusinessResult,
  type FreelancerResult,
  type DangerLevel,
  formatWon,
} from '@/utils/calculate'
import { useKakaoShare }     from '@/hooks/useKakaoShare'
import { createClient }      from '@/lib/supabase/client'
import { CountUpNumber }    from '@/components/result/CountUpNumber'
import { ScenarioCard }     from '@/components/result/ScenarioCard'
import { InsightCard }      from '@/components/result/InsightCard'
import { PrescriptionCard } from '@/components/result/PrescriptionCard'
import { CostSlider }       from '@/components/result/CostSlider'
import { BenchmarkCard }    from '@/components/result/BenchmarkCard'
import { FreelancerSlider } from '@/components/result/FreelancerSlider'
import { LoginGate, LoginPromptCard } from '@/components/result/LoginGate'

const DANGER_COLORS: Record<DangerLevel, string> = {
  critical: '#FC8181',
  warning:  '#F6AD55',
  caution:  '#ECC94B',
  safe:     '#68D391',
  infinite: '#63B3ED',
}

const MODE_META = {
  business:   { bg: '#1A1F5E', label: '사장님 생존 계산기' },
  freelancer: { bg: '#FF6B35', label: '직장인 탈출 계산기' },
}

export default function ResultPage() {
  const router = useRouter()
  const { mode, result, businessInput, freelancerInput, _hydrated } =
    useCalculatorStore()

  const [toastVisible, setToastVisible] = useState(false)
  const { shareViaKakao, isKakaoReady }  = useKakaoShare()

  // 로그인 여부 (null = 확인 중, false = 미로그인, true = 로그인)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    if (_hydrated && !result) router.replace('/calculator')
  }, [_hydrated, result, router])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user))
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (_, session) => setIsLoggedIn(!!session?.user),
    )
    return () => subscription.unsubscribe()
  }, [])

  if (!_hydrated || !result) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 28 }}>⚡</div>
      </div>
    )
  }

  const meta          = MODE_META[mode]
  const dangerLevel   = result.dangerLevel
  const runwayColor   = DANGER_COLORS[dangerLevel]
  const realisticDays = result.realisticRunwayDays
  const worstDays     = result.worstRunwayDays

  const isBusiness    = mode === 'business'
  const bizResult     = isBusiness ? (result as BusinessResult) : null
  const freeResult    = !isBusiness ? (result as FreelancerResult) : null

  const improvedDays  = Infinity

  type ScenarioItem = { label: string; sublabel: string; days: number }
  const scenarios: [ScenarioItem, ScenarioItem, ScenarioItem] = [
    { label: '최악', sublabel: '매출/수입 0원', days: worstDays },
    { label: '현실', sublabel: isBusiness ? '입력한 매출 기준' : '현재 부업 기준', days: realisticDays },
    { label: '개선', sublabel: isBusiness ? '손익분기 달성 시' : '독립 달성 시', days: improvedDays },
  ]

  const insights = isBusiness && bizResult
    ? [
        {
          icon: '💡', text: '월',
          value: `${formatWon(bizResult.breakEvenRevenue)} 벌면 흑자예요`,
          sub: `변동비율 ${Math.round((1 - bizResult.variableCost / Math.max(businessInput.monthlyRevenue, 1)) * 100)}% 기준`,
        },
        {
          icon: '📉', text: '지금 월',
          value: formatWon(Math.max(bizResult.monthlyNetLoss, 0)),
          sub: '씩 자금이 줄고 있어요',
        },
        {
          icon: '⏰', text: '매달 고정비',
          value: formatWon(businessInput.fixedCost + businessInput.loanInterest),
          sub: '임대료 + 인건비 + 이자 합계',
        },
      ]
    : freeResult
    ? (() => {
        const savings = freeResult.monthlySavings
        const remaining = freeResult.remainingAmount
        const rate = freeResult.savingsRate

        return [
          {
            icon: '💰', text: '매달',
            value: savings > 0 ? `${formatWon(savings)}씩 모이고 있어요` : '저축이 안 되고 있어요',
            sub: savings > 0 ? `저축률 ${rate}%` : '지출을 줄이거나 수입을 늘려야 해요',
          },
          {
            icon: '🎯', text: '목표까지',
            value: remaining > 0 ? `${formatWon(remaining)} 남았어요` : '이미 달성했어요!',
            sub: remaining > 0 && savings > 0
              ? `현재 속도로 약 ${Math.ceil(remaining / savings)}개월`
              : undefined,
          },
          ...(savings > 0 ? [{
            icon: '🚀', text: '부업으로 월 50만원 추가하면',
            value: remaining > 0 ? `${Math.ceil(remaining / (savings + 500_000))}개월로 단축` : '더 빨리 달성!',
            sub: remaining > 0 ? `${Math.ceil(remaining / savings) - Math.ceil(remaining / (savings + 500_000))}개월 앞당겨져요` : undefined,
          }] : []),
        ]
      })()
    : []

  // ── 공유 ──────────────────────────────────────────────
  function getShareText() {
    const days = isFinite(realisticDays) ? Math.floor(realisticDays) : '∞'
    const url  = typeof window !== 'undefined' ? window.location.origin : ''
    return isBusiness
      ? `나의 사업 런웨이는 ${days}일!\n사장님 생존 계산기로 확인해보세요\n👉 ${url}`
      : `나의 퇴사까지 ${days}일!\n직장인 탈출 계산기로 확인해보세요\n👉 ${url}`
  }

  async function handleShare() {
    const text = getShareText()
    const url  = typeof window !== 'undefined' ? window.location.origin : ''

    if (isKakaoReady()) {
      const ok = shareViaKakao(text, url)
      if (ok) return
    }

    if (navigator.share) {
      try { await navigator.share({ text }); return } catch { /* 취소 */ }
    }

    try {
      await navigator.clipboard.writeText(text)
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2500)
    } catch { /* ignore */ }
  }

  // ── 감정적 리액션 ──────────────────────────────────────
  type Reaction = { emoji: string; label: string; sub: string; bg: string }
  
  const bizReactions: Record<DangerLevel, Reaction> = {
    critical: { emoji: '😱', label: '사장님, 비상입니다', sub: '통장이 비명을 지르고 있어요', bg: 'linear-gradient(135deg, #742A2A 0%, #C53030 100%)' },
    warning:  { emoji: '😰', label: '위험 신호 감지', sub: '아직 늦지 않았어요. 하지만 빨리요.', bg: 'linear-gradient(135deg, #744210 0%, #C05621 100%)' },
    caution:  { emoji: '😐', label: '아슬아슬한 줄타기', sub: '괜찮아 보이지만... 방심하면 안 돼요', bg: 'linear-gradient(135deg, #1A1F5E 0%, #2D3399 100%)' },
    safe:     { emoji: '😊', label: '아직은 괜찮아요', sub: '여유 있을 때 다음 수를 준비하세요', bg: 'linear-gradient(135deg, #22543D 0%, #276749 100%)' },
    infinite: { emoji: '🤑', label: '사장님이 이 구역의 미친존재', sub: '흑자 운영 중! 확장을 고민할 때예요', bg: 'linear-gradient(135deg, #2A4365 0%, #2B6CB0 100%)' },
  }
  
  const freeReactions: Record<DangerLevel, Reaction> = {
    critical: { emoji: '💀', label: '퇴사는... 다음 생에?', sub: '현재 속도로는 탈출이 요원해요', bg: 'linear-gradient(135deg, #742A2A 0%, #C53030 100%)' },
    warning:  { emoji: '😤', label: '멀지만 보이긴 해요', sub: '부업 하나면 확 당겨질 수 있어요', bg: 'linear-gradient(135deg, #744210 0%, #C05621 100%)' },
    caution:  { emoji: '👀', label: '출구가 보이기 시작했다!', sub: '조금만 더! 터널 끝에 빛이 보여요', bg: 'linear-gradient(135deg, #FF6B35 0%, #E8590C 100%)' },
    safe:     { emoji: '🔥', label: '곧이에요! 사직서 준비!', sub: '1년 안에 탈출 가능! 플랜B를 세우세요', bg: 'linear-gradient(135deg, #22543D 0%, #276749 100%)' },
    infinite: { emoji: '🏆', label: '이미 자유인이시네요!', sub: '목표 달성! 이제 회사가 당신을 필요로 해요', bg: 'linear-gradient(135deg, #2A4365 0%, #2B6CB0 100%)' },
  }

  const reaction = isBusiness ? bizReactions[dangerLevel] : freeReactions[dangerLevel]
  const mainLabel = isBusiness ? '현실 런웨이' : '탈출까지'

  // 확인 중(null)에는 깨끗하게 보여주고, 확인 완료 후 false면 잠금 노출
  const gateOpen = isLoggedIn !== false

  return (
    <div style={{ minHeight: '100dvh', background: '#F8F9FB', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'hidden', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 430, overflowX: 'hidden' }}>

        {/* ── 히어로 ─────────────────────────────────── */}
        <div style={{
          background: reaction.bg, padding: '48px 24px 40px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          transition: 'background 0.5s',
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />
          <div style={{
            position: 'absolute', bottom: -40, left: -40,
            width: 160, height: 160, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />

          <button
            onClick={() => router.back()}
            style={{
              position: 'absolute', top: 16, left: 20,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 20, padding: '6px 14px',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ← 수정
          </button>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, margin: '0 0 12px' }}>
            {meta.label}
          </p>

          {/* 감정 이모지 */}
          <div style={{ fontSize: 48, marginBottom: 8, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
            {reaction.emoji}
          </div>

          {/* 감정 라벨 */}
          <p style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.9)', margin: '0 0 16px', letterSpacing: '-0.3px' }}>
            {reaction.label}
          </p>

          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: 700, margin: '0 0 8px' }}>
            {mainLabel}
          </p>

          <p style={{
            fontSize: 72, fontWeight: 900, color: runwayColor,
            margin: '0 0 4px', lineHeight: 1, letterSpacing: '-2px',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
          }}>
            <CountUpNumber target={isFinite(realisticDays) ? Math.floor(realisticDays) : Infinity} />
          </p>

          {isFinite(realisticDays) && (
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', fontWeight: 700, margin: '4px 0 16px' }}>
              일
            </p>
          )}

          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.85)',
            margin: '16px 0 0', lineHeight: 1.6,
            fontWeight: 600,
          }}>
            {reaction.sub}
          </p>
        </div>

        {/* ── 카드 섹션 ───────────────────────────────── */}
        <div style={{
          padding: '20px 16px 40px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>

          <ScenarioCard items={scenarios} />

          {insights.length > 0 && <InsightCard items={insights} />}

          {/* ★ 업종 벤치마크 (자영업자만) — 순위 부분만 블러 */}
          {isBusiness && (
            <BenchmarkCard
              input={businessInput}
              currentDays={realisticDays}
              isLoggedIn={gateOpen}
            />
          )}

          {/* ★ 런웨이 시뮬레이터 - 와우 포인트 (자영업자만) — 비로그인 시 블러 */}
          {isBusiness && (
            <LoginGate
              isLoggedIn={gateOpen}
              message="시뮬레이터를 사용해보세요"
              sub="로그인하면 무제한으로 가정해볼 수 있어요"
            >
              <CostSlider input={businessInput} currentDays={realisticDays} />
            </LoginGate>
          )}

          {/* ★ 독립 시뮬레이터 (직장인만) — 비로그인 시 블러 */}
          {!isBusiness && (
            <LoginGate
              isLoggedIn={gateOpen}
              message="시뮬레이터를 사용해보세요"
              sub="로그인하면 무제한으로 가정해볼 수 있어요"
            >
              <FreelancerSlider input={freelancerInput} currentDays={realisticDays} />
            </LoginGate>
          )}

          <PrescriptionCard level={dangerLevel} mode={mode} isLoggedIn={gateOpen} />

          {/* 비로그인 사용자에게만 노출되는 CTA 카드들 */}
          {!gateOpen && (
            <>
              <LoginPromptCard
                icon="💾"
                title="이 결과를 저장하려면?"
                sub="다시 계산하기 귀찮잖아요 😉"
              />
              <LoginPromptCard
                icon="📈"
                title="다음 달에 변화를 비교해드려요"
                sub="카카오 로그인하면 자동 저장!"
              />
            </>
          )}

          {/* ── 하단 버튼 ───────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => router.push('/calculator')}
              style={{
                width: '100%', height: 52, borderRadius: 14,
                border: '1.5px solid #E2E8F0', background: '#fff',
                fontSize: 15, fontWeight: 800, color: '#1A1F5E',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              🔄 다시 계산하기
            </button>

            <button
              onClick={handleShare}
              style={{
                width: '100%', height: 52, borderRadius: 14,
                border: 'none', background: meta.bg,
                fontSize: 15, fontWeight: 800, color: '#fff',
                cursor: 'pointer', boxShadow: `0 6px 20px ${meta.bg}50`,
              }}
            >
              📤 결과 공유하기
            </button>
          </div>
        </div>
      </div>

      {/* 클립보드 복사 토스트 */}
      <div style={{
        position: 'fixed', bottom: 32, left: '50%',
        transform: `translateX(-50%) translateY(${toastVisible ? 0 : 20}px)`,
        opacity: toastVisible ? 1 : 0, transition: 'all 0.3s ease',
        background: '#1A1F5E', color: '#fff', borderRadius: 24,
        padding: '10px 20px', fontSize: 13, fontWeight: 700,
        pointerEvents: 'none', whiteSpace: 'nowrap',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 50,
      }}>
        ✓ 클립보드에 복사됐어요!
      </div>
    </div>
  )
}
