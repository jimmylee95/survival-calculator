'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { type User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  saveDailyInput,
  type DailyInputMode,
} from '@/lib/supabase/daily-input'
import {
  getLatestCalculation,
  type CalculationRecord,
} from '@/lib/supabase/dashboard'
import {
  type BusinessInput,
  type FreelancerInput,
  VARIABLE_RATE,
  formatWon,
} from '@/utils/calculate'

const TOTAL = 3

const BIZ_REVENUE_PRESETS = [
  { label: '30만',  value:   300_000 },
  { label: '50만',  value:   500_000 },
  { label: '80만',  value:   800_000 },
  { label: '100만', value: 1_000_000 },
  { label: '150만', value: 1_500_000 },
]
const BIZ_EXPENSE_PRESETS = [
  { label: '5만',   value:    50_000 },
  { label: '10만',  value:   100_000 },
  { label: '30만',  value:   300_000 },
  { label: '50만',  value:   500_000 },
]
const BIZ_CATEGORIES = ['식자재', '인건비', '임대료', '마케팅', '기타']

const FREE_SAVINGS_PRESETS = [
  { label: '30만',  value:   300_000 },
  { label: '50만',  value:   500_000 },
  { label: '100만', value: 1_000_000 },
  { label: '200만', value: 2_000_000 },
]
const FREE_EXPENSE_PRESETS = [
  { label: '10만',  value:   100_000 },
  { label: '30만',  value:   300_000 },
  { label: '50만',  value:   500_000 },
  { label: '100만', value: 1_000_000 },
]
const FREE_CATEGORIES = ['여행', '쇼핑', '경조사', '의료비', '기타']

