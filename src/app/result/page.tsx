'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import {
  type BusinessResult,
  type FreelancerResult,
  formatWon,
  calculatePercentile,
  calculateGrade,
  calculateWorkerGrade,
  INDUSTRY_BENCHMARKS,
  INDUSTRY_USERS,
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

// JOB_BENCHMARKS는 FreelancerWizard에서 관리하므로 여기서 별도 정의
const JOB_LABELS: Record<string, string> = {
  office: '사무직', it: 'IT/개발', sales: '영업', creator: '크리에이터',
  finance: '금융/회계', marketing: '마케팅/홍보', construction: '건설/엔지니어링',
  education: '교육/연구', medical: '의료/보건', logistics: '물류/유통',
  manufacturing: '제조/생산', legal: '법무', hr: 'HR/인사',
  civil_servant: '공무원', other: '기타',
}

// 직군별 평균 저축률 벤치마크 (%)
const JOB_AVG_SAVINGS_RATE: Record<string, number> = {
  office: 22, it: 28, sales: 20, creator: 15,
  finance: 30, marketing: 22, construction: 25,
  education: 22, medical: 28, logistics: 20,
  manufacturing: 23, legal: 32, hr: 22,
  civil_servant: 20, other: 20,
}

const MODE_META = {
  business:   { bg: '#1A1F5E', label: '사장님 생존 계산기' },
  freelancer: { bg: '#FF6B35', label: '직장인 퇴사 계산기' },
}

type GradeTheme = {
  bg:           string
  gradientFrom: string
  text:         string
  sub:          string
  accent:       string
}

const GRADE_BG_COLORS: Record<string, GradeTheme> = {
  S: { bg: '#2A1F10', gradientFrom: '#8B6B3A', text: '#FFE0A0', sub: '#C4A060', accent: '#FFD700' },
  A: { bg: '#1A2540', gradientFrom: '#4A6A9A', text: '#A0C8FF', sub: '#6090C0', accent: '#60A5FA' },
  B: { bg: '#1A2E1A', gradientFrom: '#4A7A4A', text: '#A0E0A0', sub: '#60A060', accent: '#34A853' },
  C: { bg: '#2A2520', gradientFrom: '#7A6A50', text: '#D4C4A0', sub: '#A09070', accent: '#C4A060' },
  D: { bg: '#2A2010', gradientFrom: '#8A7030', text: '#E0C060', sub: '#A08830', accent: '#E8A032' },
  F: { bg: '#2A1A1A', gradientFrom: '#7A3A3A', text: '#FFA0A0', sub: '#C06060', accent: '#E04444' },
}

function LockedSection({
  title,
  locked,
  children,
}: {
  title:    string
  locked:   boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 4px 10px',
        fontSize: 18, fontWeight: 800, color: '#1A202C',
        letterSpacing: '-0.3px',
      }}>
        <span>{title}</span>
        {locked && <span aria-label="잠금" style={{ fontSize: 14 }}>🔒</span>}
      </div>
      <div style={{
        filter:        locked ? 'blur(8px)' : 'none',
        pointerEvents: locked ? 'none' : 'auto',
        userSelect:    locked ? 'none' : 'auto',
        transition:    'filter 0.3s ease',
      }}>
        {children}
      </div>
    </div>
  )
}

