'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import { formatWon } from '@/utils/calculate'

const ACCENT = '#FF6B35'
const STEPS  = ['자산', '수입 · 지출', '목표 설정']

/* ── 직군 벤치마크 ─────────────────────────────────────── */
const JOB_BENCHMARKS: Record<string, {
  label: string; emoji: string
  salary: number; expense: number
}> = {
  office:  { label: '사무직',     emoji: '💼', salary: 3_500_000, expense: 2_500_000 },
  it:      { label: 'IT/개발',    emoji: '💻', salary: 4_500_000, expense: 2_800_000 },
  sales:   { label: '영업',       emoji: '🤝', salary: 3_200_000, expense: 2_300_000 },
  creator: { label: '크리에이터', emoji: '🎨', salary: 2_500_000, expense: 2_000_000 },
  other:   { label: '기타',       emoji: '📋', salary: 3_000_000, expense: 2_300_000 },
}

const ASSET_PRESETS = [
  { label: '1천만',  value:  10_000_000 },
  { label: '3천만',  value:  30_000_000 },
  { label: '5천만',  value:  50_000_000 },
  { label: '1억',    value: 100_000_000 },
  { label: '3억',    value: 300_000_000 },
]

const TARGET_PRESETS = [
  { label: '1억',    value: 100_000_000 },
  { label: '3억',    value: 300_000_000 },
  { label: '5억',    value: 500_000_000 },
  { label: '10억',   value: 1_000_000_000 },
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
          ref={ref} type="text" inputMode="numeric"
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
        <p style={{ fontSize: 12, color: '#64748B', margin: '6px 0 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#94A3B8' }} />
          {benchmarkLabel}
        </p>
      )}
      {presets && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {presets.map(p => {
            const sel = value === p.value
            return (
              <button key={p.value} onClick={() => onChange(p.value)}
                style={{
                  padding: '8px 16px', borderRadius: 24, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${sel ? ACCENT : '#E2E8F0'}`,
                  background: sel ? ACCENT : '#fff', color: sel ? '#fff' : '#475569',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
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
   3-Step Freelancer Escape Wizard
   ═══════════════════════════════════════════════════════════ */
export function FreelancerWizard() {
  const router = useRouter()
  const { freelancerInput, updateFreelancerInput, calculate } = useCalculatorStore()
  const [step, setStep] = useState(0)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animKey, setAnimKey] = useState(0)

  const benchmark = selectedJob ? JOB_BENCHMARKS[selectedJob] : JOB_BENCHMARKS.other

  function goNext() {
    if (step < 2) {
      setDirection('next'); setAnimKey(k => k + 1); setStep(s => s + 1)
    } else {
      calculate(); router.push('/result')
    }
  }
  function goBack() {
    if (step > 0) { setDirection('prev'); setAnimKey(k => k + 1); setStep(s => s - 1) }
    else router.back()
  }

  const canProceed = [
    freelancerInput.assets > 0,
    freelancerInput.salary > 0 && freelancerInput.monthlyExpense > 0,
    freelancerInput.targetAmount > 0,
  ][step]

  return (
    <div style={{ minHeight: '100dvh', background: '#F8F9FB', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'hidden', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column', minHeight: '100dvh', overflowX: 'hidden' }}>

        {/* 헤더 */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px' }}>
            <button onClick={goBack} style={{ background: 'none', border: 'none', fontSize: 22, color: '#64748B', cursor: 'pointer', padding: '0 4px' }}>←</button>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E' }}>직장인 탈출 계산기</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT, background: `${ACCENT}15`, borderRadius: 20, padding: '3px 12px' }}>{step + 1}/3</span>
          </div>
          <div style={{ height: 4, background: '#F1F5F9' }}>
            <div style={{ height: '100%', width: `${((step + 1) / 3) * 100}%`, background: `linear-gradient(90deg, ${ACCENT}, #E8590C)`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '0 4px 4px 0' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '14px 20px 12px' }}>
            {STEPS.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: i <= step ? 1 : 0.35, transition: 'opacity 0.3s' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < step ? '#48BB78' : i === step ? ACCENT : '#E2E8F0', color: i <= step ? '#fff' : '#94A3B8', transition: 'all 0.3s' }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: i === step ? 800 : 600, color: i === step ? ACCENT : '#94A3B8' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div key={animKey} style={{ flex: 1, padding: '24px 20px 140px', animation: `slideInF 0.35s cubic-bezier(0.16, 1, 0.3, 1)` }}>
          {step === 0 && <Step1Assets input={freelancerInput} update={updateFreelancerInput} selectedJob={selectedJob} onSelectJob={setSelectedJob} />}
          {step === 1 && <Step2Income input={freelancerInput} update={updateFreelancerInput} benchmark={benchmark} />}
          {step === 2 && <Step3Target input={freelancerInput} update={updateFreelancerInput} />}
        </div>

        {/* 하단 버튼 */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '12px 20px 32px', background: 'linear-gradient(to top, #F8F9FB 70%, transparent)', zIndex: 30 }}>
          <button onClick={goNext} disabled={!canProceed}
            style={{ width: '100%', height: 56, borderRadius: 16, border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 900, color: '#fff', background: canProceed ? `linear-gradient(135deg, ${ACCENT}, #E8590C)` : '#E2E8F0', boxShadow: canProceed ? `0 8px 28px ${ACCENT}40` : 'none', transition: 'all 0.25s', letterSpacing: '-0.3px' }}>
            {step < 2 ? '다음 →' : '탈출 D-day 확인하기 🚀'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideInF {
          from { opacity: 0; transform: translateX(${direction === 'next' ? '40px' : '-40px'}); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Step 1 — 직군 선택 + 현재 자산
   ═══════════════════════════════════════════════════════════ */
function Step1Assets({ input, update, selectedJob, onSelectJob }: {
  input: { assets: number }; update: (p: Record<string, unknown>) => void
  selectedJob: string | null; onSelectJob: (k: string) => void
}) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1F5E', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.4 }}>
          지금 얼마나<br />모아두셨나요?
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>현금, 주식, 부동산 등 전부 합산해주세요</p>
      </div>

      {/* 직군 선택 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
        {Object.entries(JOB_BENCHMARKS).map(([key, data]) => {
          const sel = selectedJob === key
          return (
            <button key={key} onClick={() => onSelectJob(key)}
              style={{ padding: '18px 8px 14px', borderRadius: 16, border: 'none', background: sel ? ACCENT : '#fff', boxShadow: sel ? `0 6px 20px ${ACCENT}30` : '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.2s', transform: sel ? 'scale(1.02)' : 'scale(1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 28 }}>{data.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: sel ? '#fff' : '#475569' }}>{data.label}</span>
            </button>
          )
        })}
      </div>

      {/* 현재 자산 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>현재 총 자산</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>현금 + 주식 + 부동산 등</p>
          </div>
        </div>
        <AmountInput value={input.assets} onChange={v => update({ assets: v })} placeholder="현재 총 자산" presets={ASSET_PRESETS} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Step 2 — 월급 + 생활비 + 대출이자
   ═══════════════════════════════════════════════════════════ */
function Step2Income({ input, update, benchmark }: {
  input: { salary: number; monthlyExpense: number; loanInterest: number }
  update: (p: Record<string, unknown>) => void
  benchmark: { label: string; salary: number; expense: number }
}) {
  const savings = input.salary - input.monthlyExpense - input.loanInterest

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1F5E', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.4 }}>
          매달 얼마나 벌고<br />쓰시나요?
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>월급과 생활비를 입력해주세요</p>
      </div>

      {/* 월급 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>💵</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>월급 (세후)</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>실수령액 기준</p>
          </div>
        </div>
        <AmountInput value={input.salary} onChange={v => update({ salary: v })} placeholder="월 실수령액"
          benchmarkLabel={`${benchmark.label} 평균 ${formatWon(benchmark.salary)}`}
          presets={[
            { label: '250만', value: 2_500_000 }, { label: '350만', value: 3_500_000 },
            { label: '500만', value: 5_000_000 }, { label: '700만', value: 7_000_000 },
          ]}
        />
      </div>

      {/* 생활비 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>월 생활비</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>월세 + 식비 + 교통 + 보험 등</p>
          </div>
        </div>
        <AmountInput value={input.monthlyExpense} onChange={v => update({ monthlyExpense: v })} placeholder="월 생활비"
          benchmarkLabel={`${benchmark.label} 평균 ${formatWon(benchmark.expense)}`}
          presets={[
            { label: '150만', value: 1_500_000 }, { label: '200만', value: 2_000_000 },
            { label: '250만', value: 2_500_000 }, { label: '300만', value: 3_000_000 },
          ]}
        />
      </div>

      {/* 대출이자 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🏦</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>월 대출 이자</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>없으면 비워두세요</p>
          </div>
        </div>
        <AmountInput value={input.loanInterest} onChange={v => update({ loanInterest: v })} placeholder="0" />
      </div>

      {/* 월 저축액 미리보기 */}
      {input.salary > 0 && input.monthlyExpense > 0 && (
        <div style={{
          marginTop: 14, padding: '16px 18px', borderRadius: 16,
          background: savings > 0 ? '#F0FFF4' : '#FFF5F5',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>{savings > 0 ? '📈' : '📉'}</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: savings > 0 ? '#276749' : '#C53030', margin: 0 }}>
              월 저축 가능액: {formatWon(Math.abs(savings))}
            </p>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
              {savings > 0 ? '매달 이만큼 목표에 가까워져요' : '지출이 수입보다 많아요'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Step 3 — 목표 금액 + 부업 수입
   ═══════════════════════════════════════════════════════════ */
function Step3Target({ input, update }: {
  input: { targetAmount: number; sideIncome: number; assets: number; salary: number; monthlyExpense: number; loanInterest: number }
  update: (p: Record<string, unknown>) => void
}) {
  const [skipSideIncome, setSkipSideIncome] = useState(false)
  const monthlySavings = (input.salary - input.monthlyExpense - input.loanInterest) + input.sideIncome
  const remaining = Math.max(input.targetAmount - input.assets, 0)

  useEffect(() => {
    if (skipSideIncome) update({ sideIncome: 0 })
  }, [skipSideIncome]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1F5E', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.4 }}>
          얼마 모이면<br />퇴사하실 건가요?
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>목표 금액을 설정해주세요</p>
      </div>

      {/* 목표 금액 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>퇴사 목표 금액</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>이만큼 모이면 탈출!</p>
          </div>
        </div>
        <AmountInput value={input.targetAmount} onChange={v => update({ targetAmount: v })} placeholder="목표 금액" presets={TARGET_PRESETS} />
      </div>

      {/* 목표까지 남은 금액 미리보기 */}
      {input.targetAmount > 0 && (
        <div style={{
          padding: '16px 18px', borderRadius: 16, marginBottom: 14,
          background: remaining <= 0 ? '#F0FFF4' : '#EEF2FF',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>{remaining <= 0 ? '🎉' : '🏃'}</span>
          <div>
            {remaining <= 0 ? (
              <p style={{ fontSize: 14, fontWeight: 800, color: '#276749', margin: 0 }}>이미 목표를 달성했어요!</p>
            ) : (
              <>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#3730A3', margin: 0 }}>
                  목표까지 {formatWon(remaining)} 남았어요
                </p>
                {monthlySavings > 0 && (
                  <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
                    현재 속도로 약 {Math.ceil(remaining / monthlySavings)}개월 소요
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 부업 수입 */}
      {!skipSideIncome ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>월 부업 수입</p>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>프리랜서, 투잡, 투자수익 등</p>
            </div>
          </div>
          <AmountInput value={input.sideIncome} onChange={v => update({ sideIncome: v })} placeholder="월 부업 수입"
            presets={[
              { label: '50만', value: 500_000 }, { label: '100만', value: 1_000_000 },
              { label: '200만', value: 2_000_000 }, { label: '300만', value: 3_000_000 },
            ]}
          />
        </div>
      ) : (
        <div style={{ background: '#FFF8F0', borderRadius: 20, padding: '22px 20px', border: '1.5px dashed #FED7AA', marginBottom: 12 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#F97316', margin: '0 0 4px' }}>부업 없이 계산할게요</p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>월급만으로 목표 달성 기간을 계산해요</p>
        </div>
      )}

      <button onClick={() => setSkipSideIncome(!skipSideIncome)}
        style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 700, color: '#64748B', cursor: 'pointer', textAlign: 'center' }}>
        {skipSideIncome ? '💡 부업 수입 입력하기' : '🚫 부업 수입 없이 계산하기'}
      </button>
    </div>
  )
}
