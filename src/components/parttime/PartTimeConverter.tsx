'use client'

import { useMemo, useRef, useState } from 'react'

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
  { id: 'starbucks', cat: '먹방', emoji: '☕', name: '스타벅스 아아',  price: 4_500 },
  { id: 'bbq',       cat: '먹방', emoji: '🍗', name: 'BBQ 황올',      price: 20_000 },
  { id: 'pizza',     cat: '먹방', emoji: '🍕', name: '피자 라지',     price: 25_000 },
  { id: 'beer',      cat: '일상', emoji: '🍺', name: '편맥 4캔',       price: 12_000 },
  { id: 'cgv',       cat: '놀기', emoji: '🎬', name: 'CGV 영화',       price: 15_000 },
  { id: 'haircut',   cat: '일상', emoji: '💇', name: '미용실 커트',    price: 20_000 },
  { id: 'airpods',   cat: '테크', emoji: '🎧', name: '에어팟 프로',    price: 359_000 },
  { id: 'iphone',    cat: '테크', emoji: '📱', name: '아이폰 16',      price: 1_550_000 },
  { id: 'dunk',      cat: '패션', emoji: '👟', name: '나이키 덩크',    price: 139_000 },
  { id: 'ps5',       cat: '놀기', emoji: '🎮', name: 'PS5 슬림',       price: 568_000 },
  { id: 'japan',     cat: '여행', emoji: '🛫', name: '일본 왕복',      price: 350_000 },
  { id: 'car',       cat: '큰거', emoji: '🚗', name: '경차 중고',      price: 8_000_000 },
]

type WageQuick = { label: string; rate: number; hint?: string }
const WAGE_QUICKS: WageQuick[] = [
  { label: '9,860원',  rate:  9_860, hint: '2024 최저' },
  { label: '10,030원', rate: 10_030, hint: '2025 최저' },
  { label: '11,000원', rate: 11_000 },
  { label: '12,000원', rate: 12_000 },
  { label: '15,000원', rate: 15_000 },
]

type WageGrade = { grade: 'D' | 'C' | 'B' | 'A' | 'S'; label: string; color: string; bg: string }

