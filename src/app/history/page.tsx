'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getCalculationHistory,
  type CalculationRecord,
} from '@/lib/supabase/dashboard'
import {
  type DangerLevel,
  type BusinessInput,
  INDUSTRY_BENCHMARKS,
} from '@/utils/calculate'
import { useAuth } from '@/hooks/useAuth'
import { Loading } from '@/components/layout/Loading'

const HISTORY_LIMIT = 30

const MODE_BADGE = {
  business:   { label: '자영업', bg: '#EEF2FF', color: '#1A1F5E' },
  freelancer: { label: '직장인', bg: '#FFF1E6', color: '#C2410C' },
} as const

const DANGER_BADGE: Record<DangerLevel, { label: string; bg: string; color: string }> = {
  critical: { label: '위험', bg: '#FFF5F5', color: '#C53030' },
  warning:  { label: '경고', bg: '#FFFAF0', color: '#C05621' },
  caution:  { label: '주의', bg: '#FFFFF0', color: '#B7791F' },
  safe:     { label: '안전', bg: '#F0FFF4', color: '#276749' },
  infinite: { label: '흑자', bg: '#EBF8FF', color: '#2B6CB0' },
}

type Bucket = 'today' | 'yesterday' | 'thisWeek' | 'older'
const BUCKET_LABEL: Record<Bucket, string> = {
  today:     '오늘',
  yesterday: '어제',
  thisWeek:  '이번 주',
  older:     '이전',
}
const BUCKET_ORDER: Bucket[] = ['today', 'yesterday', 'thisWeek', 'older']

/* ── 날짜 유틸 ───────────────────────────────────────── */
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function bucketOf(iso: string, todayStart: number): Bucket {
  const dayMs = 1000 * 60 * 60 * 24
  const recordStart = startOfDay(new Date(iso))
  const diffDays = Math.floor((todayStart - recordStart) / dayMs)
  if (diffDays <= 0) return 'today'      // 오늘 이전 시각이 아닌 한 today
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7)   return 'thisWeek'
  return 'older'
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month:  'long',
    day:    'numeric',
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function industryLabel(record: CalculationRecord): string | null {
  if (record.mode !== 'business') return null
  const input = record.input_data as BusinessInput
  const ind = INDUSTRY_BENCHMARKS[input.industryType as keyof typeof INDUSTRY_BENCHMARKS]
  return ind?.label ?? null
}

