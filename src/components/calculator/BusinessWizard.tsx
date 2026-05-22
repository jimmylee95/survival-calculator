'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import { INDUSTRY_BENCHMARKS, formatWon } from '@/utils/calculate'
import { RegionSelect } from './RegionSelect'

const ACCENT = '#FF6B35'
const TOTAL = 6

const BALANCE_PRESETS = [
  { label: '500만', value: 5_000_000 },
  { label: '1천만', value: 10_000_000 },
  { label: '3천만', value: 30_000_000 },
  { label: '5천만', value: 50_000_000 },
  { label: '1억',   value: 100_000_000 },
]

const FIXED_PRESETS = [
  { label: '150만', value: 1_500_000 },
  { label: '250만', value: 2_500_000 },
  { label: '350만', value: 3_500_000 },
  { label: '500만', value: 5_000_000 },
]

const REVENUE_PRESETS = [
  { label: '500만', value: 5_000_000 },
  { label: '1천만', value: 10_000_000 },
  { label: '2천만', value: 20_000_000 },
  { label: '3천만', value: 30_000_000 },
]

const LOAN_PRESETS = [
  { label: '20만',  value: 200_000 },
  { label: '50만',  value: 500_000 },
  { label: '100만', value: 1_000_000 },
  { label: '200만', value: 2_000_000 },
]

/* ── 공통 컴포넌트 ─────────────────────────────────────── */

