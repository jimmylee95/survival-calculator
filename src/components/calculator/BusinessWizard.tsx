'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import { VARIABLE_RATE, INDUSTRY_BENCHMARKS, formatWon } from '@/utils/calculate'

const ACCENT = '#1A1F5E'
const STEPS  = ['업종 · 잔고', '월 지출', '월 매출']

/* ── 빠른 금액 프리셋 ──────────────────────────────────── */
const BALANCE_PRESETS = [
  { label: '500만',   value:  5_000_000 },
  { label: '1천만',   value: 10_000_000 },
  { label: '3천만',   value: 30_000_000 },
  { label: '5천만',   value: 50_000_000 },
  { label: '1억',     value: 100_000_000 },
]

/* ── 금액 입력 컴포넌트 ────────────────────────────────── */
function AmountInput({
  value, onChange, placeholder, presets, benchmarkLabel,
}: {
  value: number
  onChange: (v: number) => void
  placeholder: string
  presets?: { label: string; value: number }[]
  benchmarkLabel?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const display = value > 0 ? value.toLocaleString('ko-KR') : ''

  return (
    <div>
      <div
        onClick={() => ref.current?.focus()}
        style={{
          display: 'flex', alignItems: 'center', borderRadius: 16,
          border: `2px solid ${focused ? ACCENT : '#E2E8F0'}`,
          background: '#fff', padding: '0 16px', gap: 8,
          transition: 'border-color 0.2s',
        }}
      >
        <input
          ref={ref}
          type="text" inputMode="numeric"
          value={display}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9]/g, '')
            onChange(raw ? parseInt(raw, 10) : 0)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, height: 56, fontSize: 24, fontWeight: 800,
            color: '#1A1F5E', background: 'transparent', border: 'none',
            outline: 'none', letterSpacing: '-0.5px',
          }}
        />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8' }}>원</span>
      </div>

      {value > 0 && (
        <p style={{ fontSize: 13, color: ACCENT, fontWeight: 700, margin: '6px 0 0 4px' }}>
          = {formatWon(value)}
        </p>
      )}

      {benchmarkLabel && (
        <p style={{
          fontSize: 12, color: '#64748B', margin: '6px 0 0 4px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6,
            borderRadius: '50%', background: '#94A3B8',
          }} />
          {benchmarkLabel}
        </p>
      )}

      {presets && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {presets.map(p => {
            const sel = value === p.value
            return (
              <button
                key={p.value}
                onClick={() => onChange(p.value)}
                style={{
                  padding: '8px 16px', borderRadius: 24, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${sel ? ACCENT : '#E2E8F0'}`,
                  background: sel ? ACCENT : '#fff',
                  color: sel ? '#fff' : '#475569',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   3-Step Business Wizard
   ═══════════════════════════════════════════════════════════ */
export function BusinessWizard() {
  const router = useRouter()
  const { businessInput, updateBusinessInput, calculate } = useCalculatorStore()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animKey, setAnimKey] = useState(0)

  const benchmark = INDUSTRY_BENCHMARKS[businessInput.industryType as keyof typeof INDUSTRY_BENCHMARKS]
    ?? INDUSTRY_BENCHMARKS.other

  function goNext() {
    if (step < 2) {
      setDirection('next')
      setAnimKey(k => k + 1)
      setStep(s => s + 1)
    } else {
      calculate()
      router.push('/result')
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection('prev')
      setAnimKey(k => k + 1)
      setStep(s => s - 1)
    } else {
      router.back()
    }
  }

  // 단계별 완료 조건
  const canProceed = [
    businessInput.industryType && businessInput.balance > 0,
    businessInput.fixedCost > 0,
    true, // 매출은 0도 OK
  ][step]

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F9FB',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

        {/* ── 헤더 + 프로그레스 ───────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: '#fff', borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '14px 20px 12px',
          }}>
            <button
              onClick={goBack}
              style={{
                background: 'none', border: 'none', fontSize: 22,
                color: '#64748B', cursor: 'pointer', padding: '0 4px',
              }}
            >
              ←
            </button>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E' }}>
              사장님 생존 계산기
            </span>
            <span style={{
              fontSize: 13, fontWeight: 700, color: ACCENT,
              background: `${ACCENT}12`, borderRadius: 20, padding: '3px 12px',
            }}>
              {step + 1}/3
            </span>
          </div>
          {/* 프로그레스 바 */}
          <div style={{ height: 4, background: '#F1F5F9' }}>
            <div style={{
              height: '100%', width: `${((step + 1) / 3) * 100}%`,
              background: `linear-gradient(90deg, ${ACCENT}, #4F46E5)`,
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '0 4px 4px 0',
            }} />
          </div>
          {/* 스텝 인디케이터 */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 24,
            padding: '14px 20px 12px',
          }}>
            {STEPS.map((label, i) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 6, opacity: i <= step ? 1 : 0.35,
                transition: 'opacity 0.3s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < step ? '#48BB78' : i === step ? ACCENT : '#E2E8F0',
                  color: i <= step ? '#fff' : '#94A3B8',
                  transition: 'all 0.3s',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: i === step ? 800 : 600,
                  color: i === step ? ACCENT : '#94A3B8',
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 콘텐츠 영역 ───────────────────────────── */}
        <div
          key={animKey}
          style={{
            flex: 1, padding: '24px 20px 140px',
            animation: `slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)`,
          }}
        >
          {step === 0 && <Step1Industry
            input={businessInput}
            update={updateBusinessInput}
            benchmark={benchmark}
          />}
          {step === 1 && <Step2Expense
            input={businessInput}
            update={updateBusinessInput}
            benchmark={benchmark}
          />}
          {step === 2 && <Step3Revenue
            input={businessInput}
            update={updateBusinessInput}
            benchmark={benchmark}
          />}
        </div>

        {/* ── 하단 고정 버튼 ──────────────────────────── */}
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, padding: '12px 20px 32px',
          background: 'linear-gradient(to top, #F8F9FB 70%, transparent)',
          zIndex: 30,
        }}>
          <button
            onClick={goNext}
            disabled={!canProceed}
            style={{
              width: '100%', height: 56, borderRadius: 16, border: 'none',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              fontSize: 16, fontWeight: 900, color: '#fff',
              background: canProceed
                ? `linear-gradient(135deg, ${ACCENT}, #4F46E5)`
                : '#E2E8F0',
              boxShadow: canProceed ? `0 8px 28px ${ACCENT}40` : 'none',
              transition: 'all 0.25s',
              letterSpacing: '-0.3px',
            }}
          >
            {step < 2 ? '다음 →' : '결과 확인하기 🧮'}
          </button>
        </div>

      </div>

      {/* 슬라이드 애니메이션 */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(${direction === 'next' ? '40px' : '-40px'}); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Step 1 — 업종 선택 + 현재 잔고
   ═══════════════════════════════════════════════════════════ */
function Step1Industry({
  input, update, benchmark,
}: {
  input: { industryType: string; balance: number }
  update: (p: Record<string, unknown>) => void
  benchmark: { label: string; emoji: string }
}) {
  const industries = Object.entries(INDUSTRY_BENCHMARKS) as [string, typeof benchmark & { fixedCost: number; revenue: number }][]

  return (
    <div>
      {/* 질문 */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontSize: 22, fontWeight: 900, color: '#1A1F5E',
          margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.4,
        }}>
          사장님, 어떤 사업을<br />하고 계세요?
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
          업종에 맞는 평균값을 참고할 수 있어요
        </p>
      </div>

      {/* 업종 선택 그리드 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, marginBottom: 28,
      }}>
        {industries.map(([key, data]) => {
          const sel = input.industryType === key
          return (
            <button
              key={key}
              onClick={() => update({ industryType: key })}
              style={{
                padding: '18px 8px 14px', borderRadius: 16, border: 'none',
                background: sel ? ACCENT : '#fff',
                boxShadow: sel ? `0 6px 20px ${ACCENT}30` : '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer', transition: 'all 0.2s',
                transform: sel ? 'scale(1.02)' : 'scale(1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 28 }}>{data.emoji}</span>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: sel ? '#fff' : '#475569',
              }}>
                {data.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* 현재 잔고 */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '22px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>
              사업 통장 잔고
            </p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
              대략적인 금액도 괜찮아요
            </p>
          </div>
        </div>
        <AmountInput
          value={input.balance}
          onChange={v => update({ balance: v })}
          placeholder="현재 잔고 입력"
          presets={BALANCE_PRESETS}
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Step 2 — 월 지출 (고정비 + 변동비)
   ═══════════════════════════════════════════════════════════ */
function Step2Expense({
  input, update, benchmark,
}: {
  input: { fixedCost: number; loanInterest: number; industryType: string }
  update: (p: Record<string, unknown>) => void
  benchmark: { label: string; fixedCost: number; variableCost: number }
}) {
  const totalBenchmark = benchmark.fixedCost + benchmark.variableCost

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontSize: 22, fontWeight: 900, color: '#1A1F5E',
          margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.4,
        }}>
          매달 나가는 돈은<br />얼마인가요?
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
          임대료 + 인건비 + 재료비 등 전부 합쳐주세요
        </p>
      </div>

      {/* 업종 평균 가이드 */}
      <div style={{
        background: '#EEF2FF', borderRadius: 16, padding: '16px 18px',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>📊</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: ACCENT, margin: 0 }}>
            {benchmark.label} 평균 월 지출
          </p>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#4F46E5', margin: '2px 0 0' }}>
            {formatWon(totalBenchmark)}
          </p>
          <p style={{ fontSize: 11, color: '#64748B', margin: '4px 0 0' }}>
            고정비 {formatWon(benchmark.fixedCost)} + 변동비 {formatWon(benchmark.variableCost)}
          </p>
        </div>
      </div>

      {/* 고정비 */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '22px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>
              월 고정비
            </p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
              임대료, 인건비, 보험, 통신비 등
            </p>
          </div>
        </div>
        <AmountInput
          value={input.fixedCost}
          onChange={v => update({ fixedCost: v })}
          placeholder="월 고정 지출"
          benchmarkLabel={`${benchmark.label} 평균 ${formatWon(benchmark.fixedCost)}`}
          presets={[
            { label: '150만', value: 1_500_000 },
            { label: '250만', value: 2_500_000 },
            { label: '350만', value: 3_500_000 },
            { label: '500만', value: 5_000_000 },
          ]}
        />
      </div>

      {/* 대출이자 (선택) */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '22px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🏦</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>
              월 대출 이자
            </p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
              없으면 비워두세요
            </p>
          </div>
        </div>
        <AmountInput
          value={input.loanInterest}
          onChange={v => update({ loanInterest: v })}
          placeholder="0"
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Step 3 — 월 매출
   ═══════════════════════════════════════════════════════════ */
function Step3Revenue({
  input, update, benchmark,
}: {
  input: { monthlyRevenue: number; fixedCost: number; loanInterest: number }
  update: (p: Record<string, unknown>) => void
  benchmark: { label: string; revenue: number }
}) {
  const [skipRevenue, setSkipRevenue] = useState(false)

  useEffect(() => {
    if (skipRevenue) update({ monthlyRevenue: 0 })
  }, [skipRevenue]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontSize: 22, fontWeight: 900, color: '#1A1F5E',
          margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.4,
        }}>
          매달 들어오는 돈은<br />얼마인가요?
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
          최근 3개월 평균 매출을 입력해주세요
        </p>
      </div>

      {/* 업종 평균 가이드 */}
      <div style={{
        background: '#F0FFF4', borderRadius: 16, padding: '16px 18px',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>💰</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#276749', margin: 0 }}>
            {benchmark.label} 평균 월 매출
          </p>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#38A169', margin: '2px 0 0' }}>
            {formatWon(benchmark.revenue)}
          </p>
        </div>
      </div>

      {!skipRevenue ? (
        <div style={{
          background: '#fff', borderRadius: 20, padding: '22px 20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>📈</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>
                월 평균 매출
              </p>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
                카드+현금+배달 모두 합산
              </p>
            </div>
          </div>
          <AmountInput
            value={input.monthlyRevenue}
            onChange={v => update({ monthlyRevenue: v })}
            placeholder="월 평균 매출"
            benchmarkLabel={`${benchmark.label} 평균 ${formatWon(benchmark.revenue)}`}
            presets={[
              { label: '500만',  value:  5_000_000 },
              { label: '1천만',  value: 10_000_000 },
              { label: '2천만',  value: 20_000_000 },
              { label: '3천만',  value: 30_000_000 },
            ]}
          />
        </div>
      ) : (
        <div style={{
          background: '#FFF8F0', borderRadius: 20, padding: '22px 20px',
          border: '1.5px dashed #FED7AA',
        }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#F97316', margin: '0 0 4px' }}>
            최악 시나리오로 계산할게요
          </p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
            매출 0원 기준으로 잔고가 언제 바닥나는지 보여드려요
          </p>
        </div>
      )}

      {/* 건너뛰기 토글 */}
      <button
        onClick={() => setSkipRevenue(!skipRevenue)}
        style={{
          width: '100%', padding: '14px', marginTop: 12,
          borderRadius: 14, border: '1.5px solid #E2E8F0',
          background: '#fff', fontSize: 13, fontWeight: 700,
          color: '#64748B', cursor: 'pointer', textAlign: 'center',
        }}
      >
        {skipRevenue ? '📈 매출 직접 입력하기' : '🚫 매출 없이 계산하기 (최악 시나리오)'}
      </button>
    </div>
  )
}
