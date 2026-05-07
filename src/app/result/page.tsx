'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import {
  type BusinessResult,
  type FreelancerResult,
  type DangerLevel,
  formatWon,
  formatDays,
  calculateFreelancerRunway,
} from '@/utils/calculate'
import { CountUpNumber }    from '@/components/result/CountUpNumber'
import { ScenarioCard }     from '@/components/result/ScenarioCard'
import { InsightCard }      from '@/components/result/InsightCard'
import { PrescriptionCard } from '@/components/result/PrescriptionCard'

const DANGER_COLORS: Record<DangerLevel, string> = {
  critical: '#FC8181',
  warning:  '#F6AD55',
  caution:  '#ECC94B',
  safe:     '#68D391',
  infinite: '#63B3ED',
}

const MODE_META = {
  business:   { bg: '#1A1F5E', label: '사장님 생존 계산기' },
  freelancer: { bg: '#FF6B35', label: '직장인 독립 계산기' },
}

export default function ResultPage() {
  const router = useRouter()
  const { mode, result, businessInput, freelancerInput, _hydrated } =
    useCalculatorStore()

  const [toastVisible, setToastVisible] = useState(false)

  // 결과 없으면 입력 페이지로
  useEffect(() => {
    if (_hydrated && !result) router.replace('/calculator')
  }, [_hydrated, result, router])

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

  // ── 모드별 분기 ─────────────────────────────────────────
  const isBusiness     = mode === 'business'
  const bizResult      = isBusiness ? (result as BusinessResult) : null
  const freeResult     = !isBusiness ? (result as FreelancerResult) : null

  // 개선 시나리오 런웨이 (손익분기 달성 or 독립 달성 → Infinity)
  const improvedDays   = Infinity

  // 시나리오 카드 데이터
  type ScenarioItem = { label: string; sublabel: string; days: number }
  const scenarios: [ScenarioItem, ScenarioItem, ScenarioItem] = [
    {
      label:    '최악',
      sublabel: '매출/수입 0원',
      days:     worstDays,
    },
    {
      label:    '현실',
      sublabel: isBusiness ? '입력한 매출 기준' : '현재 부업 기준',
      days:     realisticDays,
    },
    {
      label:    '개선',
      sublabel: isBusiness ? '손익분기 달성 시' : '독립 달성 시',
      days:     improvedDays,
    },
  ]

  // 인사이트 카드 데이터
  const insights = isBusiness && bizResult
    ? [
        {
          icon:  '💡',
          text:  '월',
          value: `${formatWon(bizResult.breakEvenRevenue)}만 벌면 흑자예요`,
          sub:   `변동비율 ${Math.round((1 - bizResult.variableCost / Math.max(businessInput.monthlyRevenue, 1)) * 100)}% 기준`,
        },
        {
          icon:  '📉',
          text:  '지금 월',
          value: formatWon(Math.max(bizResult.monthlyNetLoss, 0)),
          sub:   '씩 자금이 줄고 있어요',
        },
        {
          icon:  '⏰',
          text:  '매달 고정비',
          value: formatWon(businessInput.fixedCost + businessInput.loanInterest),
          sub:   '임대료 + 인건비 + 이자 합계',
        },
      ]
    : freeResult
    ? (() => {
        const gap             = Math.max(freeResult.independenceIncome - freelancerInput.sideIncome, 0)
        const increaseAmount  = 500_000 // 50만원 늘렸을 때
        const newRunway       = freelancerInput.sideIncome + increaseAmount >= freeResult.totalMonthlyExpense
          ? Infinity
          : calculateFreelancerRunway({
              ...freelancerInput,
              sideIncome: freelancerInput.sideIncome + increaseAmount,
            }).realisticRunwayDays
        const monthsAdvanced  = isFinite(realisticDays) && isFinite(newRunway)
          ? Math.round((newRunway - realisticDays) / 30)
          : null

        return [
          {
            icon:  '💡',
            text:  '월',
            value: `${formatWon(freeResult.independenceIncome)} 벌면 퇴사 가능해요`,
            sub:   '생활비 + 이자 전액 커버 기준',
          },
          {
            icon:  '📅',
            text:  `부업 수입을 ${formatWon(increaseAmount)} 늘리면`,
            value: monthsAdvanced && monthsAdvanced > 0
              ? `독립이 ${monthsAdvanced}개월 앞당겨져요`
              : '흑자 전환이 가능해요',
            sub:   gap > 0 ? `목표까지 월 ${formatWon(gap)} 더 필요해요` : undefined,
          },
        ]
      })()
    : []

  // ── 공유 ──────────────────────────────────────────────
  function getShareText() {
    const days = isFinite(realisticDays) ? Math.floor(realisticDays) : '∞'
    const url  = typeof window !== 'undefined' ? window.location.origin : ''
    return isBusiness
      ? `나의 사업 런웨이는 D-${days}일!\n사장님 생존 계산기로 확인해보세요\n👉 ${url}`
      : `나는 지금 퇴사해도 ${days}일을 버틸 수 있어!\n직장인 독립 계산기로 확인해보세요\n👉 ${url}`
  }

  async function handleShare() {
    const text = getShareText()
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // 취소 등 — 클립보드로 폴백
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2500)
    } catch {
      // ignore
    }
  }

  // ── 메인 헤더 텍스트 ──────────────────────────────────
  const mainLabel = isBusiness ? '현실 런웨이' : '독립 가능 기간'
  const mainSub   = isBusiness
    ? isFinite(realisticDays)
      ? `지금 이대로면 ${formatDays(realisticDays)} 후 자금이 바닥나요`
      : '현재 매출이 지출을 초과하고 있어요 🎉'
    : isFinite(realisticDays)
    ? `지금 퇴사해도 ${formatDays(realisticDays)}을 버틸 수 있어요`
    : '부업 수입이 생활비를 초과하고 있어요 🎉'

  return (
    <div style={{ minHeight: '100dvh', background: '#F8F9FB', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430 }}>

        {/* ── 히어로 섹션 ────────────────────────────── */}
        <div style={{
          background:    meta.bg,
          padding:       '52px 24px 40px',
          textAlign:     'center',
          position:      'relative',
          overflow:      'hidden',
        }}>
          {/* 배경 원 장식 */}
          <div style={{
            position:   'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />
          <div style={{
            position:   'absolute', bottom: -40, left: -40,
            width: 160, height: 160, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />

          {/* 뒤로가기 */}
          <button
            onClick={() => router.back()}
            style={{
              position:   'absolute', top: 16, left: 20,
              background: 'rgba(255,255,255,0.15)',
              border:     'none',
              borderRadius: 20,
              padding:    '6px 14px',
              color:      '#fff',
              fontSize:   13,
              fontWeight: 700,
              cursor:     'pointer',
            }}
          >
            ← 수정
          </button>

          {/* 모드 레이블 */}
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, margin: '0 0 20px' }}>
            {meta.label}
          </p>

          {/* 메인 라벨 */}
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 700, margin: '0 0 8px' }}>
            {mainLabel}
          </p>

          {/* D- 접두사 (자영업자만) */}
          {isBusiness && isFinite(realisticDays) && (
            <p style={{
              fontSize:   16,
              fontWeight: 800,
              color:      'rgba(255,255,255,0.7)',
              margin:     '0 0 -4px',
            }}>
              D -
            </p>
          )}

          {/* 메인 숫자 */}
          <p style={{
            fontSize:      72,
            fontWeight:    900,
            color:         runwayColor,
            margin:        '0 0 4px',
            lineHeight:    1,
            letterSpacing: '-2px',
            filter:        'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
          }}>
            <CountUpNumber target={isFinite(realisticDays) ? Math.floor(realisticDays) : Infinity} />
          </p>

          {/* 단위 */}
          {isFinite(realisticDays) && (
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', fontWeight: 700, margin: '4px 0 16px' }}>
              일
            </p>
          )}

          {/* 서브 텍스트 */}
          <p style={{
            fontSize:   14,
            color:      'rgba(255,255,255,0.8)',
            margin:     '16px 0 0',
            lineHeight: 1.6,
          }}>
            {mainSub}
          </p>
        </div>

        {/* ── 카드 섹션 ───────────────────────────────── */}
        <div style={{
          padding:       '20px 16px 40px',
          display:       'flex',
          flexDirection: 'column',
          gap:           14,
        }}>

          <ScenarioCard items={scenarios} />

          {insights.length > 0 && <InsightCard items={insights} />}

          <PrescriptionCard level={dangerLevel} />

          {/* ── 하단 버튼 ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>

            {/* 다시 계산하기 */}
            <button
              onClick={() => router.push('/calculator')}
              style={{
                width:        '100%',
                height:       52,
                borderRadius: 14,
                border:       '1.5px solid #E2E8F0',
                background:   '#fff',
                fontSize:     15,
                fontWeight:   800,
                color:        '#1A1F5E',
                cursor:       'pointer',
                boxShadow:    '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              🔄 다시 계산하기
            </button>

            {/* 결과 공유하기 */}
            <button
              onClick={handleShare}
              style={{
                width:        '100%',
                height:       52,
                borderRadius: 14,
                border:       'none',
                background:   meta.bg,
                fontSize:     15,
                fontWeight:   800,
                color:        '#fff',
                cursor:       'pointer',
                boxShadow:    `0 6px 20px ${meta.bg}50`,
              }}
            >
              📤 결과 공유하기
            </button>

          </div>
        </div>
      </div>

      {/* 클립보드 복사 토스트 */}
      <div style={{
        position:   'fixed',
        bottom:     32,
        left:       '50%',
        transform:  `translateX(-50%) translateY(${toastVisible ? 0 : 20}px)`,
        opacity:    toastVisible ? 1 : 0,
        transition: 'all 0.3s ease',
        background: '#1A1F5E',
        color:      '#fff',
        borderRadius: 24,
        padding:    '10px 20px',
        fontSize:   13,
        fontWeight: 700,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        boxShadow:  '0 8px 24px rgba(0,0,0,0.2)',
        zIndex:     50,
      }}>
        ✓ 클립보드에 복사됐어요!
      </div>

    </div>
  )
}
