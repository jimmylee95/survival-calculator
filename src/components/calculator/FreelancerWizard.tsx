'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import { formatWon } from '@/utils/calculate'
import { RegionSelect } from './RegionSelect'

const ACCENT = '#4A7DFF'
const TOTAL = 7

const JOB_BENCHMARKS: Record<string, { label: string; emoji: string; salary: number; expense: number }> = {
  office:        { label: '사무직',         emoji: '💼', salary: 3_800_000, expense: 2_500_000 },
  it:            { label: 'IT/개발',        emoji: '💻', salary: 5_000_000, expense: 2_800_000 },
  sales:         { label: '영업',           emoji: '🤝', salary: 3_500_000, expense: 2_300_000 },
  creator:       { label: '크리에이터',     emoji: '🎨', salary: 2_500_000, expense: 2_000_000 },
  finance:       { label: '금융/회계',      emoji: '📊', salary: 5_500_000, expense: 3_000_000 },
  marketing:     { label: '마케팅/홍보',    emoji: '📢', salary: 4_000_000, expense: 2_700_000 },
  construction:  { label: '건설/엔지니어링', emoji: '🏗️', salary: 4_200_000, expense: 2_800_000 },
  education:     { label: '교육/연구',      emoji: '🎓', salary: 3_500_000, expense: 2_500_000 },
  medical:       { label: '의료/보건',      emoji: '🏥', salary: 5_000_000, expense: 3_200_000 },
  logistics:     { label: '물류/유통',      emoji: '🚚', salary: 3_500_000, expense: 2_400_000 },
  manufacturing: { label: '제조/생산',      emoji: '🏭', salary: 4_000_000, expense: 2_500_000 },
  legal:         { label: '법무',           emoji: '⚖️', salary: 5_500_000, expense: 3_200_000 },
  hr:            { label: 'HR/인사',        emoji: '👥', salary: 3_800_000, expense: 2_600_000 },
  civil_servant: { label: '공무원',         emoji: '🏛️', salary: 3_200_000, expense: 2_300_000 },
  other:         { label: '기타',           emoji: '📋', salary: 3_000_000, expense: 2_300_000 },
}

const ASSET_PRESETS = [
  { label: '1천만', value: 10_000_000 },
  { label: '3천만', value: 30_000_000 },
  { label: '5천만', value: 50_000_000 },
  { label: '1억',   value: 100_000_000 },
  { label: '3억',   value: 300_000_000 },
]

const SALARY_PRESETS = [
  { label: '250만', value: 2_500_000 },
  { label: '350만', value: 3_500_000 },
  { label: '500만', value: 5_000_000 },
  { label: '700만', value: 7_000_000 },
]

const EXPENSE_PRESETS = [
  { label: '150만', value: 1_500_000 },
  { label: '200만', value: 2_000_000 },
  { label: '250만', value: 2_500_000 },
  { label: '300만', value: 3_000_000 },
]

const TARGET_PRESETS = [
  { label: '1억',  value: 100_000_000 },
  { label: '3억',  value: 300_000_000 },
  { label: '5억',  value: 500_000_000 },
  { label: '10억', value: 1_000_000_000 },
]

