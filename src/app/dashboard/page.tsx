'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getLatestCalculation,
  getPreviousCalculation,
  getRunwayHistory,
  getDailyInputHistory,
  type CalculationRecord,
  type DailyInputAggregate,
} from '@/lib/supabase/dashboard'
import {
  type BusinessInput,
  type FreelancerInput,
  type DangerLevel,
  VARIABLE_RATE,
  formatWon,
} from '@/utils/calculate'
import {
  TrendChart,
  RevenueExpenseChart,
  formatShort,
} from '@/components/dashboard/Charts'
import { useAuth } from '@/hooks/useAuth'
import { Loading } from '@/components/layout/Loading'

/* ── 상수 ────────────────────────────────────────────── */
const HERO_BG = {
  business:   'linear-gradient(135deg, #1A1F5E 0%, #2D3399 100%)',
  freelancer: 'linear-gradient(135deg, #FF6B35 0%, #E8590C 100%)',
} as const

const DANGER_COLOR: Record<DangerLevel, string> = {
  critical: '#FC8181',
  warning:  '#F6AD55',
  caution:  '#ECC94B',
  safe:     '#68D391',
  infinite: '#63B3ED',
}

const REACTION_BIZ: Record<DangerLevel, { emoji: string; label: string; sub: string }> = {
  critical: { emoji: '😱', label: '비상입니다',          sub: '통장이 비명을 지르고 있어요' },
  warning:  { emoji: '😰', label: '위험 신호',           sub: '아직 늦지 않았어요. 하지만 빨리요.' },
  caution:  { emoji: '😐', label: '아슬아슬한 줄타기',   sub: '괜찮아 보이지만 방심 금물' },
  safe:     { emoji: '😊', label: '아직은 괜찮아요',     sub: '여유 있을 때 다음 수를 준비하세요' },
  infinite: { emoji: '🤑', label: '흑자 운영 중',        sub: '확장을 고민할 때예요' },
}
const REACTION_FREE: Record<DangerLevel, { emoji: string; label: string; sub: string }> = {
  critical: { emoji: '💀', label: '퇴사는 다음 생에…',   sub: '현재 속도로는 탈출이 요원해요' },
  warning:  { emoji: '😤', label: '멀지만 보이긴 해요',  sub: '부업 하나면 확 당겨질 수 있어요' },
  caution:  { emoji: '👀', label: '출구가 보여요!',      sub: '터널 끝에 빛이 보입니다' },
  safe:     { emoji: '🔥', label: '곧이에요!',           sub: '1년 안에 탈출 가능' },
  infinite: { emoji: '🏆', label: '이미 자유인이세요',   sub: '목표 달성! 회사가 필요로 해요' },
}

const TODAY_MSG_BIZ: Record<DangerLevel, string[]> = {
  safe:     ['오늘도 무사히! 이 기세로 쭉 가시죠', '안정적이에요. 이 여유를 성장에 투자하세요'],
  caution:  ['아슬아슬하지만 아직 괜찮아요', '긴장의 끈을 놓지 마세요'],
  warning:  ['사장님, 슬슬 움직여야 할 때예요', '지금 작은 변화가 큰 차이를 만들어요'],
  critical: ['지금이 가장 중요한 순간이에요', '포기하지 마세요. 방법은 있어요'],
  infinite: ['흑자 운영 중! 오늘은 확장을 그려볼 시간', '이미 잘 굴러가요. 다음 챕터를 준비하세요'],
}
const TODAY_MSG_FREE: Record<DangerLevel, string[]> = {
  safe:     ['곧이에요! 사직서 초안이라도 써볼까요?', '출구가 코앞이에요!'],
  caution:  ['터널 끝에 빛이 보여요', '조금만 더 조이면 확 당겨져요'],
  warning:  ['멀지만 포기하긴 일러요', '부업 하나면 확 달라질 수 있어요'],
  critical: ['지금은 내공을 쌓을 때예요', '작은 저축이 큰 자유를 만들어요'],
  infinite: ['이미 자유인! 오늘은 다음 챕터를 그려요', '회사가 당신을 붙잡고 있을 뿐이에요'],
}

/* ── 기간 탭 ─────────────────────────────────────────── */
type Period = '1w' | '1m' | '3m'
const PERIOD_DAYS: Record<Period, number> = { '1w': 7, '1m': 30, '3m': 90 }
const PERIOD_LIMIT: Record<Period, number> = { '1w': 10, '1m': 30, '3m': 90 }
const PERIOD_LABEL: Record<Period, string> = { '1w': '1주', '1m': '1개월', '3m': '3개월' }

