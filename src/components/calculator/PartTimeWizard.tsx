'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatWon } from '@/utils/calculate'

const ACCENT      = '#22C55E'
const ACCENT_DARK = '#16A34A'
const ACCENT_BG   = '#ECFDF5'
const TOTAL       = 4

const JOB_TYPES: { key: string; emoji: string; label: string }[] = [
  { key: 'cafe',         emoji: '☕',   label: '카페' },
  { key: 'chicken_pizza', emoji: '🍗',   label: '치킨/피자' },
  { key: 'restaurant',   emoji: '🍽️',   label: '음식점' },
  { key: 'convenience',  emoji: '🏪',   label: '편의점' },
  { key: 'mart',         emoji: '🛒',   label: '마트/유통' },
  { key: 'logistics',    emoji: '📦',   label: '물류/택배' },
  { key: 'tutor',        emoji: '🎓',   label: '과외/학원' },
  { key: 'fitness',      emoji: '🏋️',   label: '헬스/피트니스' },
  { key: 'hospital',     emoji: '🏥',   label: '병원/약국' },
  { key: 'fastfood',     emoji: '🍔',   label: '패스트푸드' },
  { key: 'cinema',       emoji: '🎬',   label: '영화관/문화' },
  { key: 'hotel',        emoji: '🏨',   label: '호텔/숙박' },
  { key: 'retail',       emoji: '📱',   label: '매장판매' },
  { key: 'construction', emoji: '🏗️',   label: '건설/현장' },
  { key: 'office',       emoji: '🖥️',   label: '사무보조' },
  { key: 'other',        emoji: '🎨',   label: '기타' },
]

const AMOUNT_PRESETS = [
  { label: '50만',   value:    500_000 },
  { label: '100만',  value:  1_000_000 },
  { label: '500만',  value:  5_000_000 },
  { label: '1000만', value: 10_000_000 },
  { label: '3000만', value: 30_000_000 },
]

type Category = '전체' | '일상' | '먹방' | '테크' | '놀기' | '패션' | '여행' | '큰거'

type Item = {
  id:    string
  cat:   Exclude<Category, '전체'>
  emoji: string
  name:  string
  price: number
}

const CATEGORIES: Category[] = ['전체', '일상', '먹방', '테크', '놀기', '패션', '여행', '큰거']

const ITEMS: Item[] = [
  { id: 'starbucks', cat: '먹방', emoji: '☕', name: '스타벅스 아아', price: 4_500 },
  { id: 'bbq',       cat: '먹방', emoji: '🍗', name: 'BBQ 황올',     price: 20_000 },
  { id: 'pizza',     cat: '먹방', emoji: '🍕', name: '피자 라지',    price: 25_000 },
  { id: 'beer',      cat: '일상', emoji: '🍺', name: '편맥 4캔',     price: 12_000 },
  { id: 'cgv',       cat: '놀기', emoji: '🎬', name: 'CGV 영화',     price: 15_000 },
  { id: 'haircut',   cat: '일상', emoji: '💇', name: '미용실 커트',  price: 20_000 },
  { id: 'airpods',   cat: '테크', emoji: '🎧', name: '에어팟 프로',  price: 359_000 },
  { id: 'iphone',    cat: '테크', emoji: '📱', name: '아이폰 16',    price: 1_550_000 },
  { id: 'dunk',      cat: '패션', emoji: '👟', name: '나이키 덩크',  price: 139_000 },
  { id: 'ps5',       cat: '놀기', emoji: '🎮', name: 'PS5 슬림',     price: 568_000 },
  { id: 'japan',     cat: '여행', emoji: '🛫', name: '일본 왕복',    price: 350_000 },
  { id: 'car',       cat: '큰거', emoji: '🚗', name: '경차 중고',    price: 8_000_000 },
]

type WageQuick = { label: string; rate: number; hint?: string }
const WAGE_QUICKS: WageQuick[] = [
  { label: '10,320원', rate: 10_320, hint: '2026 최저' },
]