const SIDE_PRESETS = [
  { label: '50만',  value: 500_000 },
  { label: '100만', value: 1_000_000 },
  { label: '200만', value: 2_000_000 },
  { label: '300만', value: 3_000_000 },
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
        {value > 0 ? `= ${formatWon(value)}` : ' '}
      </p>
      {presets && (
        <div style={{
          display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap',
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
   Typeform-style Freelancer Wizard (7 questions)

   internal step:
     0 = job select        (Q1)
     1 = assets            (Q2)
     2 = salary            (Q3)
     3 = monthly expense   (Q4)
     4 = target amount     (Q5)
     5 = side income ask   (Q6-A)
     6 = side income amount(Q6-B, sub-step of Q6)
     7 = region            (Q7, last → finish)
   ═══════════════════════════════════════════════════════════ */
export function FreelancerWizard() {
  const router = useRouter()
  const { freelancerInput, updateFreelancerInput, calculate } = useCalculatorStore()
  const [step, setStep] = useState(0)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const benchmark = selectedJob ? JOB_BENCHMARKS[selectedJob] : JOB_BENCHMARKS.other
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
      background: 'linear-gradient(180deg, #FFF8F3 0%, #FFFFFF 60%)',
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
          animation: 'fl-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
          minHeight: 0,
        }}>
          {step === 0 && (
            <Q1Job selectedJob={selectedJob}
              onSelect={k => {
                setSelectedJob(k)
                updateFreelancerInput({ jobType: k })
                setTimeout(goNext, 220)
              }} />
          )}
          {step === 1 && (
            <Q2Assets input={freelancerInput} update={updateFreelancerInput} onNext={goNext} />
          )}
          {step === 2 && (
            <Q3Salary input={freelancerInput} update={updateFreelancerInput}
              benchmark={benchmark} onNext={goNext} />
          )}
          {step === 3 && (
            <Q4Expense input={freelancerInput} update={updateFreelancerInput}
              benchmark={benchmark} onNext={goNext} />
          )}
          {step === 4 && (
            <Q5Target input={freelancerInput} update={updateFreelancerInput} onNext={goNext} />
          )}
          {step === 5 && (
            <Q6SideAsk
              onYes={goNext}
              onNo={() => { updateFreelancerInput({ sideIncome: 0 }); jumpTo(7) }}
            />
          )}
          {step === 6 && (
            <Q6SideAmount input={freelancerInput} update={updateFreelancerInput} onNext={goNext} />
          )}
          {step === 7 && (
            <Q7Region input={freelancerInput} update={updateFreelancerInput} onFinish={finish} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fl-slide-up {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ───── Q1: 직군 선택 (3열 그리드, 탭 → 자동 다음) ───────── */
function Q1Job({
  selectedJob, onSelect,
}: {
  selectedJob: string | null
  onSelect: (k: string) => void
}) {
  return (
    <div>
      <QuestionTitle num={1} text={<>현재 내 뼈를<br />갈아 넣고 있는 직종은?</>}
        sub="사무직, IT/개발, 영업 등" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}>
        {Object.entries(JOB_BENCHMARKS).map(([key, data]) => {
          const sel = selectedJob === key
          return (
            <button key={key} onClick={() => onSelect(key)}
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

/* ───── Q2: 현재 자산 ─────────────────────────────────── */
function Q2Assets({
  input, update, onNext,
}: {
  input: { assets: number }
  update: (p: Record<string, unknown>) => void
  onNext: () => void
}) {
  return (
    <div>
      <QuestionTitle num={2} text={<>퇴사 후 백수로<br />버틸 수 있는 내<br />‘비상금’ 총액은?</>}
        sub="예적금, 주식, 영끌 자산 합산" />
      <AmountInput value={input.assets}
        onChange={v => update({ assets: v })}
        presets={ASSET_PRESETS} autoFocus onEnter={onNext} />
      <ContinueButton onClick={onNext} disabled={input.assets === 0} />
    </div>
  )
}

/* ───── Q3: 월급 ──────────────────────────────────────── */
function Q3Salary({
  input, update, benchmark, onNext,
}: {
  input: { salary: number }
  update: (p: Record<string, unknown>) => void
  benchmark: { label: string; salary: number }
  onNext: () => void
}) {
  return (
    <div>
      <QuestionTitle num={3} text={<>통장을 스치듯 지나가는 내<br />‘사이버 머니<br />(세후 월급)’는?</>}
        sub="실수령액 기준" />
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 20, background: '#FFF1E6',
          fontSize: 13, fontWeight: 700, color: '#C2410C',
        }}>
          💵 {benchmark.label} 평균 {formatWon(benchmark.salary)}
        </div>
        <p style={{ margin: '4px 0 0 14px', fontSize: 10, color: 'rgba(194, 65, 12, 0.4)', fontWeight: 600 }}>
          고용노동부·경총 통계 기반
        </p>
      </div>
      <AmountInput value={input.salary}
        onChange={v => update({ salary: v })}
        presets={SALARY_PRESETS} autoFocus onEnter={onNext} />
      <ContinueButton onClick={onNext} disabled={input.salary === 0} />
    </div>
  )
}

/* ───── Q4: 월 생활비 ─────────────────────────────────── */
function Q4Expense({
  input, update, benchmark, onNext,
}: {
  input: { monthlyExpense: number }
  update: (p: Record<string, unknown>) => void
  benchmark: { label: string; expense: number }
  onNext: () => void
}) {
  return (
    <div>
      <QuestionTitle num={4} text={<>숨만 쉬어도 나가는 고정비 +<br />스트레스 풀려고 지른<br />‘시발비용’ 합계는?</>}
        sub="월세, 식비, 핫김 비용 포함 한 달 지출" />
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 20, background: '#FEF3C7',
          fontSize: 13, fontWeight: 700, color: '#92400E',
        }}>
          🏠 {benchmark.label} 평균 {formatWon(benchmark.expense)}
        </div>
        <p style={{ margin: '4px 0 0 14px', fontSize: 10, color: 'rgba(146, 64, 14, 0.4)', fontWeight: 600 }}>
          고용노동부·경총 통계 기반
        </p>
      </div>
      <AmountInput value={input.monthlyExpense}
        onChange={v => update({ monthlyExpense: v })}
        presets={EXPENSE_PRESETS} autoFocus onEnter={onNext} />
      <ContinueButton onClick={onNext} disabled={input.monthlyExpense === 0} />
    </div>
  )
}

/* ───── Q5: 목표 금액 (큰 버튼 4개 + 직접 입력) ──────────── */
function Q5Target({
  input, update, onNext,
}: {
  input: { targetAmount: number }
  update: (p: Record<string, unknown>) => void
  onNext: () => void
}) {
  const [custom, setCustom] = useState(false)

  if (custom) {
    return (
      <div>
        <QuestionTitle num={5} text={<>‘진짜 이 돈 모으면<br />사표 던진다’ 하는<br />내 목표 금액은?</>}
          sub="파이어족 목표 자금" />
        <AmountInput value={input.targetAmount}
          onChange={v => update({ targetAmount: v })}
          autoFocus onEnter={onNext} />
        <button onClick={() => { update({ targetAmount: 0 }); setCustom(false) }}
          style={{
            marginTop: 20, padding: '12px', width: '100%',
            borderRadius: 12, border: 'none', background: 'transparent',
            fontSize: 14, fontWeight: 700, color: '#64748B', cursor: 'pointer',
          }}>
          ← 프리셋으로 돌아가기
        </button>
        <ContinueButton onClick={onNext} disabled={input.targetAmount === 0} />
      </div>
    )
  }

  return (
    <div>
      <QuestionTitle num={5} text={<>‘진짜 이 돈 모으면<br />사표 던진다’ 하는<br />내 목표 금액은?</>}
        sub="파이어족 목표 자금" />
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        {TARGET_PRESETS.map(p => {
          const sel = input.targetAmount === p.value
          return (
            <button key={p.value}
              onClick={() => {
                update({ targetAmount: p.value })
                setTimeout(onNext, 220)
              }}
              style={{
                padding: '40px 16px', borderRadius: 18,
                border: `2px solid ${sel ? ACCENT : '#E2E8F0'}`,
                background: sel ? `${ACCENT}0A` : '#fff',
                fontSize: 32, fontWeight: 900, color: ACCENT,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: sel ? `0 4px 14px ${ACCENT}20` : '0 1px 4px rgba(0,0,0,0.04)',
                letterSpacing: '-1px',
              }}>
              {p.label}
            </button>
          )
        })}
      </div>
      <button onClick={() => setCustom(true)}
        style={{
          marginTop: 20, padding: '16px', width: '100%',
          borderRadius: 12, border: '1.5px solid #E2E8F0',
          background: '#fff', fontSize: 14, fontWeight: 700,
          color: '#64748B', cursor: 'pointer',
        }}>
        ✏️ 직접 입력하기
      </button>
    </div>
  )
}

/* ───── Q6-A: 부업 수입 있음/없음 (큰 버튼 2개) ──────────── */
function Q6SideAsk({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <div>
      <QuestionTitle num={6} text={<>요즘 유행하는 N잡러,<br />나도 몰래 꿀 빠는<br />‘부업 파이프라인’이 있나요?</>}
        sub="있음(부업 중) / 없음(월급 올인)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={onYes}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '26px 22px', borderRadius: 16, border: '2px solid #E2E8F0',
            background: '#fff', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s',
          }}>
          <span style={{ fontSize: 32 }}>💡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#1A1F5E' }}>있어요</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>프리랜서, 투잡, 투자수익 등</div>
          </div>
        </button>
        <button onClick={onNo}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '26px 22px', borderRadius: 16, border: '2px solid #E2E8F0',
            background: '#fff', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s',
          }}>
          <span style={{ fontSize: 32 }}>🙅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#1A1F5E' }}>없어요</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>지역 선택으로 이동</div>
          </div>
        </button>
      </div>
    </div>
  )
}

/* ───── Q6-B: 부업 수입 금액 입력 ─────────────────────── */
function Q6SideAmount({
  input, update, onNext,
}: {
  input: { sideIncome: number }
  update: (p: Record<string, unknown>) => void
  onNext: () => void
}) {
  return (
    <div>
      <QuestionTitle num={6} text={<>부업 수입은<br />한 달에 얼마예요?</>}
        sub="평균 금액으로 입력해주세요" />
      <AmountInput value={input.sideIncome}
        onChange={v => update({ sideIncome: v })}
        presets={SIDE_PRESETS} autoFocus onEnter={onNext} />
      <ContinueButton onClick={onNext} disabled={input.sideIncome === 0} />
    </div>
  )
}

/* ───── Q7: 지역 선택 (마지막) ────────────────────────── */
function Q7Region({
  input, update, onFinish,
}: {
  input: { region?: string; district?: string }
  update: (p: Record<string, unknown>) => void
  onFinish: () => void
}) {
  return (
    <div>
      <QuestionTitle num={7} text={<>지옥철을 타고<br />출근하는 회사 위치는?</>}
        sub="서울/경기 등 지역 선택" />
      <RegionSelect
        region={input.region ?? ''}
        district={input.district ?? ''}
        onChange={(region, district) => update({ region, district })}
        onNext={onFinish}
      />
      <ContinueButton
        onClick={onFinish}
        disabled={!input.region || !input.district}
        label="퇴사 D-day 확인하기 🚀"
      />
    </div>
  )
}