/* ── 페이지 ──────────────────────────────────────────── */
export default function HistoryPage() {
  console.log('[history] rendering')
  const router = useRouter()
  const { user, loading: authLoading } = useAuth({ redirectTo: '/login' })
  console.log('[history] auth state — loading:', authLoading, 'user:', user?.id ?? null)
  const [records, setRecords]         = useState<CalculationRecord[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    console.log('[history] fetching list for user', user.id)
    let cancelled = false
    ;(async () => {
      const t0 = performance.now()
      try {
        const list = await getCalculationHistory(user.id, HISTORY_LIMIT)
        const elapsed = (performance.now() - t0).toFixed(0)
        console.log(`[history] list query done in ${elapsed}ms — count:`, list.length)
        if (cancelled) return
        setRecords(list)
      } catch (err) {
        console.error('[history data] error', err)
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  // 그룹핑
  const groups = useMemo(() => {
    const todayStart = startOfDay(new Date())
    const map: Record<Bucket, CalculationRecord[]> = {
      today: [], yesterday: [], thisWeek: [], older: [],
    }
    for (const r of records) {
      map[bucketOf(r.created_at, todayStart)].push(r)
    }
    return map
  }, [records])

  if (authLoading) return <Loading />
  if (!user)        return null
  if (dataLoading) return <Loading />

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F9FB',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: '100%', overflowX: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: 430 }}>

        {/* 헤더 */}
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 900, color: '#1A1F5E',
              margin: 0, letterSpacing: '-0.5px',
            }}>
              내 계산 기록
            </h1>
            {records.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 800,
                padding: '4px 10px', borderRadius: 14,
                background: '#EEF2FF', color: '#1A1F5E',
                letterSpacing: '-0.2px',
              }}>
                총 {records.length}회
                {records.length === HISTORY_LIMIT && '+'}
              </span>
            )}
          </div>
        </div>

        {/* 본문 */}
        {records.length === 0 ? (
          <EmptyState onStart={() => router.push('/calculator')} />
        ) : (
          <div style={{ padding: '0 16px 16px' }}>
            {BUCKET_ORDER.map(bucket => {
              const list = groups[bucket]
              if (list.length === 0) return null
              return (
                <div key={bucket} style={{ marginBottom: 20 }}>
                  <h2 style={{
                    fontSize: 12, fontWeight: 800, color: '#94A3B8',
                    margin: '0 4px 10px', letterSpacing: '0.5px',
                  }}>
                    {BUCKET_LABEL[bucket]}
                  </h2>
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}>
                    {list.map((r, i) => (
                      <HistoryCard
                        key={`${r.created_at}-${i}`}
                        record={r}
                        onClick={() => alert('상세 보기 준비중')}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── 빈 상태 ─────────────────────────────────────────── */
function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      padding: '60px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: 64 }}>🧮</div>
      <div>
        <p style={{
          fontSize: 17, fontWeight: 900, color: '#1A1F5E',
          margin: '0 0 6px', letterSpacing: '-0.3px',
        }}>
          아직 계산 기록이 없어요
        </p>
        <p style={{
          fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.6,
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
        계산하러 가기 →
      </button>
    </div>
  )
}

/* ── 기록 카드 ───────────────────────────────────────── */
function HistoryCard({
  record, onClick,
}: {
  record: CalculationRecord
  onClick: () => void
}) {
  const mode    = MODE_BADGE[record.mode]
  const danger  = DANGER_BADGE[record.danger_level]
  const days    = record.result_days
  const isBiz   = record.mode === 'business'
  const ind     = industryLabel(record)
  const dayLbl  = isBiz ? '런웨이' : '탈출까지'

  return (
    <button onClick={onClick}
      style={{
        width: '100%', padding: '16px 18px',
        background: '#fff', borderRadius: 16,
        border: '1px solid #E5E8EB',
        cursor: 'pointer', textAlign: 'left',
        transition: 'transform 0.12s, box-shadow 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* 상단: 날짜 + 모드/업종 배지 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 8, marginBottom: 12,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#94A3B8',
          letterSpacing: '-0.2px',
        }}>
          {formatDateTime(record.created_at)}
        </span>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Chip label={mode.label} bg={mode.bg} color={mode.color} />
          {ind && <Chip label={ind} bg="#F1F5F9" color="#475569" />}
        </div>
      </div>

      {/* 하단: 결과 + 위험도 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#94A3B8',
            margin: '0 0 2px', letterSpacing: '0.2px',
          }}>
            {dayLbl}
          </p>
          <p style={{
            fontSize: 24, fontWeight: 900, color: '#1A1F5E',
            margin: 0, letterSpacing: '-0.5px',
          }}>
            {days != null ? `D-${days}` : '∞'}
            {days != null && (
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: '#94A3B8', marginLeft: 4,
              }}>
                일
              </span>
            )}
          </p>
        </div>
        <Chip label={danger.label} bg={danger.bg} color={danger.color} large />
      </div>
    </button>
  )
}

function Chip({
  label, bg, color, large,
}: {
  label: string; bg: string; color: string; large?: boolean
}) {
  return (
    <span style={{
      fontSize: large ? 12 : 11,
      fontWeight: 800,
      padding: large ? '6px 14px' : '4px 10px',
      borderRadius: large ? 16 : 12,
      background: bg, color,
      whiteSpace: 'nowrap',
      letterSpacing: '-0.2px',
    }}>
      {label}
    </span>
  )
}
