'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'

const CARDS = [
  {
    mode:    'business' as const,
    bg:      '#1A1F5E',
    icon:    '🏪',
    title:   '사장님 생존 계산기',
    desc:    '지금 잔고로 몇 일이나 버틸 수 있을까요?',
    sub:     '자영업자 · 소상공인',
    shadow:  'rgba(26,31,94,0.40)',
  },
  {
    mode:    'freelancer' as const,
    bg:      '#FF6B35',
    icon:    '💼',
    title:   '직장인 독립 계산기',
    desc:    '지금 퇴사해도 몇 달을 버틸 수 있을까요?',
    sub:     '직장인 · 프리랜서 준비생',
    shadow:  'rgba(255,107,53,0.40)',
  },
]

export default function HomePage() {
  const router   = useRouter()
  const { setMode, _hydrated, businessInput, freelancerInput, lastUpdated } =
    useCalculatorStore()

  const [hasSaved, setHasSaved] = useState(false)

  // 하이드레이션 완료 후 저장 데이터 여부 확인
  useEffect(() => {
    if (!_hydrated) return
    const hasData =
      businessInput.balance > 0 ||
      businessInput.monthlyRevenue > 0 ||
      freelancerInput.assets > 0 ||
      freelancerInput.monthlyExpense > 0
    setHasSaved(hasData)
  }, [_hydrated, businessInput, freelancerInput])

  function handleSelect(mode: 'business' | 'freelancer') {
    setMode(mode)
    router.push('/calculator')
  }

  function handleResume() {
    router.push('/calculator')
  }

  return (
    <div style={{
      minHeight:       '100dvh',
      background:      '#F8F9FB',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      padding:         '0 0 40px',
    }}>
      <div style={{ width: '100%', maxWidth: 430 }}>

        {/* 상단 헤더 */}
        <div style={{ padding: '56px 24px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚡</div>
          <h1 style={{
            fontSize:   24,
            fontWeight: 900,
            color:      '#1A1F5E',
            margin:     '0 0 8px',
            letterSpacing: '-0.5px',
          }}>
            생존 계산기
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
            내 돈이 얼마나 버텨줄지<br />지금 바로 확인해보세요
          </p>
        </div>

        {/* 모드 선택 카드 */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CARDS.map(card => (
            <button
              key={card.mode}
              onClick={() => handleSelect(card.mode)}
              style={{
                width:         '100%',
                padding:       '28px 24px',
                borderRadius:  20,
                background:    card.bg,
                border:        'none',
                cursor:        'pointer',
                textAlign:     'left',
                boxShadow:     `0 8px 32px ${card.shadow}`,
                transform:     'translateY(0)',
                transition:    'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => {
                const t = e.currentTarget
                t.style.transform  = 'translateY(-3px)'
                t.style.boxShadow  = `0 14px 40px ${card.shadow}`
              }}
              onMouseLeave={e => {
                const t = e.currentTarget
                t.style.transform  = 'translateY(0)'
                t.style.boxShadow  = `0 8px 32px ${card.shadow}`
              }}
            >
              {/* 아이콘 + 서브 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 36 }}>{card.icon}</span>
                <span style={{
                  fontSize:     11,
                  fontWeight:   600,
                  color:        'rgba(255,255,255,0.65)',
                  background:   'rgba(255,255,255,0.12)',
                  borderRadius: 20,
                  padding:      '4px 12px',
                }}>
                  {card.sub}
                </span>
              </div>

              {/* 제목 */}
              <p style={{
                fontSize:   20,
                fontWeight: 900,
                color:      '#fff',
                margin:     '0 0 6px',
                letterSpacing: '-0.3px',
              }}>
                {card.title}
              </p>

              {/* 설명 */}
              <p style={{
                fontSize:  13,
                color:     'rgba(255,255,255,0.75)',
                margin:    '0 0 16px',
                lineHeight: 1.5,
              }}>
                {card.desc}
              </p>

              {/* CTA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize:     13,
                  fontWeight:   700,
                  color:        '#fff',
                  background:   'rgba(255,255,255,0.18)',
                  borderRadius: 20,
                  padding:      '7px 16px',
                }}>
                  계산 시작하기 →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 이어서 계산하기 */}
        {hasSaved && (
          <div style={{ padding: '20px 20px 0' }}>
            <button
              onClick={handleResume}
              style={{
                width:        '100%',
                padding:      '16px',
                borderRadius: 14,
                border:       '1.5px solid #E2E8F0',
                background:   '#fff',
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'space-between',
                boxShadow:    '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔄</span>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1F5E', margin: 0 }}>
                    이어서 계산하기
                  </p>
                  {lastUpdated && (
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
                      마지막 저장: {new Date(lastUpdated).toLocaleDateString('ko-KR', {
                        month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#CBD5E1' }}>›</span>
            </button>
          </div>
        )}

        {/* 하단 안내 */}
        <p style={{
          textAlign: 'center',
          fontSize:  12,
          color:     '#94A3B8',
          margin:    '28px 24px 0',
          lineHeight: 1.6,
        }}>
          입력한 정보는 내 기기에만 저장돼요 🔒
        </p>

      </div>
    </div>
  )
}