function gradeForWage(rate: number): WageGrade {
  if (rate < 10_500) return { grade: 'D', label: '최저시급 전사',    color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
  if (rate < 13_000) return { grade: 'C', label: '알바생 평균',       color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' }
  if (rate < 17_000) return { grade: 'B', label: '시급 좀 받네',      color: '#22C55E', bg: 'rgba(34, 197, 94, 0.14)' }
  if (rate < 25_000) return { grade: 'A', label: '능력자 알바',       color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.14)' }
  return                    { grade: 'S', label: '프리랜서급',         color: '#A855F7', bg: 'rgba(168, 85, 247, 0.16)' }
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

export function PartTimeConverter() {
  const [wage, setWage]         = useState<number>(10_030)
  const [wageInput, setWageInput] = useState<string>('10030')
  const [amount, setAmount]     = useState<number>(0)
  const [amountInput, setAmountInput] = useState<string>('')
  const [category, setCategory] = useState<Category>('전체')
  const [picked, setPicked]     = useState<Item | null>(null)
  const resultRef = useRef<HTMLDivElement | null>(null)

  const grade = useMemo(() => gradeForWage(wage), [wage])

  const filtered = useMemo(
    () => category === '전체' ? ITEMS : ITEMS.filter(i => i.cat === category),
    [category],
  )

  const hours = wage > 0 ? amount / wage : 0
  const time  = formatWorkTime(hours)
  const ramen = wage > 0 ? Math.floor(amount / RAMEN_PRICE) : 0
  const bus   = wage > 0 ? Math.floor(amount / BUS_FARE)    : 0
  const comment = nureungiComment(hours)

  function pickQuick(rate: number) {
    setWage(rate)
    setWageInput(String(rate))
  }

  function pickItem(item: Item) {
    setPicked(item)
    setAmount(item.price)
    setAmountInput(String(item.price))
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  function handleAmountInput(v: string) {
    const cleaned = v.replace(/[^0-9]/g, '')
    setAmountInput(cleaned)
    setAmount(cleaned ? parseInt(cleaned, 10) : 0)
    setPicked(null)
  }

  function handleWageInput(v: string) {
    const cleaned = v.replace(/[^0-9]/g, '')
    setWageInput(cleaned)
    setWage(cleaned ? parseInt(cleaned, 10) : 0)
  }

  async function handleShare() {
    if (amount <= 0) return
    const targetLabel = picked ? picked.name : `${amount.toLocaleString('ko-KR')}원`
    const text = `'${targetLabel}' 사려면 시급 ${wage.toLocaleString('ko-KR')}원으로 ${time.primary} 일해야 한대 ㄷㄷ\n나의 해방 계산기에서 확인해봐!`

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
    <div style={{
      background: '#fff',
      borderRadius: 20,
      padding: '24px 20px',
      boxShadow: '0 10px 36px rgba(34, 197, 94, 0.18)',
      border: '1px solid rgba(34, 197, 94, 0.18)',
      animation: 'fade-in-up 0.35s ease both',
    }}>
      {/* 1. 시급 입력 */}
      <SectionTitle index="1" title="내 시급은 얼마야?" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {WAGE_QUICKS.map(q => {
          const active = wage === q.rate
          return (
            <button
              key={q.rate}
              type="button"
              onClick={() => pickQuick(q.rate)}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: active ? '1.5px solid #22C55E' : '1.5px solid #E2E8F0',
                background: active ? '#ECFDF5' : '#fff',
                color: active ? '#16A34A' : '#475569',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{q.label}</span>
              {q.hint && (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: active ? '#22C55E' : '#F1F5F9',
                  color: active ? '#fff' : '#64748B',
                }}>
                  {q.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            inputMode="numeric"
            value={wageInput}
            onChange={e => handleWageInput(e.target.value)}
            placeholder="직접 입력"
            style={{
              width: '100%',
              padding: '12px 48px 12px 14px',
              borderRadius: 12,
              border: '1.5px solid #E2E8F0',
              fontSize: 16, fontWeight: 700,
              color: '#1A1F5E',
              outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#22C55E' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0' }}
          />
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 13, color: '#94A3B8', fontWeight: 600,
          }}>
            원/시
          </span>
        </div>
        <div style={{
          padding: '8px 12px',
          borderRadius: 12,
          background: grade.bg,
          color: grade.color,
          fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 6,
          minWidth: 96, justifyContent: 'center',
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

      {/* 2. 금액 입력 */}
      <SectionTitle index="2" title="얼마짜리 사고 싶어?" />
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          inputMode="numeric"
          value={amountInput}
          onChange={e => handleAmountInput(e.target.value)}
          placeholder="금액 입력 (예: 50000)"
          style={{
            width: '100%',
            padding: '14px 48px 14px 14px',
            borderRadius: 12,
            border: '1.5px solid #E2E8F0',
            fontSize: 18, fontWeight: 800,
            color: '#1A1F5E',
            outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#22C55E' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0' }}
        />
        <span style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, color: '#94A3B8', fontWeight: 700,
        }}>
          원
        </span>
      </div>
      {amount > 0 && wage > 0 && (
        <p style={{
          fontSize: 13, color: '#16A34A', fontWeight: 700,
          margin: '0 0 18px', paddingLeft: 4,
        }}>
          ⏱ 실시간 환산: <strong>{time.primary}</strong> 일해야 살 수 있어요
        </p>
      )}

      {/* 3. 아이템 그리드 */}
      <SectionTitle index="3" title="인기 아이템으로 골라봐" />
      <div style={{
        display: 'flex', gap: 6,
        overflowX: 'auto', padding: '0 0 8px',
        marginBottom: 10,
        scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map(cat => {
          const active = cat === category
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 999,
                border: 'none',
                background: active ? '#22C55E' : '#F1F5F9',
                color: active ? '#fff' : '#64748B',
                fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginBottom: 24,
      }}>
        {filtered.map(item => {
          const active = picked?.id === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => pickItem(item)}
              style={{
                padding: '14px 8px',
                borderRadius: 14,
                border: active ? '1.5px solid #22C55E' : '1.5px solid #E2E8F0',
                background: active ? '#ECFDF5' : '#fff',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                transition: 'all 0.15s ease',
                minHeight: 102,
              }}
            >
              <span style={{ fontSize: 26, lineHeight: 1 }}>{item.emoji}</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: active ? '#16A34A' : '#1A1F5E',
                textAlign: 'center', lineHeight: 1.25,
              }}>
                {item.name}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: active ? '#22C55E' : '#94A3B8',
              }}>
                {item.price >= 10_000_000
                  ? `${(item.price / 10_000).toLocaleString('ko-KR')}만`
                  : item.price >= 10_000
                    ? `${(item.price / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만`
                    : `${item.price.toLocaleString('ko-KR')}`}
                원
              </span>
            </button>
          )
        })}
      </div>

      {/* 4. 결과 카드 */}
      <div ref={resultRef} style={{
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
        {amount > 0 && wage > 0 ? (
          <>
            <p style={{
              fontSize: 28, fontWeight: 900, margin: '0 0 4px',
              letterSpacing: '-0.5px', lineHeight: 1.15,
            }}>
              {picked ? `${picked.emoji} ${picked.name}` : `${amount.toLocaleString('ko-KR')}원`}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: '0 0 18px' }}>
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
              <div style={{
                background: 'rgba(0,0,0,0.18)', borderRadius: 10, padding: '10px 12px',
              }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', fontWeight: 700 }}>
                  🍜 컵라면이면
                </p>
                <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>
                  {ramen.toLocaleString('ko-KR')}개
                </p>
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.18)', borderRadius: 10, padding: '10px 12px',
              }}>
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
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>🐕</span>
              <p style={{ fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.5, color: '#FEF9C3' }}>
                {comment}
              </p>
            </div>
            <button
              type="button"
              onClick={handleShare}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: '#fff',
                color: '#16A34A',
                fontSize: 15, fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: '-0.2px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              }}
            >
              📤 친구한테 자랑하기
            </button>
          </>
        ) : (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0, padding: '16px 0', textAlign: 'center' }}>
            위에서 금액을 입력하거나 아이템을 골라봐!
          </p>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: 6,
        background: '#22C55E', color: '#fff',
        fontSize: 12, fontWeight: 900,
      }}>{index}</span>
      <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E', margin: 0, letterSpacing: '-0.3px' }}>
        {title}
      </p>
    </div>
  )
}