/* ── 페이지 ───────────────────────────────────────────── */
export default function InputPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser]       = useState<User | null>(null)
  const [latest, setLatest]   = useState<CalculationRecord | null>(null)

  const [step, setStep]       = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [amount1, setAmount1] = useState(0)   // 매출 또는 저축
  const [amount2, setAmount2] = useState(0)   // 지출
  const [category, setCategory] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const mode: DailyInputMode = (latest?.mode as DailyInputMode | undefined) ?? 'business'
  const isBiz = mode === 'business'
  const accent = isBiz ? '#1A1F5E' : '#FF6B35'
  const accentTo = isBiz ? '#4F46E5' : '#E8590C'

  useEffect(() => {
    let cancelled = false
    const sb = createClient()
    sb.auth.getUser()
      .then(async ({ data: { user } }) => {
        if (cancelled) return
        if (!user) { router.replace('/login'); return }
        const l = await getLatestCalculation(user.id)
        if (cancelled) return
        setUser(user)
        setLatest(l)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) router.replace('/login') })
    return () => { cancelled = true }
  }, [router])

  function goNext() {
    setAnimKey(k => k + 1)
    setStep(s => s + 1)
  }
  function goBack() {
    if (step === 0) { router.back(); return }
    setAnimKey(k => k + 1)
    setStep(s => s - 1)
  }

  // Step 1 완료 — 매출/저축 저장 후 다음
  async function commitStep1(value: number) {
    setAmount1(value)
    if (user && value > 0) {
      const type = isBiz ? 'revenue' : 'savings'
      saveDailyInput(user.id, mode, type, value).catch(() => {})
    }
    goNext()
  }

  // Step 2 완료 — 지출 저장 후 다음
  async function commitStep2(value: number, cat: string | null) {
    setAmount2(value)
    setCategory(cat)
    setSaving(true)
    if (user && value > 0) {
      await saveDailyInput(user.id, mode, 'expense', value, cat)
    }
    setSaving(false)
    goNext()
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 28 }}>⚡</div>
      </div>
    )
  }

  const progressIdx = Math.min(step + 1, TOTAL)

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 60%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: '100%', overflowX: 'hidden',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      }}>
        {/* 상단 바 */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ height: 3, background: '#F1F5F9' }}>
            <div style={{
              height: '100%',
              width: `${(progressIdx / TOTAL) * 100}%`,
              background: accent,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
          {step < 2 && (
            <button onClick={goBack} aria-label="뒤로 가기"
              style={{
                background: 'none', border: 'none',
                fontSize: 24, color: '#64748B',
                cursor: 'pointer', padding: '14px 18px',
                display: 'block',
              }}>
              ←
            </button>
          )}
          {step === 2 && <div style={{ height: 52 }} />}
        </div>

        {/* 콘텐츠 */}
        <div key={animKey} style={{
          flex: 1, padding: '8px 24px 60px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          animation: 'inp-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}>
          {step === 0 && (isBiz ? (
            <Step1Number
              num={1}
              question={<>오늘 매출은<br />얼마였나요?</>}
              sub="카드+현금+배달 모두 합쳐서 입력해주세요"
              presets={BIZ_REVENUE_PRESETS}
              skipLabel="매출 없음"
              accent={accent}
              onCommit={commitStep1}
            />
          ) : (
            <Step1Number
              num={1}
              question={<>이번 달 저축은<br />얼마 했나요?</>}
              sub="모은 금액을 입력해주세요"
              presets={FREE_SAVINGS_PRESETS}
              skipLabel="아직 안 했어요"
              accent={accent}
              onCommit={commitStep1}
            />
          ))}

          {step === 1 && (isBiz ? (
            <Step2Expense
              num={2}
              question={<>오늘 지출은요?</>}
              sub="식자재, 인건비, 임대료 등 오늘 쓴 돈"
              presets={BIZ_EXPENSE_PRESETS}
              categories={BIZ_CATEGORIES}
              skipLabel="지출 없음"
              accent={accent}
              accentTo={accentTo}
              saving={saving}
              onCommit={commitStep2}
            />
          ) : (
            <Step2Expense
              num={2}
              question={<>특별 지출이<br />있었나요?</>}
              sub="평소와 다른 큰 지출이 있었다면 입력해주세요"
              presets={FREE_EXPENSE_PRESETS}
              categories={FREE_CATEGORIES}
              skipLabel="없었어요"
              accent={accent}
              accentTo={accentTo}
              saving={saving}
              onCommit={commitStep2}
            />
          ))}

          {step === 2 && (
            <Step3Done
              isBiz={isBiz}
              latest={latest}
              amount1={amount1}
              amount2={amount2}
              accent={accent}
              accentTo={accentTo}
              onDone={() => router.push('/dashboard')}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes inp-slide-up {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes inp-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes inp-confetti {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/* ─────────────────────── 공통 컴포넌트 ─────────────────── */

function QuestionTitle({
  num, text, sub, accent,
}: {
  num: number; text: React.ReactNode; sub?: string; accent: string
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 13, fontWeight: 800, color: accent,
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
        <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function AmountInput({
  value, onChange, accent, autoFocus, onEnter,
}: {
  value: number
  onChange: (v: number) => void
  accent: string
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
    <div style={{
      display: 'flex', alignItems: 'baseline',
      gap: 8, paddingBottom: 12,
      borderBottom: `2px solid ${value > 0 ? accent : '#E2E8F0'}`,
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
          fontSize: 40, fontWeight: 900, color: accent,
          background: 'transparent', border: 'none', outline: 'none',
          letterSpacing: '-1px', padding: 0,
        }}
      />
      <span style={{ fontSize: 20, fontWeight: 700, color: '#94A3B8' }}>원</span>
    </div>
  )
}

function PresetRow({
  presets, value, onPick, accent,
}: {
  presets: { label: string; value: number }[]
  value: number
  onPick: (v: number) => void
  accent: string
}) {
  return (
    <div style={{
      display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap',
    }}>
      {presets.map(p => {
        const sel = value === p.value
        return (
          <button key={p.value} onClick={() => onPick(p.value)}
            style={{
              padding: '12px 18px', borderRadius: 24,
              fontSize: 14, fontWeight: 700,
              border: `1.5px solid ${sel ? accent : '#E2E8F0'}`,
              background: sel ? accent : '#fff',
              color: sel ? '#fff' : '#475569',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

function PrimaryButton({
  onClick, disabled, label, accent, accentTo, loading,
}: {
  onClick: () => void; disabled?: boolean; label: string
  accent: string; accentTo: string; loading?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{
        marginTop: 36, width: '100%', height: 60, borderRadius: 14,
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: 17, fontWeight: 900, color: '#fff',
        background: disabled
          ? '#E2E8F0'
          : `linear-gradient(135deg, ${accent}, ${accentTo})`,
        boxShadow: disabled ? 'none' : `0 8px 24px ${accent}30`,
        transition: 'all 0.2s', letterSpacing: '-0.3px',
      }}>
      {loading ? '저장 중…' : label}
    </button>
  )
}

function SkipButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        marginTop: 16, width: '100%', padding: '14px',
        borderRadius: 12, border: '1.5px dashed #CBD5E1',
        background: 'transparent', fontSize: 14, fontWeight: 700,
        color: '#64748B', cursor: 'pointer',
      }}>
      {label}
    </button>
  )
}

/* ─────────────────────── Step 1 ─────────────────────── */
function Step1Number({
  num, question, sub, presets, skipLabel, accent, onCommit,
}: {
  num: number
  question: React.ReactNode
  sub?: string
  presets: { label: string; value: number }[]
  skipLabel: string
  accent: string
  onCommit: (value: number) => void
}) {
  const [value, setValue] = useState(0)

  function pickPreset(v: number) {
    setValue(v)
    setTimeout(() => onCommit(v), 200)
  }

  return (
    <div>
      <QuestionTitle num={num} text={question} sub={sub} accent={accent} />
      <AmountInput
        value={value}
        onChange={setValue}
        accent={accent}
        autoFocus
        onEnter={() => value > 0 && onCommit(value)}
      />
      <PresetRow presets={presets} value={value} onPick={pickPreset} accent={accent} />
      <PrimaryButton
        onClick={() => onCommit(value)}
        disabled={value === 0}
        label="다음"
        accent={accent}
        accentTo={accent}
      />
      <SkipButton label={skipLabel} onClick={() => onCommit(0)} />
    </div>
  )
}

/* ─────────────────────── Step 2 ─────────────────────── */
function Step2Expense({
  num, question, sub, presets, categories, skipLabel,
  accent, accentTo, saving, onCommit,
}: {
  num: number
  question: React.ReactNode
  sub?: string
  presets: { label: string; value: number }[]
  categories: string[]
  skipLabel: string
  accent: string
  accentTo: string
  saving: boolean
  onCommit: (value: number, category: string | null) => void
}) {
  const [value, setValue] = useState(0)
  const [cat, setCat]     = useState<string | null>(null)

  return (
    <div>
      <QuestionTitle num={num} text={question} sub={sub} accent={accent} />
      <AmountInput
        value={value}
        onChange={setValue}
        accent={accent}
        autoFocus
        onEnter={() => value > 0 && onCommit(value, cat)}
      />
      <PresetRow presets={presets} value={value} onPick={setValue} accent={accent} />

      {/* 카테고리 */}
      <div style={{ marginTop: 24 }}>
        <p style={{
          fontSize: 12, fontWeight: 800, color: '#94A3B8',
          margin: '0 0 10px', letterSpacing: '0.3px',
        }}>
          카테고리 (선택)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map(c => {
            const sel = cat === c
            return (
              <button key={c} onClick={() => setCat(sel ? null : c)}
                style={{
                  padding: '10px 16px', borderRadius: 22,
                  fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${sel ? accent : '#E2E8F0'}`,
                  background: sel ? `${accent}10` : '#fff',
                  color: sel ? accent : '#475569',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <PrimaryButton
        onClick={() => onCommit(value, cat)}
        disabled={value === 0}
        loading={saving}
        label="기록하기"
        accent={accent}
        accentTo={accentTo}
      />
      <SkipButton label={skipLabel} onClick={() => onCommit(0, null)} />
    </div>
  )
}

/* ─────────────────────── Step 3 (완료) ─────────────────────── */
function Step3Done({
  isBiz, latest, amount1, amount2, accent, accentTo, onDone,
}: {
  isBiz: boolean
  latest: CalculationRecord | null
  amount1: number   // 매출 또는 저축
  amount2: number   // 지출
  accent: string
  accentTo: string
  onDone: () => void
}) {
  const delta = computeDelta(isBiz, latest, amount1, amount2)

  return (
    <div style={{ position: 'relative', textAlign: 'center', paddingTop: 12 }}>
      <Confetti />

      <div style={{
        fontSize: 72, lineHeight: 1, marginBottom: 16,
        animation: 'inp-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}>
        🎉
      </div>

      <h2 style={{
        fontSize: 30, fontWeight: 900, color: '#0F172A',
        margin: '0 0 10px', letterSpacing: '-0.7px',
      }}>
        기록 완료!
      </h2>
      <p style={{
        fontSize: 14, color: '#64748B',
        margin: '0 0 28px', lineHeight: 1.6,
      }}>
        오늘도 한 걸음 더 가까워졌어요
      </p>

      {/* 변화 메시지 */}
      {delta && (
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '14px 22px', borderRadius: 18,
          background: delta.good ? '#F0FFF4' : '#FFF5F5',
          border: `1.5px solid ${delta.good ? '#9AE6B4' : '#FEB2B2'}`,
          marginBottom: 32,
        }}>
          <span style={{ fontSize: 24, marginRight: 12 }}>
            {delta.good ? '📈' : '📉'}
          </span>
          <div style={{ textAlign: 'left' }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: '#94A3B8',
              margin: '0 0 2px', letterSpacing: '0.2px',
            }}>
              {isBiz ? '런웨이 변화' : '탈출일 변화'}
            </p>
            <p style={{
              fontSize: 17, fontWeight: 900,
              color: delta.good ? '#276749' : '#C53030',
              margin: 0, letterSpacing: '-0.3px',
            }}>
              {delta.message}
            </p>
          </div>
        </div>
      )}

      {/* 입력 요약 */}
      {(amount1 > 0 || amount2 > 0) && (
        <div style={{
          background: '#F8F9FB', borderRadius: 16,
          padding: '14px 18px', marginBottom: 28,
          textAlign: 'left',
        }}>
          {amount1 > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '4px 0',
            }}>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                {isBiz ? '매출' : '저축'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1A1F5E' }}>
                {formatWon(amount1)}
              </span>
            </div>
          )}
          {amount2 > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '4px 0',
            }}>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                지출
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1A1F5E' }}>
                {formatWon(amount2)}
              </span>
            </div>
          )}
        </div>
      )}

      <button onClick={onDone}
        style={{
          width: '100%', height: 60, borderRadius: 14,
          border: 'none', cursor: 'pointer',
          fontSize: 17, fontWeight: 900, color: '#fff',
          background: `linear-gradient(135deg, ${accent}, ${accentTo})`,
          boxShadow: `0 8px 24px ${accent}30`,
          letterSpacing: '-0.3px',
        }}>
        대시보드로 돌아가기 →
      </button>
    </div>
  )
}

/* ── 결과 변화 계산 ─────────────────────────────────── */
function computeDelta(
  isBiz: boolean,
  latest: CalculationRecord | null,
  amount1: number,
  amount2: number,
): { good: boolean; message: string } | null {
  if (!latest) return null

  if (isBiz) {
    const biz = latest.input_data as BusinessInput
    const variableRate = VARIABLE_RATE[biz.industryType] ?? 0.35
    const monthlyVar   = biz.monthlyRevenue * variableRate
    const monthlyNetLoss = (biz.fixedCost + biz.loanInterest + monthlyVar) - biz.monthlyRevenue
    if (monthlyNetLoss <= 0) return null  // 흑자면 변화 의미 없음

    const todayBalanceChange = amount1 * (1 - variableRate) - amount2
    const runwayChangeDays   = (todayBalanceChange / monthlyNetLoss) * 30
    if (Math.abs(runwayChangeDays) < 0.05) return null

    const good = runwayChangeDays > 0
    const abs  = Math.abs(runwayChangeDays).toFixed(1)
    return {
      good,
      message: good ? `어제보다 +${abs}일!` : `어제보다 -${abs}일`,
    }
  } else {
    const free = latest.input_data as FreelancerInput
    const totalExpense   = free.monthlyExpense + free.loanInterest
    const monthlySavings = free.salary - totalExpense + free.sideIncome
    if (monthlySavings <= 0) return null

    const todayDelta    = amount1 - amount2  // 저축 - 지출
    const escapeChange  = -(todayDelta / monthlySavings) * 30
    if (Math.abs(escapeChange) < 0.5) return null

    const good = escapeChange < 0   // 음수 = 탈출 빨라짐
    const days = Math.round(Math.abs(escapeChange))
    return {
      good,
      message: good
        ? `탈출이 ${days}일 앞당겨졌어요!`
        : `탈출이 ${days}일 밀렸어요`,
    }
  }
}

/* ── 컨페티 ─────────────────────────────────────────── */
function Confetti() {
  const colors = ['#FF6B35', '#1A1F5E', '#4F46E5', '#FEE500', '#38A169', '#3182F6']
  const pieces = Array.from({ length: 24 }, (_, i) => i)
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {pieces.map(i => {
        const left  = ((i * 41 + 7) % 100)
        const delay = ((i * 13) % 100) / 100
        const size  = 6 + ((i * 7) % 6)
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${left}%`,
            top: '-20px',
            width: size, height: size * 1.5,
            background: colors[i % colors.length],
            borderRadius: 2,
            opacity: 0,
            animation: `inp-confetti ${2 + (i % 3) * 0.4}s ${delay.toFixed(2)}s ease-in forwards`,
          }} />
        )
      })}
    </div>
  )
}