type WageGrade = { grade: 'D' | 'C' | 'B' | 'A' | 'S'; label: string; color: string; bg: string }

function gradeForWage(rate: number): WageGrade {
  if (rate <= 10_320) return { grade: 'D', label: '최저시급 알바생', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
  if (rate < 13_000) return { grade: 'C', label: '알바생 평균',    color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' }
  if (rate < 17_000) return { grade: 'B', label: '시급 좀 받네',   color: '#22C55E', bg: 'rgba(34, 197, 94, 0.14)' }
  if (rate < 25_000) return { grade: 'A', label: '능력자 알바',    color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.14)' }
  return                    { grade: 'S', label: '프리랜서급',     color: '#A855F7', bg: 'rgba(168, 85, 247, 0.16)' }
}

function nureungiComment(hours: number): string {
  if (hours < 1)   return '이 정도는 뭐… 한 시간도 안 걸리잖아 멍!'
  if (hours < 3)   return '오전 내내 서서 일해야 겨우 사는 거다 멍?'
  if (hours < 8)   return '하루 종일 일해야 겨우 사는 거다 멍…'
  if (hours < 24)  return '며칠을 갈아 넣어야 되는데? 멍!'
  if (hours < 100) return '몇 주를 통째로 바쳐야 한다 멍.'
  if (hours < 500) return '몇 달치 인생을 갈아 넣는 금액이다 멍…'
  return '네 알바 인생 전체를 바쳐도 모자란 금액이야 멍.'
}

function formatWorkTime(hours: number): { primary: string; sub: string } {
  if (!isFinite(hours) || hours <= 0) return { primary: '0시간', sub: '' }
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60

  if (h === 0) return { primary: `${m}분`, sub: '' }
  if (h < 24)  return { primary: `${h}시간${m ? ` ${m}분` : ''}`, sub: '' }

  const days = h / 8
  if (days < 30) return { primary: `${h.toLocaleString('ko-KR')}시간`, sub: `하루 8시간 기준 약 ${Math.round(days)}일` }
  const months = days / 22
  if (months < 12) return { primary: `${h.toLocaleString('ko-KR')}시간`, sub: `주 5일 풀타임 약 ${months.toFixed(1)}개월` }
  const years = months / 12
  return { primary: `${h.toLocaleString('ko-KR')}시간`, sub: `주 5일 풀타임 약 ${years.toFixed(1)}년` }
}

const RAMEN_PRICE = 1_300
const BUS_FARE    = 1_500

/* ── 공통 컴포넌트 ─────────────────────────────────────── */

function QuestionTitle({ num, text, sub }: { num: number; text: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 13, fontWeight: 800, color: ACCENT_DARK,
        marginBottom: 12, letterSpacing: '0.5px',
      }}>
        Q{num} / {TOTAL}
      </div>
      <h2 style={{
        fontSize: 24, fontWeight: 900, color: '#0F172A',
        margin: '0 0 10px', letterSpacing: '-0.7px', lineHeight: 1.3,
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

function ContinueButton({
  onClick, disabled, label = '다음',
}: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        marginTop: 28, width: '100%', height: 56, borderRadius: 14,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 16, fontWeight: 900, color: '#fff',
        background: disabled ? '#E2E8F0' : ACCENT,
        boxShadow: disabled ? 'none' : `0 8px 24px ${ACCENT}30`,
        transition: 'all 0.2s', letterSpacing: '-0.3px',
      }}>
      {label}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════
   알바생 시급 환산기 풀페이지 위저드 (BusinessWizard 패턴)
     step 0 = 시급 입력
     step 1 = 업종 선택
     step 2 = 금액 선택 (직접 입력 or 아이템)
     step 3 = 결과
   ═══════════════════════════════════════════════════════════ */
export function PartTimeWizard() {
  const router = useRouter()
  const [step, setStep]         = useState(0)
  const [animKey, setAnimKey]   = useState(0)
  const [wage, setWage]         = useState(10_320)
  const [jobType, setJobType]   = useState<string>('')
  const [amount, setAmount]     = useState(0)
  const [picked, setPicked]     = useState<Item | null>(null)
  const [category, setCategory] = useState<Category>('전체')

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
  function restart() {
    setAnimKey(k => k + 1)
    setAmount(0)
    setPicked(null)
    setStep(0)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 60%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: '100%', overflowX: 'hidden',
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      }}>
        {/* 상단: 프로그레스 바 + 뒤로가기 */}
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

        {/* 질문 영역 (세로 중앙 정렬) */}
        <div key={animKey} style={{
          flex: 1, padding: '8px 24px 60px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          animation: 'pt-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
          minHeight: 0,
        }}>
          {step === 0 && (
            <Q1Wage wage={wage} setWage={setWage} onNext={goNext} />
          )}
          {step === 1 && (
            <Q2Job jobType={jobType} setJobType={setJobType} onNext={goNext} />
          )}
          {step === 2 && (
            <Q3Item
              wage={wage}
              amount={amount} setAmount={setAmount}
              picked={picked} setPicked={setPicked}
              category={category} setCategory={setCategory}
              onNext={goNext}
            />
          )}
          {step === 3 && (
            <Q4Result wage={wage} amount={amount} picked={picked} onRestart={restart} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes pt-slide-up {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ───── Q1: 시급 입력 (3열 카드 그리드 + 직접 입력 카드) ─── */
function Q1Wage({
  wage, setWage, onNext,
}: { wage: number; setWage: (v: number) => void; onNext: () => void }) {
  // wage가 프리셋 중 하나에 일치하면 그 프리셋이 선택된 상태,
  // 일치하지 않는 양수면 '직접 입력' 카드가 선택된 상태로 간주
  const isPreset    = WAGE_QUICKS.some(q => q.rate === wage)
  const [customMode, setCustomMode] = useState<boolean>(wage > 0 && !isPreset)
  const grade       = useMemo(() => gradeForWage(wage), [wage])
  const inputRef    = useRef<HTMLInputElement>(null)
  const display     = wage > 0 ? wage.toLocaleString('ko-KR') : ''

  useEffect(() => {
    if (customMode) {
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [customMode])

  function pickPreset(rate: number) {
    setCustomMode(false)
    setWage(rate)
    setTimeout(onNext, 500)
  }
  function pickCustom() {
    setCustomMode(true)
    if (isPreset) setWage(0)
  }

  return (
    <div>
      <QuestionTitle num={1} text={<>내 시급은<br />얼마야?</>}
        sub="2026 최저 시급 10,320원 또는 직접 입력" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
      }}>
        {/* 직접 입력 카드 (왼쪽) */}
        <button onClick={pickCustom}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 6,
            padding: '14px 6px',
            minHeight: 88,
            borderRadius: 14,
            border: `2px solid ${customMode ? ACCENT : '#E2E8F0'}`,
            background: customMode ? `${ACCENT}0F` : '#fff',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: customMode ? `0 4px 14px ${ACCENT}20` : 'none',
          }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>✏️</span>
          <span style={{
            fontSize: 12, fontWeight: 800,
            color: customMode ? ACCENT_DARK : '#1A1F5E',
            lineHeight: 1.25, textAlign: 'center', wordBreak: 'keep-all',
          }}>
            직접 입력
          </span>
        </button>

        {WAGE_QUICKS.map(q => {
          const sel = !customMode && wage === q.rate
          return (
            <button key={q.rate} onClick={() => pickPreset(q.rate)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 6,
                padding: '14px 6px',
                minHeight: 88,
                borderRadius: 14,
                border: `2px solid ${sel ? ACCENT : '#E2E8F0'}`,
                background: sel ? `${ACCENT}0F` : '#fff',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: sel ? `0 4px 14px ${ACCENT}20` : 'none',
              }}>
              <span style={{ fontSize: 24, lineHeight: 1 }}>💰</span>
              <span style={{
                fontSize: 12, fontWeight: 800,
                color: sel ? ACCENT_DARK : '#1A1F5E',
                lineHeight: 1.25, textAlign: 'center', wordBreak: 'keep-all',
              }}>
                {q.label}
              </span>
              {q.hint && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: sel ? ACCENT_DARK : '#94A3B8',
                  lineHeight: 1.2,
                }}>
                  {q.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 직접 입력 모드일 때 인풋 필드 */}
      {customMode && (
        <div style={{
          marginTop: 20,
          padding: '16px 18px',
          borderRadius: 14,
          background: '#F8FAFC',
          border: '1.5px solid #E2E8F0',
          animation: 'pt-slide-up 0.3s ease both',
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8,
            paddingBottom: 10,
            borderBottom: `2px solid ${wage > 0 ? ACCENT : '#E2E8F0'}`,
            transition: 'border-color 0.2s',
          }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={display}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                setWage(raw ? parseInt(raw, 10) : 0)
              }}
              onKeyDown={e => { if (e.key === 'Enter' && wage > 0) onNext() }}
              placeholder="0"
              style={{
                flex: 1, minWidth: 0, textAlign: 'right',
                fontSize: 32, fontWeight: 900, color: ACCENT,
                background: 'transparent', border: 'none', outline: 'none',
                letterSpacing: '-0.5px', padding: 0,
              }}
            />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#94A3B8' }}>원/시</span>
          </div>
        </div>
      )}

      {/* 등급 뱃지 (시급 결정된 경우) */}
      {wage > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'center',
          marginTop: 20,
          animation: 'pt-slide-up 0.3s ease both',
        }}>
          <div style={{
            padding: '8px 14px',
            borderRadius: 999,
            background: grade.bg,
            color: grade.color,
            fontSize: 13, fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: `1.5px solid ${grade.color}33`,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 6,
              background: grade.color, color: '#fff', fontSize: 12, fontWeight: 900,
            }}>{grade.grade}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{grade.label}</span>
          </div>
        </div>
      )}

      {/* 직접 입력 모드일 때만 다음 버튼 노출 (프리셋은 자동 다음) */}
      {customMode && (
        <ContinueButton onClick={onNext} disabled={wage <= 0} label="다음 →" />
      )}
    </div>
  )
}

/* ───── Q2: 업종 선택 (3열 카드 그리드, 자동 다음) ─────── */
function Q2Job({
  jobType, setJobType, onNext,
}: { jobType: string; setJobType: (v: string) => void; onNext: () => void }) {
  return (
    <div>
      <QuestionTitle num={2} text={<>어떤 알바를<br />하고 있어?</>}
        sub="알바 업종에 따라 맞춤 분석을 해줄게" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}>
        {JOB_TYPES.map(j => {
          const sel = jobType === j.key
          return (
            <button key={j.key}
              onClick={() => {
                setJobType(j.key)
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
                background: sel ? `${ACCENT}0F` : '#fff',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: sel ? `0 4px 14px ${ACCENT}20` : 'none',
              }}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>{j.emoji}</span>
              <span style={{
                fontSize: 12, fontWeight: 800,
                color: sel ? ACCENT_DARK : '#1A1F5E',
                lineHeight: 1.25,
                textAlign: 'center',
                wordBreak: 'keep-all',
              }}>
                {j.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ───── Q3: 목표 금액 입력 + 인기 아이템 그리드 ─────────── */
function Q3Item({
  wage, amount, setAmount, picked, setPicked,
  category, setCategory, onNext,
}: {
  wage: number
  amount: number; setAmount: (v: number) => void
  picked: Item | null; setPicked: (i: Item | null) => void
  category: Category; setCategory: (c: Category) => void
  onNext: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const display = amount > 0 ? amount.toLocaleString('ko-KR') : ''

  const filtered = useMemo(
    () => category === '전체' ? ITEMS : ITEMS.filter(i => i.cat === category),
    [category],
  )

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350)
    return () => clearTimeout(t)
  }, [])

  function pickItem(item: Item) {
    setPicked(item)
    setAmount(item.price)
    setTimeout(onNext, 220)
  }
  function handleAmountInput(v: string) {
    const raw = v.replace(/[^0-9]/g, '')
    setAmount(raw ? parseInt(raw, 10) : 0)
    setPicked(null)
  }
  function pickPreset(v: number) {
    setAmount(v)
    setPicked(null)
  }

  const hoursForItem = (price: number) => wage > 0 ? price / wage : 0

  return (
    <div>
      <QuestionTitle num={3} text={<>목표 금액<br />또는 지출 예정 금액은?</>}
        sub="목표 금액을 입력하거나 아이템을 골라봐" />

      {/* 상단: 금액 직접 입력 (직장인 AmountInput 패턴) */}
      <div style={{
        display: 'flex', alignItems: 'baseline',
        gap: 8, paddingBottom: 12,
        borderBottom: `2px solid ${amount > 0 ? ACCENT : '#E2E8F0'}`,
        transition: 'border-color 0.2s',
      }}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={e => handleAmountInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && amount > 0) onNext() }}
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
        fontSize: 14, color: amount > 0 ? ACCENT_DARK : '#CBD5E1',
        fontWeight: 700, textAlign: 'right', margin: '12px 0 0', minHeight: 18,
      }}>
        {amount > 0 ? `= ${formatWon(amount)}` : ' '}
      </p>

      {/* 프리셋 */}
      <div style={{
        display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap',
      }}>
        {AMOUNT_PRESETS.map(p => {
          const sel = !picked && amount === p.value
          return (
            <button key={p.value} onClick={() => pickPreset(p.value)}
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

      {/* 다음 버튼 (직접 입력/프리셋 흐름) */}
      <ContinueButton onClick={onNext} disabled={amount <= 0} label="결과 보기 →" />

      {/* 하단: 인기 아이템 그리드 (보조 영역) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '32px 0 16px',
      }}>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700 }}>
          또는 인기 아이템 골라보기
        </span>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
      </div>

      {/* 카테고리 필터 */}
      <div style={{
        display: 'flex', gap: 6,
        overflowX: 'auto', padding: '0 0 8px',
        marginBottom: 10,
        scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map(cat => {
          const sel = cat === category
          return (
            <button key={cat} type="button" onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '6px 12px', borderRadius: 999,
                border: 'none',
                background: sel ? ACCENT : '#F1F5F9',
                color: sel ? '#fff' : '#64748B',
                fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {cat}
            </button>
          )
        })}
      </div>

      {/* 아이템 그리드 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}>
        {filtered.map(item => {
          const sel = picked?.id === item.id
          const t   = formatWorkTime(hoursForItem(item.price)).primary
          return (
            <button key={item.id} type="button" onClick={() => pickItem(item)}
              style={{
                padding: '12px 6px',
                borderRadius: 14,
                border: `2px solid ${sel ? ACCENT : '#E2E8F0'}`,
                background: sel ? `${ACCENT}0F` : '#fff',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all 0.15s',
                minHeight: 118,
                boxShadow: sel ? `0 4px 14px ${ACCENT}20` : 'none',
              }}>
              <span style={{ fontSize: 26, lineHeight: 1, marginBottom: 2 }}>{item.emoji}</span>
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: sel ? ACCENT_DARK : '#1A1F5E',
                textAlign: 'center', lineHeight: 1.25,
              }}>
                {item.name}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: sel ? ACCENT : '#94A3B8',
              }}>
                {item.price >= 10_000
                  ? `${(item.price / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만`
                  : item.price.toLocaleString('ko-KR')}원
              </span>
              {wage > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  color: ACCENT_DARK,
                  background: ACCENT_BG,
                  padding: '2px 6px', borderRadius: 4,
                  marginTop: 2,
                }}>
                  ⏱ {t}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ───── Q4: 결과 카드 ─────────────────────────────────── */
function Q4Result({
  wage, amount, picked, onRestart,
}: {
  wage: number; amount: number; picked: Item | null; onRestart: () => void
}) {
  const hours = wage > 0 ? amount / wage : 0
  const time  = formatWorkTime(hours)
  const ramen = wage > 0 ? Math.floor(amount / RAMEN_PRICE) : 0
  const bus   = wage > 0 ? Math.floor(amount / BUS_FARE)    : 0
  const comment = nureungiComment(hours)

  async function handleShare() {
    if (amount <= 0) return
    const targetLabel = picked ? picked.name : `${amount.toLocaleString('ko-KR')}원`
    const text = `'${targetLabel}' 사려면 시급 ${wage.toLocaleString('ko-KR')}원으로 ${time.primary} 일해야 한대 ㄷㄷ\n모두의 계산기에서 확인해봐!`

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: '시급 환산 결과', text, url: window.location.href })
        return
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`)
      alert('결과가 클립보드에 복사됐어요!')
    } catch {
      alert('공유를 지원하지 않는 환경이에요.')
    }
  }

  return (
    <div>
      <QuestionTitle num={4} text={<>이만큼 일해야 살 수 있어!</>}
        sub={`시급 ${wage.toLocaleString('ko-KR')}원 기준`} />

      <div style={{
        background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
        borderRadius: 18,
        padding: '22px 20px',
        color: '#fff',
        boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)',
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '1px',
          color: 'rgba(255,255,255,0.75)',
          margin: '0 0 8px', textTransform: 'uppercase',
        }}>
          노동 시간 환산
        </p>
        <p style={{
          fontSize: 24, fontWeight: 900, margin: '0 0 4px',
          letterSpacing: '-0.5px', lineHeight: 1.2,
        }}>
          {picked ? `${picked.emoji} ${picked.name}` : `${amount.toLocaleString('ko-KR')}원`}
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: '0 0 16px' }}>
          사려면…
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 14,
          padding: '18px 16px',
          marginBottom: 14,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 36, fontWeight: 900, margin: 0,
            letterSpacing: '-1px', lineHeight: 1.1,
            textShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>
            {time.primary}
          </p>
          {time.sub && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '6px 0 0', fontWeight: 600 }}>
              ({time.sub})
            </p>
          )}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          marginBottom: 14,
        }}>
          <div style={{ background: 'rgba(0,0,0,0.18)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', fontWeight: 700 }}>
              🍜 컵라면이면
            </p>
            <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>
              {ramen.toLocaleString('ko-KR')}개
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.18)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', fontWeight: 700 }}>
              🚌 버스비면
            </p>
            <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>
              {bus.toLocaleString('ko-KR')}회
            </p>
          </div>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.22)',
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>🐕</span>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.5, color: '#FEF9C3' }}>
            {comment}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button onClick={onRestart}
          style={{
            flex: 1, height: 52, borderRadius: 14,
            border: `1.5px solid ${ACCENT}`,
            background: '#fff',
            color: ACCENT_DARK,
            fontSize: 14, fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: '-0.2px',
          }}>
          🔄 다시 계산
        </button>
        <button onClick={handleShare}
          style={{
            flex: 1.4, height: 52, borderRadius: 14,
            border: 'none',
            background: ACCENT,
            color: '#fff',
            fontSize: 14, fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: '-0.2px',
            boxShadow: `0 8px 24px ${ACCENT}30`,
          }}>
          📤 결과 공유하기
        </button>
      </div>
    </div>
  )
}