export default function ResultPage() {
  const router = useRouter()
  const { mode, result, businessInput, freelancerInput, _hydrated } =
    useCalculatorStore()

  const [toastVisible, setToastVisible]   = useState(false)
  const [toastMsg, setToastMsg]           = useState('✓ 클립보드에 복사됐어요!')
  const [savingImg, setSavingImg]         = useState(false)
  const [isCapturing, setIsCapturing]     = useState(false)
  const { shareViaKakao, isKakaoReady }   = useKakaoShare()
  const cardRef = useRef<HTMLDivElement>(null)

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  // 등급/순위 잠금 상태
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [shareCount, setShareCount] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsUnlocked(localStorage.getItem('result_unlocked') === '1')
    const sc = Number(localStorage.getItem('share_count') ?? '0')
    setShareCount(Number.isFinite(sc) ? sc : 0)
  }, [])

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
  const realisticDays = result.realisticRunwayDays
  const worstDays     = result.worstRunwayDays

  const isBusiness    = mode === 'business'
  const bizResult     = isBusiness ? (result as BusinessResult) : null
  const freeResult    = !isBusiness ? (result as FreelancerResult) : null

  // ── 퍼센타일 계산 ─────────────────────────────────────────
  let percentile     = 50
  let avgValue       = 0
  let industryLabel  = ''
  let diffDays       = 0

  if (isBusiness && bizResult) {
    const bench     = INDUSTRY_BENCHMARKS[businessInput.industryType]
    avgValue        = bench?.avgRunway ?? 70
    industryLabel   = bench?.label    ?? '동종업종'
    const myDays    = isFinite(realisticDays) ? realisticDays : avgValue * 5
    percentile      = calculatePercentile(myDays, avgValue)
    diffDays        = Math.round((isFinite(realisticDays) ? realisticDays : 0) - avgValue)
  } else if (freeResult) {
    const jobKey    = freelancerInput.jobType ?? 'other'
    const avgRate   = JOB_AVG_SAVINGS_RATE[jobKey] ?? 20
    industryLabel   = JOB_LABELS[jobKey] ?? '직장인'
    const myRate    = isFinite(freeResult.savingsRate) ? freeResult.savingsRate : 0
    percentile      = calculatePercentile(myRate, avgRate)
    avgValue        = avgRate
    diffDays        = myRate - avgRate  // 저축률 차이 (%)
  }

  // percentile = CDF (높을수록 상위권)
  // topPercentile = "상위 X%"에서 X 값 (낮을수록 상위권, 상위 5% = 상위 5%)
  const topPercentile = Math.round((100 - percentile) * 10) / 10
  const aboveAvg = percentile >= 50  // CDF 50% 이상 = 평균 이상

  // ── 등급 계산 ─────────────────────────────────────────────
  const gradeKey = isBusiness
    ? (businessInput.industryType as string)
    : (freelancerInput.jobType ?? 'other')
  const grade = isBusiness
    ? calculateGrade(realisticDays)
    : calculateWorkerGrade(freeResult?.escapeDays ?? Infinity)
  const userCount = INDUSTRY_USERS[gradeKey] ?? 1500
  const rawRank   = Math.round(userCount * (1 - percentile / 100))
  const rank      = Math.max(1, Math.min(userCount, rawRank))

  const improvedDays = Infinity

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
        const savings   = freeResult.monthlySavings
        const remaining = freeResult.remainingAmount
        const rate      = freeResult.savingsRate
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

  // ── 공유 텍스트 ───────────────────────────────────────────
  function getShareText() {
    const days = isFinite(realisticDays) ? Math.floor(realisticDays) : '∞'
    const url  = typeof window !== 'undefined' ? window.location.origin : ''
    return isBusiness
      ? `나는 ${days}일 버틸 수 있어요! 상위 ${topPercentile}%\n사장님 생존 계산기로 확인해보세요\n👉 ${url}`
      : `나의 퇴사까지 ${days}일! 상위 ${topPercentile}%\n직장인 퇴사 계산기로 확인해보세요\n👉 ${url}`
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
      showToast('✓ 클립보드에 복사됐어요!')
    } catch { /* ignore */ }
  }

  // 카톡 공유로 잠금 해제 카운트 증가
  async function handleShareForUnlock() {
    await handleShare()
    const next = Math.min(shareCount + 1, 3)
    setShareCount(next)
    localStorage.setItem('share_count', String(next))
    if (next >= 3) {
      setIsUnlocked(true)
      localStorage.setItem('result_unlocked', '1')
      showToast('🎉 잠금 해제 완료!')
    } else {
      showToast(`공유 ${next}/3 — 앞으로 ${3 - next}번 더!`)
    }
  }

  function handlePaidUnlock() {
    alert('결제 기능 준비 중입니다')
  }

  // ── 이미지 저장 ───────────────────────────────────────────
  async function saveResultImage() {
    if (!cardRef.current || savingImg) return
    setSavingImg(true)
    setIsCapturing(true)
    await new Promise(r => setTimeout(r, 120))  // DOM 업데이트 대기
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = '나의_해방계산기_결과.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      showToast('✓ 이미지가 저장됐어요!')
    } catch {
      showToast('이미지 저장에 실패했어요')
    } finally {
      setIsCapturing(false)
      setSavingImg(false)
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  const gateOpen  = isLoggedIn !== false

  // 게이지 점 위치: percentile(CDF)% 위치에 표시 (높을수록 오른쪽 = 상위권)
  const dotPos = Math.min(Math.max(percentile, 1), 99)

  // 등급별 히어로 이미지 (없으면 폴백 배경)
  const GRADE_IMAGE_MAP: Record<string, string | null> = {
    S: '/images/result_hero_S.png',
    A: '/images/result_hero_A.png',
    B: '/images/result_hero_B.png',
    C: '/images/result_hero_C.png',
    D: null, F: null,
  }
  const gradeImage = GRADE_IMAGE_MAP[grade.grade] ?? null

  // 등급별 톤 (이미지/데이터 영역 통일 배경 + 텍스트 컬러)
  const theme = GRADE_BG_COLORS[grade.grade] ?? GRADE_BG_COLORS.C

  return (
    <div style={{ minHeight: '100dvh', background: '#F8F9FB', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'hidden', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 430, overflowX: 'hidden' }}>

        {/* ── 이미지 캡처 대상 카드 ─────────────────────── */}
        <div ref={cardRef}>

          {/* ── 상단 등급 이미지 (정사각형 풀너비) ──────────── */}
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '1 / 1',
            background: theme.bg, overflow: 'hidden',
            display: 'block',
          }}>
            {gradeImage ? (
              <img
                src={gradeImage}
                alt={`${grade.grade} 등급 — ${grade.label}`}
                style={{
                  display: 'block', width: '100%', height: '100%', objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12, color: theme.text, padding: 24, textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 160, fontWeight: 900,
                  color: theme.accent, letterSpacing: '-6px', lineHeight: 1,
                  filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.35))',
                }}>
                  {grade.grade}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {grade.emoji} {grade.label}
                </div>
              </div>
            )}

            {/* 하단 → 글래스 카드 연결 그라데이션 (이미지 살짝 어둡게) */}
            <div
              aria-hidden
              style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                height: '30%', pointerEvents: 'none',
                background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 100%)',
              }}
            />

            {!isCapturing && (
              <button
                onClick={() => router.back()}
                style={{
                  position: 'absolute', top: 16, left: 16,
                  background: 'rgba(0,0,0,0.45)', border: 'none',
                  borderRadius: 20, padding: '6px 14px',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                  zIndex: 2,
                }}
              >
                ← 수정
              </button>
            )}
          </div>

          {/* ── 데이터 카드 (글래스모피즘, 이미지 하단과 겹침) ──── */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px 24px 0 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: -30,
            position: 'relative',
            zIndex: 2,
            padding: '20px 24px 28px',
            color: '#fff', textAlign: 'center',
            overflow: 'hidden',
          }}>
            {/* 1. 누렁이 해방까지 + 일수 */}
            <div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 700, margin: '0 0 16px' }}>
                누렁이 해방까지
              </p>
              <p style={{
                margin: '0 0 24px', lineHeight: 1,
                display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
              }}>
                <span style={{
                  fontSize: 64, fontWeight: 900, color: '#FFFFFF',
                  letterSpacing: '-2px',
                }}>
                  <CountUpNumber target={isFinite(realisticDays) ? Math.floor(realisticDays) : Infinity} />
                </span>
                {isFinite(realisticDays) && (
                  <span style={{
                    fontSize: 32, fontWeight: 700, color: '#FFFFFF',
                  }}>
                    일
                  </span>
                )}
              </p>
            </div>

            {/* 2. 누렁이 말풍선 — 한줄 타이틀 + 서브 메시지 */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '20px 24px',
              margin: '20px auto 0',
              position: 'relative',
              maxWidth: 320,
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {/* 말풍선 꼬리 (위쪽 중앙) */}
              <div style={{
                position: 'absolute',
                top: -8, left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: 16, height: 16,
                background: 'rgba(255,255,255,0.1)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              }} />
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}>
                누렁이의 한마디
              </div>
              <div style={{
                fontSize: 34, fontWeight: 800, fontStyle: 'normal',
                color: '#FFFFFF',
                marginBottom: 10,
                letterSpacing: '-0.02em', lineHeight: 1.4,
              }}>
                &ldquo;{grade.title}&rdquo;
              </div>
              <div style={{
                fontSize: 16, fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '-0.01em',
              }}>
                {grade.message}
              </div>
            </div>

            {/* 3. 분석 결과 유도 문구 (블러 영역 바로 위) */}
            {!isUnlocked && !isCapturing && (
              <p style={{
                fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600,
                margin: '24px 0 12px',
                animation: 'bounce-y 1.6s ease-in-out infinite',
              }}>
                {isBusiness ? '사장님' : '누렁이'}의 자세한 분석 결과가 준비됐어요 👇
              </p>
            )}

            {/* 4. 상위%/순위 잠금 블록 (오버레이로 항목 리스트 + 해제 버튼) */}
            <div style={{
              position: 'relative',
              minHeight: (!isUnlocked && !isCapturing) ? 520 : 'auto',
            }}>
              {/* 블러 처리된 실제 데이터 (배경) */}
              <div style={{
                filter:        (isUnlocked || isCapturing) ? 'none' : 'blur(8px)',
                pointerEvents: (isUnlocked || isCapturing) ? 'auto' : 'none',
                userSelect:    (isUnlocked || isCapturing) ? 'auto' : 'none',
                transition:    'filter 0.3s ease',
              }}>
                <p style={{
                  fontSize: 28, fontWeight: 900,
                  color: theme.accent,
                  margin: '0 0 4px', letterSpacing: '-0.5px',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
                }}>
                  상위 {topPercentile}%
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, margin: '0 0 12px' }}>
                  같은 {industryLabel} 기준
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20,
                    fontSize: 12, fontWeight: 800,
                    background: aboveAvg ? 'rgba(72,187,120,0.18)' : 'rgba(252,129,129,0.18)',
                    color: aboveAvg ? '#9AE6B4' : '#FC8181',
                    border: `1px solid ${aboveAvg ? 'rgba(72,187,120,0.35)' : 'rgba(252,129,129,0.35)'}`,
                  }}>
                    {aboveAvg ? '평균 이상 👍' : '위험 구간 ⚠️'}
                  </span>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20,
                    fontSize: 12, fontWeight: 700,
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.8)',
                  }}>
                    {isBusiness
                      ? `평균 대비 ${diffDays >= 0 ? '+' : ''}${diffDays}일`
                      : `저축률 평균 대비 ${diffDays >= 0 ? '+' : ''}${diffDays}%p`}
                  </span>
                </div>

                <div style={{ position: 'relative', padding: '0 4px' }}>
                  <div style={{
                    height: 8, borderRadius: 4,
                    background: 'linear-gradient(90deg, #FC8181 0%, #F6E05E 50%, #48BB78 100%)',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: `${dotPos}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      border: '2.5px solid rgba(0,0,0,0.18)',
                    }} />
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600,
                  }}>
                    <span>하위</span>
                    <span>평균</span>
                    <span>상위</span>
                  </div>
                </div>

                <p style={{
                  fontSize: 13, fontWeight: 700,
                  color: 'rgba(255,255,255,0.85)',
                  margin: '20px 0 0',
                }}>
                  같은 {industryLabel} {isBusiness ? '사장님' : '직장인'}{' '}
                  <span style={{ color: theme.accent, fontWeight: 900 }}>
                    {userCount.toLocaleString()}명
                  </span>
                  {' '}중{' '}
                  <span style={{ color: theme.accent, fontWeight: 900 }}>
                    {rank.toLocaleString()}등
                  </span>
                </p>
              </div>

              {/* 잠금 오버레이 — 숨겨진 항목 리스트 + 해제 버튼 */}
              {!isUnlocked && !isCapturing && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12, zIndex: 10, padding: 20,
                }}>
                  <div style={{
                    fontSize: 17, fontWeight: 900, color: '#fff',
                    textAlign: 'center', letterSpacing: '-0.3px', lineHeight: 1.3,
                  }}>
                    누렁이가 준비한 분석 결과
                  </div>
                  <div style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.65)',
                    textAlign: 'center', fontWeight: 600,
                    marginTop: -4,
                  }}>
                    카톡 공유 3회로 무료 확인하세요!
                  </div>
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    width: '100%', maxWidth: 300,
                  }}>
                    {(isBusiness
                      ? [
                          { title: '내 순위는 몇 등일까?', desc: '같은 업종 사장님들 중 정확한 등수를 확인해보세요' },
                          {
                            title: 'S등급 사장님의 계산 결과가 궁금하지 않으세요?',
                            desc:  '동일 업종 S등급 사장님의 핵심 지표를 확인해보세요',
                            preview: {
                              rows: [
                                { label: '월 매출', value: '₩4,200만원' },
                                { label: '고정비', value: '₩185만원' },
                                { label: '순이익', value: '₩320만원' },
                              ],
                              footer: '🔒 990원으로 전체 결과 확인',
                            },
                          },
                          { title: '최악의 경우, 며칠 버틸 수 있을까?', desc: '매출이 줄거나 비용이 늘면 어떻게 될지 미리 계산해봐요' },
                          { title: '지금 가장 먼저 해야 할 것은?',    desc: '누렁이가 사장님 상황에 딱 맞는 조언을 해드려요' },
                        ]
                      : [
                          { title: '내 순위는 몇 등일까?', desc: '같은 직종 직장인들 중 정확한 등수를 확인해보세요' },
                          {
                            title: 'S등급 직장인의 계산 결과가 궁금하지 않으세요?',
                            desc:  '동일 직군 S등급 직장인의 핵심 지표를 확인해보세요',
                            preview: {
                              rows: [
                                { label: '연봉',     value: '₩6,800만원' },
                                { label: '월 저축액', value: '₩240만원' },
                                { label: '생활비',   value: '₩185만원' },
                              ],
                              footer: '🔒 990원으로 전체 결과 확인',
                            },
                          },
                          { title: '최악의 경우, 며칠 버틸 수 있을까?', desc: '연봉이 줄거나 지출이 늘면 어떻게 될지 미리 계산해봐요' },
                          { title: '지금 가장 먼저 해야 할 것은?',    desc: '누렁이가 직장인 상황에 딱 맞는 조언을 해드려요' },
                        ]
                    ).map((item, i) => {
                      const preview = (item as { preview?: { rows: { label: string; value: string }[]; footer: string } }).preview
                      return (
                        <div key={i} style={{
                          background: 'rgba(255,255,255,0.08)',
                          borderRadius: 12, padding: '12px 14px',
                          border: '1px solid rgba(255,255,255,0.06)',
                          textAlign: 'left',
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3, lineHeight: 1.4 }}>
                            {item.desc}
                          </div>

                          {preview && (
                            <div style={{ marginTop: 10 }}>
                              <div style={{
                                display: 'flex', flexDirection: 'column', gap: 6,
                                padding: '10px 12px',
                                background: 'rgba(0,0,0,0.25)',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}>
                                {preview.rows.map((row, j) => (
                                  <div key={j} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                      {row.label}
                                    </span>
                                    <span style={{
                                      fontSize: 13, color: '#fff', fontWeight: 800,
                                      filter: 'blur(5px)',
                                      userSelect: 'none',
                                      WebkitUserSelect: 'none',
                                    }}>
                                      {row.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div style={{
                                marginTop: 8,
                                fontSize: 11, fontWeight: 700,
                                color: 'rgba(255,255,255,0.6)',
                                textAlign: 'center',
                              }}>
                                {preview.footer}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* 해제 버튼 */}
                  <div style={{
                    display: 'flex', gap: 8, marginTop: 8,
                    flexWrap: 'wrap', justifyContent: 'center',
                  }}>
                    <button
                      onClick={handleShareForUnlock}
                      style={{
                        padding: '12px 18px', borderRadius: 12,
                        background: '#FEE500', color: '#3C1E1E',
                        fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      🐾 카톡 공유 ({shareCount}/3)
                    </button>
                    <button
                      onClick={handlePaidUnlock}
                      style={{
                        padding: '12px 18px', borderRadius: 12,
                        background: '#03C75A', color: '#000000',
                        fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      💰 990원으로 해제
                    </button>
                  </div>

                  {/* 사회적 증거 — 누적 확인 인원 */}
                  <p style={{
                    fontSize: 16, fontWeight: 700,
                    color: 'rgba(255,255,255,0.8)',
                    margin: '16px 0', textAlign: 'center',
                  }}>
                    이미{' '}
                    <span style={{ fontSize: 18, color: '#03C75A', fontWeight: 900 }}>
                      {userCount.toLocaleString()}명
                    </span>
                    의 {isBusiness ? '사장님' : '직장인'}이 확인했어요
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── 5. 브랜딩 바 ───────────────────────────── */}
          <div style={{
            background: '#1A1F5E', padding: '10px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>🐾</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.3px' }}>
              누렁이 해방 계산기 · survival-calculator-ten.vercel.app
            </span>
          </div>
        </div>
        {/* ── 캡처 영역 끝 ─────────────────────────────── */}

        {/* ── 카드 섹션 ───────────────────────────────── */}
        <div style={{ padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {insights.length > 0 && (
            <LockedSection title="핵심 진단" locked={!isUnlocked && !isCapturing}>
              <InsightCard items={insights} />
            </LockedSection>
          )}

          {isBusiness && (
            <LockedSection
              title="우리 업종에서 나는 어디쯤?"
              locked={!isUnlocked && !isCapturing}
            >
              <BenchmarkCard
                input={businessInput}
                currentDays={realisticDays}
                isLoggedIn={gateOpen}
              />
            </LockedSection>
          )}

          <LockedSection title="만약 이렇게 되면?" locked={!isUnlocked && !isCapturing}>
            <ScenarioCard items={scenarios} />
          </LockedSection>

          {isBusiness && (
            <LockedSection title="만약에 계산기" locked={!isUnlocked && !isCapturing}>
              <LoginGate
                isLoggedIn={gateOpen}
                message="만약에 계산기를 사용해보세요"
                sub="로그인하면 무제한으로 가정해볼 수 있어요"
              >
                <CostSlider input={businessInput} currentDays={realisticDays} />
              </LoginGate>
            </LockedSection>
          )}

          {!isBusiness && (
            <LockedSection title="만약에 계산기" locked={!isUnlocked && !isCapturing}>
              <LoginGate
                isLoggedIn={gateOpen}
                message="만약에 계산기를 사용해보세요"
                sub="로그인하면 무제한으로 가정해볼 수 있어요"
              >
                <FreelancerSlider input={freelancerInput} currentDays={realisticDays} />
              </LoginGate>
            </LockedSection>
          )}

          <LockedSection title="누렁이의 조언" locked={!isUnlocked && !isCapturing}>
            <PrescriptionCard level={dangerLevel} mode={mode} isLoggedIn={gateOpen} />
          </LockedSection>

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

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={saveResultImage}
                disabled={savingImg}
                style={{
                  flex: 1, height: 52, borderRadius: 14,
                  border: 'none',
                  background: savingImg ? '#E2E8F0' : '#F7FAFC',
                  fontSize: 14, fontWeight: 800,
                  color: savingImg ? '#A0AEC0' : '#1A1F5E',
                  cursor: savingImg ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {savingImg ? '저장 중...' : '📸 이미지 저장'}
              </button>

              <button
                onClick={handleShare}
                style={{
                  flex: 1, height: 52, borderRadius: 14,
                  border: 'none', background: meta.bg,
                  fontSize: 14, fontWeight: 800, color: '#fff',
                  cursor: 'pointer', boxShadow: `0 6px 20px ${meta.bg}50`,
                }}
              >
                💬 카카오 공유
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 토스트 */}
      <div style={{
        position: 'fixed', bottom: 32, left: '50%',
        transform: `translateX(-50%) translateY(${toastVisible ? 0 : 20}px)`,
        opacity: toastVisible ? 1 : 0, transition: 'all 0.3s ease',
        background: '#1A1F5E', color: '#fff', borderRadius: 24,
        padding: '10px 20px', fontSize: 13, fontWeight: 700,
        pointerEvents: 'none', whiteSpace: 'nowrap',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 50,
      }}>
        {toastMsg}
      </div>
    </div>
  )
}