/* ── 페이지 ──────────────────────────────────────────── */
export default function DashboardPage() {
  console.log('[dashboard] rendering')
  const router = useRouter()
  const { user, loading: authLoading } = useAuth({ redirectTo: '/' })
  console.log('[dashboard] auth state — loading:', authLoading, 'user:', user?.id ?? null)

  const [latest, setLatest]           = useState<CalculationRecord | null>(null)
  const [previous, setPrevious]       = useState<CalculationRecord | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  // 추이 차트 데이터
  const [period, setPeriod]               = useState<Period>('1m')
  const [runwayHistory, setRunwayHistory] = useState<CalculationRecord[]>([])
  const [inputHistory, setInputHistory]   = useState<DailyInputAggregate[]>([])

  // 인증 후 latest/previous 조회
  useEffect(() => {
    if (!user) return
    console.log('[dashboard] fetching latest/previous calc for user', user.id)
    let cancelled = false
    ;(async () => {
      const t0 = performance.now()
      try {
        const [l, p] = await Promise.all([
          getLatestCalculation(user.id),
          getPreviousCalculation(user.id),
        ])
        const elapsed = (performance.now() - t0).toFixed(0)
        console.log(`[dashboard] calc query done in ${elapsed}ms — latest:`, l ? 'yes' : 'null', 'previous:', p ? 'yes' : 'null')
        if (cancelled) return
        setLatest(l)
        setPrevious(p)
      } catch (err) {
        console.error('[dashboard data] error', err)
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  // 기간 변경 시 추이 데이터 재조회
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const [rh, ih] = await Promise.all([
          getRunwayHistory(user.id, PERIOD_LIMIT[period]),
          getDailyInputHistory(user.id, PERIOD_DAYS[period]),
        ])
        if (cancelled) return
        setRunwayHistory(rh)
        setInputHistory(ih)
      } catch (err) {
        console.error('[dashboard trends]', err)
      }
    })()
    return () => { cancelled = true }
  }, [user, period])

  // 오늘의 한마디는 마운트 시 한 번만 결정 (재렌더링에 따라 흔들리지 않게)
  const todayMsg = useMemo(() => {
    if (!latest) return ''
    const pool = latest.mode === 'business'
      ? TODAY_MSG_BIZ[latest.danger_level]
      : TODAY_MSG_FREE[latest.danger_level]
    return pool[Math.floor(Math.random() * pool.length)]
  }, [latest])

  if (authLoading) return <Loading />
  if (!user)        return null
  if (dataLoading) return <Loading />
  if (!latest) {
    return <DashboardEmpty onStart={() => router.push('/calculator')} />
  }

  const isBiz    = latest.mode === 'business'
  const days     = latest.result_days
  const prevDays = previous?.result_days ?? null
  const reaction = isBiz ? REACTION_BIZ[latest.danger_level] : REACTION_FREE[latest.danger_level]
  const dColor   = DANGER_COLOR[latest.danger_level]

  // 변화량 (양수 = 늘어남). 자영업: 늘어남이 좋음 / 직장인(탈출): 줄어듦이 좋음
  const diff = (days != null && prevDays != null) ? days - prevDays : null
  const diffGood: boolean | null = diff == null || diff === 0
    ? null
    : isBiz ? diff > 0 : diff < 0

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F9FB',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: '100%', overflowX: 'hidden',
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        paddingBottom: 80,  // 하단 네비바 공간
      }}>

        {/* ── 히어로 ───────────────────────────────── */}
        <div style={{
          background: HERO_BG[latest.mode],
          padding: '40px 24px 36px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* 배경 장식 */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />

          <p style={{
            fontSize: 13, fontWeight: 700,
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 8px', letterSpacing: '0.3px',
          }}>
            {isBiz ? '사장님의 런웨이' : '탈출까지'}
          </p>

          {days != null ? (
            <p style={{
              fontSize: 64, fontWeight: 900, color: dColor,
              margin: '0 0 8px', lineHeight: 1, letterSpacing: '-2.5px',
              filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.25))',
            }}>
              {days}일
            </p>
          ) : (
            <p style={{
              fontSize: 64, fontWeight: 900, color: dColor,
              margin: '0 0 8px', lineHeight: 1,
            }}>
              ∞
            </p>
          )}

          {/* 변화 배지 */}
          {diff != null && diffGood != null && (
            <div style={{
              display: 'inline-block',
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(255,255,255,0.18)',
              fontSize: 13, fontWeight: 800,
              color: diffGood ? '#9AE6B4' : '#FEB2B2',
              marginBottom: 18,
              letterSpacing: '-0.2px',
            }}>
              {diff > 0 ? '+' : ''}{diff}일 {diff > 0 ? '▲' : '▼'}
            </div>
          )}

          {/* 직장인: 진행률 바 */}
          {!isBiz && (() => {
            const free = latest.input_data as FreelancerInput
            if (free.targetAmount <= 0) return null
            const progress  = Math.min((free.assets / free.targetAmount) * 100, 100)
            const remaining = Math.max(free.targetAmount - free.assets, 0)
            return (
              <div style={{
                marginTop: diff == null ? 16 : 0,
                marginBottom: 18,
                padding: '0 4px',
              }}>
                <div style={{
                  height: 8, borderRadius: 4,
                  background: 'rgba(255,255,255,0.2)',
                  overflow: 'hidden', marginBottom: 8,
                }}>
                  <div style={{
                    height: '100%', width: `${progress}%`,
                    background: '#fff', borderRadius: 4,
                    transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
                <p style={{
                  fontSize: 13, fontWeight: 800,
                  color: 'rgba(255,255,255,0.92)', margin: 0,
                  letterSpacing: '-0.2px',
                }}>
                  {progress.toFixed(0)}% 달성
                  {remaining > 0 && ` — 목표까지 ${formatWon(remaining)}`}
                </p>
              </div>
            )
          })()}

          {/* 감정 */}
          <div style={{
            fontSize: 36, marginTop: 4,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          }}>
            {reaction.emoji}
          </div>
          <p style={{
            fontSize: 16, fontWeight: 800,
            color: 'rgba(255,255,255,0.95)',
            margin: '4px 0 4px', letterSpacing: '-0.3px',
          }}>
            {reaction.label}
          </p>
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.78)',
            margin: 0, fontWeight: 600,
          }}>
            {reaction.sub}
          </p>
        </div>

        {/* ── 카드 영역 ─────────────────────────────── */}
        <div style={{
          padding: '20px 16px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {isBiz
            ? <BusinessThisMonth input={latest.input_data as BusinessInput} />
            : <FreelancerThisMonth input={latest.input_data as FreelancerInput} />}

          {/* 오늘의 한마디 */}
          <Card>
            <p style={{
              fontSize: 12, fontWeight: 800, color: '#94A3B8',
              margin: '0 0 8px', letterSpacing: '0.3px',
            }}>
              💬 오늘의 한마디
            </p>
            <p style={{
              fontSize: 15, fontWeight: 800, color: '#1A1F5E',
              margin: 0, lineHeight: 1.55, letterSpacing: '-0.3px',
            }}>
              {todayMsg}
            </p>
          </Card>

          {/* 추이 차트 */}
          <PeriodTabs value={period} onChange={setPeriod} />
          {isBiz ? (
            <BusinessTrendCharts
              runwayHistory={runwayHistory}
              inputHistory={inputHistory}
            />
          ) : (
            <FreelancerTrendCharts
              runwayHistory={runwayHistory}
              targetAmount={(latest.input_data as FreelancerInput).targetAmount}
            />
          )}
        </div>

        {/* ── 액션 버튼 ─────────────────────────────── */}
        <div style={{
          padding: '0 16px 16px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        }}>
          <ActionButton
            icon="📝" label="간편 입력"
            onClick={() => alert('준비중입니다')}
          />
          <ActionButton
            icon="🧮" label="다시 계산"
            accent
            onClick={() => router.push('/calculator')}
          />
          <ActionButton
            icon="📊" label="상세 분석"
            onClick={() => router.push('/result')}
          />
        </div>
      </div>
    </div>
  )
}

/* ── 자영업자: 이번 달 현황 ──────────────────────────── */
function BusinessThisMonth({ input }: { input: BusinessInput }) {
  const variableRate = VARIABLE_RATE[input.industryType] ?? 0.35
  const variableCost = input.monthlyRevenue * variableRate
  const totalExpense = input.fixedCost + input.loanInterest + variableCost
  const netProfit    = input.monthlyRevenue - totalExpense
  const isProfit     = netProfit >= 0

  return (
    <Card>
      <p style={{
        fontSize: 12, fontWeight: 800, color: '#94A3B8',
        margin: '0 0 14px', letterSpacing: '0.3px',
      }}>
        📅 이번 달 현황
      </p>
      <Row label="월 매출" value={formatWon(input.monthlyRevenue)} />
      <Row label="월 지출" value={formatWon(totalExpense)} />
      <Divider />
      <Row
        label="순이익" bold
        value={(isProfit ? '+' : '') + formatWon(netProfit)}
        valueColor={isProfit ? '#38A169' : '#E53E3E'}
      />
    </Card>
  )
}

/* ── 직장인: 이번 달 현황 ─────────────────────────── */
function FreelancerThisMonth({ input }: { input: FreelancerInput }) {
  const livingExpense = input.monthlyExpense + input.loanInterest
  const monthlySaving = input.salary - livingExpense + input.sideIncome

  return (
    <Card>
      <p style={{
        fontSize: 12, fontWeight: 800, color: '#94A3B8',
        margin: '0 0 14px', letterSpacing: '0.3px',
      }}>
        📅 이번 달 현황
      </p>
      <Row label="월급"   value={formatWon(input.salary)} />
      <Row label="생활비" value={formatWon(livingExpense)} />
      <Divider />
      <Row
        label="저축액" bold
        value={(monthlySaving >= 0 ? '+' : '') + formatWon(monthlySaving)}
        valueColor={monthlySaving >= 0 ? '#38A169' : '#E53E3E'}
      />
    </Card>
  )
}

/* ── 공통 ─────────────────────────────────────────── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid #E5E8EB',
      padding: '18px 20px',
    }}>
      {children}
    </div>
  )
}

function Row({ label, value, valueColor, bold }: {
  label: string; value: string; valueColor?: string; bold?: boolean
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '4px 0',
    }}>
      <span style={{
        fontSize: bold ? 14 : 13,
        fontWeight: bold ? 800 : 600,
        color: bold ? '#1A1F5E' : '#64748B',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: bold ? 17 : 15,
        fontWeight: bold ? 900 : 800,
        color: valueColor ?? '#1A1F5E',
        letterSpacing: '-0.3px',
      }}>
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#F1F5F9', margin: '10px 0' }} />
}

function ActionButton({ icon, label, onClick, accent }: {
  icon: string; label: string; onClick: () => void; accent?: boolean
}) {
  return (
    <button onClick={onClick}
      style={{
        padding: '14px 8px', borderRadius: 14, cursor: 'pointer',
        background: accent ? 'linear-gradient(135deg, #1A1F5E, #4F46E5)' : '#fff',
        border: accent ? 'none' : '1px solid #E5E8EB',
        color: accent ? '#fff' : '#1A1F5E',
        fontSize: 12, fontWeight: 800,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        boxShadow: accent ? '0 6px 18px rgba(26,31,94,0.3)' : 'none',
      }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <span style={{ letterSpacing: '-0.2px' }}>{label}</span>
    </button>
  )
}

/* ── 빈 상태 (로그인 + 기록 없음) ───────────────────────── */
function DashboardEmpty({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F9FB',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      width: '100%', overflowX: 'hidden',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 64, lineHeight: 1 }}>🧮</div>
        <div>
          <p style={{
            fontSize: 18, fontWeight: 900, color: '#1A1F5E',
            margin: '0 0 6px', letterSpacing: '-0.3px',
          }}>
            아직 계산 기록이 없어요
          </p>
          <p style={{
            fontSize: 14, color: '#64748B',
            margin: 0, lineHeight: 1.6,
          }}>
            첫 계산을 해보세요!
          </p>
        </div>
        <button onClick={onStart}
          style={{
            marginTop: 8, height: 52, padding: '0 32px',
            borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #1A1F5E, #4F46E5)',
            color: '#fff', fontSize: 15, fontWeight: 900,
            cursor: 'pointer', letterSpacing: '-0.3px',
            boxShadow: '0 8px 20px rgba(26,31,94,0.3)',
          }}>
          🧮 계산하러 가기
        </button>
      </div>
    </div>
  )
}

/* ── 기간 선택 탭 ──────────────────────────────────────── */
function PeriodTabs({
  value, onChange,
}: {
  value: Period; onChange: (p: Period) => void
}) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: 4,
      background: '#F1F5F9', borderRadius: 12,
      width: 'fit-content', alignSelf: 'flex-end',
    }}>
      {(['1w', '1m', '3m'] as Period[]).map(p => {
        const sel = p === value
        return (
          <button key={p} onClick={() => onChange(p)}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 800,
              background: sel ? '#fff' : 'transparent',
              color:      sel ? '#1A1F5E' : '#64748B',
              boxShadow:  sel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              letterSpacing: '-0.2px',
              transition: 'all 0.15s',
            }}>
            {PERIOD_LABEL[p]}
          </button>
        )
      })}
    </div>
  )
}

