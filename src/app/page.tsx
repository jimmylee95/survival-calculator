'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'

type Banner = {
  bg:    string
  title: string
  sub:   string
  href?: string
}

const BANNERS: Banner[] = [
  {
    bg:    'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    title: '누렁이는 오늘도 탈출을 준비한다!',
    sub:   '누렁이와 함께 해방으로 가는 여정',
  },
  {
    bg:    'linear-gradient(135deg, #4A7FD4 0%, #6B9FE4 100%)',
    title: '사장님, 런웨이 몇 일인지 아세요?',
    sub:   '30초면 현실이 보입니다',
    href:  '/self-employed',
  },
  {
    bg:    'linear-gradient(135deg, #D4A020 0%, #F0C850 100%)',
    title: '퇴사까지 D-day, 계산해봤어?',
    sub:   '월급쟁이 해방 시뮬레이션',
    href:  '/freelancer',
  },
]

function BannerCarousel() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [animated, setAnimated] = useState(true)
  const touchStartXRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function scheduleAuto() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrent(c => c + 1)
    }, 3000)
  }

  useEffect(() => {
    scheduleAuto()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  // 루프 처리: 마지막 클론에 도달하면 transition 끄고 0으로 점프
  useEffect(() => {
    if (current === BANNERS.length) {
      const t = setTimeout(() => {
        setAnimated(false)
        setCurrent(0)
      }, 450)
      return () => clearTimeout(t)
    }
    if (!animated) {
      const r = requestAnimationFrame(() => setAnimated(true))
      return () => cancelAnimationFrame(r)
    }
  }, [current, animated])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartXRef.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartXRef.current
    touchStartXRef.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0) {
      setCurrent(c => c + 1)
    } else {
      setCurrent(c => (c === 0 ? c : c - 1))
    }
    scheduleAuto()
  }

  function handleDotClick(i: number) {
    setCurrent(i)
    scheduleAuto()
  }

  const slides = [...BANNERS, BANNERS[0]]
  const realIndex = current === BANNERS.length ? 0 : current

  return (
    <div style={{ width: '100%', userSelect: 'none', margin: 0 }}>
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <div
          style={{
            display:    'flex',
            transition: animated ? 'transform 0.45s ease' : 'none',
            transform:  `translateX(-${current * 100}%)`,
            touchAction: 'pan-y',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { if (b.href) router.push(b.href) }}
              style={{
                flexShrink: 0,
                width:      '100%',
                height:     160,
                background: b.bg,
                border:     'none',
                padding:    '20px 24px',
                display:    'flex',
                alignItems: 'center',
                gap:        14,
                textAlign:  'left',
                cursor:     b.href ? 'pointer' : 'default',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize:    16,
                  fontWeight:  900,
                  color:       '#fff',
                  margin:      '0 0 4px',
                  letterSpacing: '-0.3px',
                  lineHeight:  1.3,
                }}>
                  {b.title}
                </p>
                <p style={{
                  fontSize:   12,
                  fontWeight: 600,
                  color:      'rgba(255,255,255,0.85)',
                  margin:     0,
                  lineHeight: 1.4,
                }}>
                  {b.sub}
                </p>
              </div>
              {/* 우측 이미지 영역 (향후 추가용) */}
              <div style={{ width: 84, height: 84, flexShrink: 0 }} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      {/* 도트 인디케이터 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0 0' }}>
        {BANNERS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleDotClick(i)}
            aria-label={`배너 ${i + 1}`}
            style={{
              width:        i === realIndex ? 18 : 6,
              height:       6,
              borderRadius: 3,
              background:   i === realIndex ? '#1A1F5E' : '#CBD5E1',
              border:       'none',
              padding:      0,
              cursor:       'pointer',
              transition:   'width 0.2s, background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

type CardConfig = {
  mode:     'business' | 'freelancer'
  bg:       string
  bgImage?: string
  icon:     string
  title:    string
  desc:     string
  sub:      string
  shadow:   string
  tagline:  string
}

const CARDS: CardConfig[] = [
  {
    mode:    'business',
    bg:      'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 100%), url(\'/images/nureungi_business_bg.png\')',
    bgImage: '/images/nureungi_business_bg.png',
    icon:    '🔥',
    title:   '사장님 생존 계산기',
    desc:    '통장 잔고가 바닥나기 전에\n몇 일이나 버틸 수 있을까요?',
    sub:     '자영업자 · 소상공인',
    shadow:  'rgba(26,31,94,0.45)',
    tagline: '현실을 직시하는 30초',
  },
  {
    mode:    'freelancer',
    bg:      'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 100%), url(\'/images/nureungi_worker_bg.png\')',
    bgImage: '/images/nureungi_worker_bg.png',
    icon:    '🚀',
    title:   '직장인 퇴사 계산기',
    desc:    '월급만으로 언제 퇴사할 수 있을까?\n퇴사 D-day를 계산해드려요',
    sub:     '직장인 · 프리랜서 준비생',
    shadow:  'rgba(255,107,53,0.45)',
    tagline: '사직서까지 남은 시간',
  },
]

// useSearchParams()는 Suspense 경계 안에서만 사용 가능
function VisitTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('visit_tracked')) return

    const ref = searchParams.get('ref')
    const referrer = document.referrer

    let source: string
    let extra: Record<string, string> = {}

    if (ref === 'kakao') {
      source = 'kakao_share'
    } else if (referrer) {
      try {
        const host = new URL(referrer).hostname
        if (/google\./.test(host))      { source = 'search'; extra = { engine: 'google', referrer } }
        else if (/naver\./.test(host))  { source = 'search'; extra = { engine: 'naver', referrer } }
        else if (/daum\./.test(host))   { source = 'search'; extra = { engine: 'daum', referrer } }
        else if (/bing\./.test(host))   { source = 'search'; extra = { engine: 'bing', referrer } }
        else                            { source = 'external'; extra = { domain: host, referrer } }
      } catch {
        source = 'direct'
      }
    } else {
      source = 'direct'
    }

    sessionStorage.setItem('visit_tracked', '1')

    import('@/lib/supabase/events').then(({ trackEvent }) => {
      trackEvent('page_visit', { source, ...extra }).catch(() => {})
      if (ref === 'kakao') {
        trackEvent('referral_visit', { source: 'kakao' }).catch(() => {})
      }
    }).catch(() => {})
  }, [searchParams])

  return null
}

export default function HomePage() {
  const router = useRouter()
  const { setMode, _hydrated, businessInput, freelancerInput, lastUpdated } =
    useCalculatorStore()

  const [hasSaved, setHasSaved] = useState(false)

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
      overflowX:       'hidden',
      width:           '100%',
    }}>
      <Suspense fallback={null}>
        <VisitTracker />
      </Suspense>

      <div style={{ width: '100%', maxWidth: 430, overflowX: 'hidden' }}>

        {/* 롤링 배너 (히어로 통합) */}
        <BannerCarousel />

        {/* 모드 선택 카드 */}
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CARDS.map(card => (
            <button
              key={card.mode}
              onClick={() => handleSelect(card.mode)}
              style={{
                width:              '100%',
                padding:            '28px 24px',
                minHeight:          card.bgImage ? 200 : undefined,
                borderRadius:       20,
                background:         card.bg,
                backgroundSize:     card.bgImage ? 'auto, cover' : undefined,
                backgroundPosition: card.bgImage ? 'center, right center' : undefined,
                backgroundRepeat:   card.bgImage ? 'no-repeat, no-repeat' : undefined,
                border:             'none',
                cursor:             'pointer',
                textAlign:          'left',
                boxShadow:          `0 10px 36px ${card.shadow}`,
                transform:          'translateY(0)',
                transition:         'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => {
                const t = e.currentTarget
                t.style.transform  = 'translateY(-3px)'
                t.style.boxShadow  = `0 16px 44px ${card.shadow}`
              }}
              onMouseLeave={e => {
                const t = e.currentTarget
                t.style.transform  = 'translateY(0)'
                t.style.boxShadow  = `0 10px 36px ${card.shadow}`
              }}
            >
              {/* 아이콘 + 태그라인 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 36 }}>{card.icon}</span>
                <span style={{
                  fontSize:     11,
                  fontWeight:   700,
                  color:        'rgba(255,255,255,0.75)',
                  background:   'rgba(255,255,255,0.15)',
                  borderRadius: 20,
                  padding:      '5px 14px',
                  letterSpacing: '0.3px',
                }}>
                  {card.tagline}
                </span>
              </div>

              {/* 서브 레이블 */}
              <p style={{
                fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.55)',
                margin: '0 0 6px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                {card.sub}
              </p>

              {/* 제목 */}
              <p style={{
                fontSize:   21,
                fontWeight: 900,
                color:      '#fff',
                margin:     '0 0 8px',
                letterSpacing: '-0.3px',
              }}>
                {card.title}
              </p>

              {/* 설명 */}
              <p style={{
                fontSize:  13,
                color:     'rgba(255,255,255,0.8)',
                margin:    '0 0 18px',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
              }}>
                {card.desc}
              </p>

              {/* CTA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize:     13,
                  fontWeight:   800,
                  color:        '#fff',
                  background:   'rgba(255,255,255,0.2)',
                  borderRadius: 24,
                  padding:      '8px 18px',
                  letterSpacing: '-0.2px',
                }}>
                  지금 확인하기 →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 이어서 계산하기 */}
        {hasSaved && (
          <div style={{ padding: '16px 20px 0' }}>
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
          margin:    '24px 24px 0',
          lineHeight: 1.6,
        }}>
          입력한 정보는 내 기기에만 저장돼요 🔒
        </p>

      </div>
    </div>
  )
}