function QuestionTitle({ num, text, sub }: { num: number; text: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        fontSize: 13, fontWeight: 800, color: ACCENT,
        marginBottom: 12, letterSpacing: '0.5px',
      }}>
        Q{num} / {TOTAL}
      </div>
      <h2 style={{
        fontSize: 26, fontWeight: 900, color: '#0F172A',
        margin: '0 0 12px', letterSpacing: '-0.7px', lineHeight: 1.3,
      }}>
        {text}
      </h2>
      {sub && (
        <p style={{ fontSize: 15, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function AmountInput({
  value, onChange, presets, autoFocus, onEnter,
}: {
  value: number
  onChange: (v: number) => void
  presets?: { label: string; value: number }[]
  autoFocus?: boolean
  onEnter?: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const display = value > 0 ? value.toLocaleString('ko-KR') : ''

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 350)
      return () => clearTimeout(t)
    }
  }, [autoFocus])

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'baseline',
        gap: 8, paddingBottom: 12,
        borderBottom: `2px solid ${value > 0 ? ACCENT : '#E2E8F0'}`,
        transition: 'border-color 0.2s',
      }}>
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9]/g, '')
            onChange(raw ? parseInt(raw, 10) : 0)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && value > 0) onEnter?.()
          }}
          placeholder="0"
          style={{
            flex: 1, minWidth: 0, textAlign: 'right',
            fontSize: 40, fontWeight: 900, color: ACCENT,
            background: 'transparent', border: 'none', outline: 'none',
            letterSpacing: '-1px', padding: 0,
          }}
        />
        <span style={{ fontSize: 20, fontWeight: 700, color: '#94A3B8' }}>원</span>
      </div>
      <p style={{
        fontSize: 14, color: value > 0 ? ACCENT : '#CBD5E1',
        fontWeight: 700, textAlign: 'right', margin: '12px 0 0', minHeight: 18,
      }}>
        {value > 0 ? `= ${formatWon(value)}` : ' '}
      </p>
      {presets && (
        <div style={{
          display: 'flex', gap: 8, marginTop: 20,
          flexWrap: 'wrap',
        }}>
          {presets.map(p => {
            const sel = value === p.value
            return (
              <button key={p.value} onClick={() => onChange(p.value)}
                style={{
                  padding: '12px 18px', borderRadius: 24,
                  fontSize: 14, fontWeight: 700,
                  border: `1.5px solid ${sel ? ACCENT : '#E2E8F0'}`,
                  background: sel ? ACCENT : '#fff',
                  color: sel ? '#fff' : '#475569',
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

function ContinueButton({
  onClick, disabled, label = '다음',
}: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        marginTop: 36, width: '100%', height: 60, borderRadius: 14,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 17, fontWeight: 900, color: '#fff',
        background: disabled ? '#E2E8F0' : ACCENT,
        boxShadow: disabled ? 'none' : `0 8px 24px ${ACCENT}30`,
        transition: 'all 0.2s', letterSpacing: '-0.3px',
      }}>
      {label}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════
   Typeform-style Business Wizard (6 questions)

   internal step:
     0 = industry        (Q1)
     1 = balance         (Q2)
     2 = fixed cost      (Q3)
     3 = revenue         (Q4)
     4 = loan ask        (Q5-A)
     5 = loan amount     (Q5-B, sub-step of Q5)
     6 = region          (Q6, last → finish)
   ═══════════════════════════════════════════════════════════ */
export function BusinessWizard() {
  const router = useRouter()
  const { businessInput, updateBusinessInput, calculate } = useCalculatorStore()
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const benchmark =
    INDUSTRY_BENCHMARKS[businessInput.industryType as keyof typeof INDUSTRY_BENCHMARKS]
    ?? INDUSTRY_BENCHMARKS.other

  const progressIdx = Math.min(step + 1, TOTAL)

  function goNext() {
    setAnimKey(k => k + 1)
    setStep(s => s + 1)
  }
  function goBack() {
    if (step === 0) { router.back(); return }
    setAnimKey(k => k + 1)
    setStep(s => s - 1)
  }
  function jumpTo(n: number) {
    setAnimKey(k => k + 1)
    setStep(n)
  }
  function finish() {
    calculate()
    router.push('/result')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 60%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: '100%', overflowX: 'hidden',
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      }}>
        {/* 상단: 얇은 프로그레스 바 + 뒤로가기 */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ height: 3, background: '#F1F5F9' }}>
            <div style={{
              height: '100%',
              width: `${(progressIdx / TOTAL) * 100}%`,
              background: ACCENT,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
          <button onClick={goBack} aria-label="뒤로 가기"
            style={{
              background: 'none', border: 'none',
              fontSize: 24, color: '#64748B',
              cursor: 'pointer', padding: '14px 18px',
              display: 'block',
            }}>
            ←
          </button>
        </div>

        {/* 질문 영역 (세로 중앙 정렬, 콘텐츠 길어지면 자연스럽게 스크롤) */}
        <div key={animKey} style={{
          flex: 1, padding: '8px 24px 60px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          animation: 'biz-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
          minHeight: 0,
        }}>
          {step === 0 && (
            <Q1Industry input={businessInput} update={updateBusinessInput} onNext={goNext} />
          )}
          {step === 1 && (
            <Q2Balance input={businessInput} update={updateBusinessInput} onNext={goNext} />
          )}
          {step === 2 && (
            <Q3Fixed input={businessInput} update={updateBusinessInput}
              benchmark={benchmark} onNext={goNext} />
          )}
          {step === 3 && (
            <Q4Revenue input={businessInput} update={updateBusinessInput}
              benchmark={benchmark} onNext={goNext} />
          )}
          {step === 4 && (
            <Q5LoanAsk
              onYes={goNext}
              onNo={() => { updateBusinessInput({ loanInterest: 0 }); jumpTo(6) }}
            />
          )}
          {step === 5 && (
            <Q5LoanAmount input={businessInput} update={updateBusinessInput} onNext={goNext} />
          )}
          {step === 6 && (
            <Q6Region input={businessInput} update={updateBusinessInput} onFinish={finish} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes biz-slide-up {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ───── Q1: 업종 선택 (3열 그리드, 탭 → 자동 다음) ───────── */
function Q1Industry({
  input, update, onNext,
}: {
  input: { industryType: string }
  update: (p: Record<string, unknown>) => void
  onNext: () => void
}) {
  return (
    <div>
      <QuestionTitle num={1} text={<>내 피땀 눈물이<br />들어간 업종은?</>}
        sub="카페, 치킨집, 식당 등" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}>
        {Object.entries(INDUSTRY_BENCHMARKS).map(([key, data]) => {
          const sel = input.industryType === key
          return (
            <button key={key}
              onClick={() => {
                update({ industryType: key })
                setTimeout(onNext, 220)
              }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 6,
                padding: '14px 6px',
                minHeight: 88,
                borderRadius: 14,
                border: `2px solid ${sel ? ACCENT : '#E2E8F0'}`,
                background: sel ? `${ACCENT}0A` : '#fff',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: sel ? `0 4px 14px ${ACCENT}20` : 'none',
              }}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>{data.emoji}</span>
              <span style={{
                fontSize: 12, fontWeight: 800,
                color: sel ? ACCENT : '#1A1F5E',
                lineHeight: 1.25,
                textAlign: 'center',
                wordBreak: 'keep-all',
              }}>
                {data.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ───── Q2: 통장 잔고 ─────────────────────────────────── */
function Q2Balance({
  input, update, onNext,
}: {
  input: { balance: number }
  update: (p: Record<string, unknown>) => void
  onNext: () => void
}) {
  return (
    <div>
      <QuestionTitle num={2} text={<>지금 통장에<br />당장 가용 가능한<br />‘순수 잔고’는?</>}
        sub="월세 내기 전 통장에 찍힌 숫자" />
      <AmountInput value={input.balance}
        onChange={v => update({ balance: v })}
        presets={BALANCE_PRESETS} autoFocus onEnter={onNext} />
      <ContinueButton onClick={onNext} disabled={input.balance === 0} />
    </div>
  )
}

/* ───── Q3: 월 고정비 ─────────────────────────────────── */
function Q3Fixed({
  input, update, benchmark, onNext,
}: {
  input: { fixedCost: number }
  update: (p: Record<string, unknown>) => void
  benchmark: { label: string; fixedCost: number }
  onNext: () => void
}) {
  return (
    <div>
      <QuestionTitle num={3} text={<>숨만 쉬어도 통장에서<br />무섭게 빠져나가는<br />‘고정비’는?</>}
        sub="월세, 이자, 인건비 등등" />
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 20, background: '#EEF2FF',
          fontSize: 13, fontWeight: 700, color: ACCENT,
        }}>
          📊 {benchmark.label} 평균 {formatWon(benchmark.fixedCost)}
        </div>
        <p style={{ margin: '4px 0 0 14px', fontSize: 10, color: 'rgba(26, 31, 94, 0.4)', fontWeight: 600 }}>
          중기부·공정위·국세청 통계 기반
        </p>
      </div>
      <AmountInput value={input.fixedCost}
        onChange={v => update({ fixedCost: v })}
        presets={FIXED_PRESETS} autoFocus onEnter={onNext} />
      <ContinueButton onClick={onNext} disabled={input.fixedCost === 0} />
    </div>
  )
}

/* ───── Q4: 월 매출 ──────────────────────────────────── */
function Q4Revenue({
  input, update, benchmark, onNext,
}: {
  input: { monthlyRevenue: number }
  update: (p: Record<string, unknown>) => void
  benchmark: { label: string; revenue: number }
  onNext: () => void
}) {
  return (
    <div>
      <QuestionTitle num={4} text={<>카드 수수료 빼고<br />배달앱 떼고 내 손에 쥐어지는<br />‘평균 월 매출’은?</>}
        sub="배달앱 떼고 카드사 떼고 내 손에 쥐어지는 금액" />
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 20, background: '#F0FFF4',
          fontSize: 13, fontWeight: 700, color: '#276749',
        }}>
          💰 {benchmark.label} 평균 {formatWon(benchmark.revenue)}
        </div>
        <p style={{ margin: '4px 0 0 14px', fontSize: 10, color: 'rgba(39, 103, 73, 0.4)', fontWeight: 600 }}>
          중기부·공정위·국세청 통계 기반
        </p>
      </div>
      <AmountInput value={input.monthlyRevenue}
        onChange={v => update({ monthlyRevenue: v })}
        presets={REVENUE_PRESETS} autoFocus onEnter={onNext} />
      <button onClick={() => { update({ monthlyRevenue: 0 }); onNext() }}
        style={{
          marginTop: 20, padding: '14px', width: '100%',
          borderRadius: 12, border: '1.5px dashed #FED7AA',
          background: '#FFF8F0', fontSize: 14, fontWeight: 700,
          color: '#F97316', cursor: 'pointer',
        }}>
        🚫 매출 없이 계산하기 (최악 시나리오)
      </button>
      <ContinueButton onClick={onNext} disabled={input.monthlyRevenue === 0} />
    </div>
  )
}

/* ───── Q5-A: 대출 이자 있음/없음 (큰 버튼 2개) ──────────── */
function Q5LoanAsk({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <div>
      <QuestionTitle num={5} text={<>은행한테 빚진 거<br />있어요?</>}
        sub="없으면 바로 지역 선택으로 넘어가요" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={onYes}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '26px 22px', borderRadius: 16, border: '2px solid #E2E8F0',
            background: '#fff', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s',
          }}>
          <span style={{ fontSize: 32 }}>😢</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#1A1F5E' }}>있어요</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>이자 금액 입력</div>
          </div>
        </button>
        <button onClick={onNo}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '26px 22px', borderRadius: 16, border: '2px solid #E2E8F0',
            background: '#fff', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s',
          }}>
          <span style={{ fontSize: 32 }}>😎</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#1A1F5E' }}>없어요</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>지역 선택으로 이동</div>
          </div>
        </button>
      </div>
    </div>
  )
}

/* ───── Q5-B: 대출 이자 금액 입력 ────────────────────── */
function Q5LoanAmount({
  input, update, onNext,
}: {
  input: { loanInterest: number }
  update: (p: Record<string, unknown>) => void
  onNext: () => void
}) {
  return (
    <div>
      <QuestionTitle num={5} text={<>매달 이자가<br />얼마인가요?</>}
        sub="은행님께 매달 바치는 이자" />
      <AmountInput value={input.loanInterest}
        onChange={v => update({ loanInterest: v })}
        presets={LOAN_PRESETS} autoFocus onEnter={onNext} />
      <ContinueButton onClick={onNext} disabled={input.loanInterest === 0} />
    </div>
  )
}

/* ───── Q6: 지역 선택 (마지막) ────────────────────────── */
function Q6Region({
  input, update, onFinish,
}: {
  input: { region?: string; district?: string }
  update: (p: Record<string, unknown>) => void
  onFinish: () => void
}) {
  return (
    <div>
      <QuestionTitle num={6} text={<>매달 건물주 좋은 일<br />시켜주는 내 매장 위치는?</>}
        sub="상권 지역 선택" />
      <RegionSelect
        region={input.region ?? ''}
        district={input.district ?? ''}
        onChange={(region, district) => update({ region, district })}
        onNext={onFinish}
      />
      <ContinueButton
        onClick={onFinish}
        disabled={!input.region || !input.district}
        label="결과 확인하기 🧮"
      />
    </div>
  )
}