/* ── 차트 카드 래퍼 ────────────────────────────────────── */
function ChartCard({ title, sub, children }: {
  title: string; sub?: string; children: React.ReactNode
}) {
  return (
    <Card>
      <div style={{ marginBottom: 12 }}>
        <p style={{
          fontSize: 13, fontWeight: 900, color: '#1A1F5E',
          margin: 0, letterSpacing: '-0.3px',
        }}>
          {title}
        </p>
        {sub && (
          <p style={{
            fontSize: 11, fontWeight: 600, color: '#94A3B8',
            margin: '2px 0 0',
          }}>
            {sub}
          </p>
        )}
      </div>
      {children}
    </Card>
  )
}

/* ── 자영업자 차트 묶음 ─────────────────────────────────── */
function BusinessTrendCharts({
  runwayHistory, inputHistory,
}: {
  runwayHistory: CalculationRecord[]
  inputHistory:  DailyInputAggregate[]
}) {
  const trendPoints = runwayHistory.map(r => ({
    date:  r.created_at,
    value: r.result_days ?? 0,
  }))

  const barPoints = inputHistory.map(i => ({
    date:    i.date,
    revenue: i.revenue,
    expense: i.expense,
  }))

  return (
    <>
      <ChartCard title="📈 런웨이 추이" sub="계산 기록 기반">
        <TrendChart
          points={trendPoints}
          unit="일"
          lineColor="#38A169"
          fillTop="#38A169"
          fillBottom="#FC8181"
          emptyMessage="계산 기록이 2건 이상이면 추이를 볼 수 있어요"
        />
      </ChartCard>

      <ChartCard title="💰 매출 vs 지출" sub="간편 입력 일별 합산">
        <RevenueExpenseChart
          points={barPoints}
          emptyMessage="간편 입력을 시작하면 매출/지출 추이를 볼 수 있어요"
        />
      </ChartCard>
    </>
  )
}

