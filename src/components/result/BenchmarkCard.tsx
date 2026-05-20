'use client'

import { type BusinessInput, INDUSTRY_BENCHMARKS, formatWon } from '@/utils/calculate'
import { LoginGate } from './LoginGate'

interface Props {
  input:       BusinessInput
  currentDays: number
  isLoggedIn?: boolean
}

export function BenchmarkCard({ input, currentDays, isLoggedIn = true }: Props) {
  const benchmark = INDUSTRY_BENCHMARKS[input.industryType as keyof typeof INDUSTRY_BENCHMARKS]
    ?? INDUSTRY_BENCHMARKS.other
  const avgDays = benchmark.avgRunway

  // 업종 평균 대비 내 위치 (%)
  const ratio     = isFinite(currentDays) ? currentDays / avgDays : 2
  const pctOfAvg  = Math.round(ratio * 100)
  const barWidth  = Math.min(ratio, 2) * 50 // 최대 100%

  // 고정비 비교
  const fixedDiff     = input.fixedCost - benchmark.fixedCost
  const fixedBetter   = fixedDiff <= 0
  // 매출 비교
  const revDiff       = input.monthlyRevenue - benchmark.revenue
  const revBetter     = revDiff >= 0

  const overallGrade  =
    pctOfAvg >= 150 ? { label: '우수', emoji: '🏆', color: '#38A169', bg: '#F0FFF4' }
    : pctOfAvg >= 100 ? { label: '양호', emoji: '👍', color: '#4299E1', bg: '#EBF8FF' }
    : pctOfAvg >= 70  ? { label: '주의', emoji: '⚠️', color: '#D69E2E', bg: '#FFFFF0' }
    : { label: '위험', emoji: '🚨', color: '#E53E3E', bg: '#FFF5F5' }

  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid #F1F5F9',
      }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>
          📊 {benchmark.emoji} {benchmark.label} 업종 대비 내 위치
        </p>
      </div>

      {/* 종합 등급 — 비로그인 시 블러 */}
      <div style={{ margin: '16px 20px' }}>
        <LoginGate
          isLoggedIn={isLoggedIn}
          message="내 순위가 궁금하다면?"
          sub="로그인하면 같은 업종 순위를 알려드려요"
        >
          <div style={{
            padding: '16px 18px', borderRadius: 16,
            background: overallGrade.bg,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 32 }}>{overallGrade.emoji}</span>
            <div>
              <p style={{
                fontSize: 18, fontWeight: 900, color: overallGrade.color, margin: '0 0 2px',
              }}>
                업종 평균 대비 {pctOfAvg}%
              </p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                {benchmark.label} 평균 {avgDays}일 기준
              </p>
            </div>
          </div>
        </LoginGate>
      </div>

      {/* 런웨이 바 비교 */}
      <div style={{ padding: '0 20px 16px' }}>
        {/* 내 런웨이 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1F5E' }}>내 결과</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: overallGrade.color }}>
              {isFinite(currentDays) ? `${Math.floor(currentDays)}일` : '∞'}
            </span>
          </div>
          <div style={{ height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.min(barWidth, 100)}%`,
              background: `linear-gradient(90deg, ${overallGrade.color}, ${overallGrade.color}90)`,
              borderRadius: 5, transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>
        </div>
        {/* 업종 평균 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>
              {benchmark.label} 평균
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8' }}>
              {avgDays}일
            </span>
          </div>
          <div style={{ height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: '50%',
              background: '#CBD5E1', borderRadius: 5,
            }} />
          </div>
        </div>
      </div>

      {/* 항목별 비교 */}
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CompareRow
          label="월 고정비"
          mine={input.fixedCost}
          avg={benchmark.fixedCost}
          better={fixedBetter}
          lowerIsBetter
        />
        {input.monthlyRevenue > 0 && (
          <CompareRow
            label="월 매출"
            mine={input.monthlyRevenue}
            avg={benchmark.revenue}
            better={revBetter}
          />
        )}
      </div>
    </div>
  )
}

function CompareRow({
  label, mine, avg, better, lowerIsBetter,
}: {
  label: string; mine: number; avg: number; better: boolean; lowerIsBetter?: boolean
}) {
  const diff = mine - avg
  const pct  = avg > 0 ? Math.round((Math.abs(diff) / avg) * 100) : 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 12, background: '#F8F9FB',
    }}>
      <div>
        <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1F5E', margin: '2px 0 0' }}>
          {formatWon(mine)}
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
          평균 {formatWon(avg)}
        </p>
        <p style={{
          fontSize: 12, fontWeight: 800, margin: '2px 0 0',
          color: better ? '#38A169' : '#E53E3E',
        }}>
          {better ? '✓' : '!'} {pct}% {diff > 0
            ? (lowerIsBetter ? '높음' : '높음')
            : (lowerIsBetter ? '낮음' : '낮음')
          }
        </p>
      </div>
    </div>
  )
}