/* ── 직장인 차트 묶음 ───────────────────────────────────── */
function FreelancerTrendCharts({
  runwayHistory, targetAmount,
}: {
  runwayHistory: CalculationRecord[]
  targetAmount:  number
}) {
  // 자산 추이: 각 계산의 input_data.assets
  const assetPoints = runwayHistory
    .map(r => ({
      date:  r.created_at,
      value: ((r.input_data as FreelancerInput)?.assets ?? 0),
    }))
    .filter(p => p.value > 0)

  // 자산 진행률 (최신 자산 기준)
  const latestAssets = assetPoints.length > 0 ? assetPoints[assetPoints.length - 1].value : 0
  const progressPct  = targetAmount > 0
    ? Math.min((latestAssets / targetAmount) * 100, 100)
    : 0

  // 탈출일 추이
  const escapePoints = runwayHistory.map(r => ({
    date:  r.created_at,
    value: r.result_days ?? 0,
  }))
  // 트렌드 방향: 최신이 처음보다 작으면(=가까워짐) 초록, 크면 빨강
  const escapeImproving = escapePoints.length >= 2
    ? escapePoints[escapePoints.length - 1].value <= escapePoints[0].value
    : true
  const escapeColor = escapeImproving ? '#38A169' : '#E53E3E'

  return (
    <>
      <ChartCard
        title="📈 자산 증가 추이"
        sub={targetAmount > 0 ? `목표까지 ${progressPct.toFixed(0)}% 달성` : undefined}
      >
        <TrendChart
          points={assetPoints}
          lineColor="#FF6B35"
          fillTop="#FF6B35"
          fillBottom="#FF6B35"
          targetValue={targetAmount > 0 ? targetAmount : undefined}
          targetLabel={targetAmount > 0 ? '목표' : undefined}
          formatValue={v => formatShort(v)}
          emptyMessage="계산 기록이 2건 이상이면 자산 추이를 볼 수 있어요"
        />
      </ChartCard>

      <ChartCard
        title="🚀 탈출일 변화"
        sub={escapePoints.length >= 2
          ? (escapeImproving ? '탈출이 점점 가까워지고 있어요' : '탈출이 점점 멀어지고 있어요')
          : undefined}
      >
        <TrendChart
          points={escapePoints}
          unit="일"
          lineColor={escapeColor}
          fillTop={escapeColor}
          fillBottom={escapeColor}
          emptyMessage="계산 기록이 2건 이상이면 탈출일 변화를 볼 수 있어요"
        />
      </ChartCard>
    </>
  )
}
