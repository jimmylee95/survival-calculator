'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import { INDUSTRY_USERS } from '@/utils/calculate'
import { CountUpNumber } from '@/components/result/CountUpNumber'
import { createClient } from '@/lib/supabase/client'

const PARTTIME_USERS = 1_847

// 결과 페이지와 동일한 INDUSTRY_USERS 데이터 소스에서 대표값 사용
const CARD_COUNTERS: Record<'business' | 'freelancer', number> = {
  business:   INDUSTRY_USERS.restaurant ?? 3247,
  freelancer: INDUSTRY_USERS.marketing  ?? 2103,
}

type Banner = {
  bg:     string
  title:  string
  sub:    string
  href?:  string
  image?: string
}

const BANNERS: Banner[] = [
  {
    bg:    "url('/images/banner_01.png')",
    image: '/images/banner_01.png',
    title: '누렁이는 오늘도 탈출을 준비한다!',
    sub:   '누렁이와 함께 해방으로 가는 여정',
  },
  {
    bg:    "url('/images/banner_02.png')",
    image: '/images/banner_02.png',
    title: '사장님, 며칠이나 버틸 수 있는지 아세요?',
    sub:   '30초면 현실이 보입니다',
    href:  '/self-employed',
  },
  {
    bg:    "url('/images/banner_03.png')",
    image: '/images/banner_03.png',
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
    }, 5000)
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
                maxWidth:   '100%',
                padding:    0,
                border:     'none',
                background: b.image ? 'transparent' : b.bg,
                cursor:     b.href ? 'pointer' : 'default',
                overflow:   'hidden',
                display:    'block',
              }}
            >
              {b.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={b.image}
                  alt={b.title}
                  style={{
                    display:   'block',
                    width:     '100%',
                    height:    'auto',
                    maxWidth:  '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', minHeight: 160,
                  padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  textAlign: 'left',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 16, fontWeight: 900, color: '#fff',
                      margin: '0 0 4px', letterSpacing: '-0.3px', lineHeight: 1.3,
                    }}>
                      {b.title}
                    </p>
                    <p style={{
                      fontSize: 12, fontWeight: 600,
                      color: 'rgba(255,255,255,0.85)',
                      margin: 0, lineHeight: 1.4,
                    }}>
                      {b.sub}
                    </p>
                  </div>
                  <div style={{ width: 84, height: 84, flexShrink: 0 }} aria-hidden />
                </div>
              )}
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
  mode:         'business' | 'freelancer'
  bg:           string
  bgImage?:     string
  imageSrc?:    string   // <Image> 컴포넌트 사용 시 src (있으면 CSS bg 대신 Image 렌더)
  imageAlt?:    string
  title:        string
  titleAccent?: string   // 강조 색상으로 별도 라인 렌더 (mode 컬러 사용)
  desc:         string
  sub:          string
  shadow:       string
}

const CARDS: CardConfig[] = [
  {
    mode:        'freelancer',
    bg:          'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%), linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 100%), url(\'/images/nureungi_worker_bg.png\')',
    bgImage:     '/images/nureungi_worker_bg.png',
    title:       '가슴속 사직서 집어던지는',
    titleAccent: '퇴사 날짜 계산기',
    desc:        '사직서를 던질 수 있는\n퇴사 날짜를 확인해보자!',
    sub:         '직장인 · 공무원 · 프리랜서',
    shadow:      'rgba(74,125,255,0.45)',
  },
  {
    mode:        'business',
    bg:          'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)',
    imageSrc:    '/images/nureungi-self-employed.png',
    imageAlt:    '누렁이 치킨 사장님',
    title:       '언젠가 돈복사 시켜줄',
    titleAccent: '매장 수명 계산기',
    desc:        "며칠이나 더 버틸까?\n'존버' 유효기간을 확인해보자!",
    sub:         '자영업자 · 소상공인',
    shadow:      'rgba(255,107,53,0.45)',
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    if (!_hydrated) return
    const hasData =
      businessInput.balance > 0 ||
      businessInput.monthlyRevenue > 0 ||
      freelancerInput.assets > 0 ||
      freelancerInput.monthlyExpense > 0
    setHasSaved(hasData)
  }, [_hydrated, businessInput, freelancerInput])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user))
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (_, session) => setIsLoggedIn(!!session?.user),
    )
    return () => subscription.unsubscribe()
  }, [])

  function handleSelect(mode: 'business' | 'freelancer') {
    setMode(mode)
    router.push(mode === 'business' ? '/self-employed' : '/employee')
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
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {CARDS.map(card => (
            <div key={card.mode}>
            <button
              onClick={() => handleSelect(card.mode)}
              style={{
                width:              '100%',
                padding:            '28px 24px',
                minHeight:          (card.bgImage || card.imageSrc) ? 220 : undefined,
                borderRadius:       20,
                background:         card.bg,
                backgroundSize:     card.bgImage ? 'auto, auto, cover' : undefined,
                backgroundPosition: card.bgImage ? 'center, center, right center' : undefined,
                backgroundRepeat:   card.bgImage ? 'no-repeat, no-repeat, no-repeat' : undefined,
                border:             'none',
                cursor:             'pointer',
                textAlign:          'left',
                boxShadow:          `0 10px 36px ${card.shadow}`,
                transform:          'translateY(0)',
                transition:         'transform 0.15s ease, box-shadow 0.15s ease',
                display:            'flex',
                flexDirection:      'column',
                justifyContent:     'space-between',
                gap:                12,
                position:           card.imageSrc ? 'relative' : undefined,
                overflow:           card.imageSrc ? 'hidden' : undefined,
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
              {/* Next.js Image + 그라데이션 오버레이 (imageSrc 카드 한정) */}
              {card.imageSrc && card.imageAlt && (
                <>
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt}
                      fill
                      sizes="(max-width: 430px) 100vw, 430px"
                      style={{ objectFit: 'cover', objectPosition: 'right center' }}
                      priority={false}
                    />
                  </div>
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%), '
                      + 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                  }} />
                </>
              )}

              {/* 텍스트 영역 (상단 좌측) */}
              <div style={card.imageSrc ? { position: 'relative', zIndex: 1 } : undefined}>
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
                  color:      '#FFFFFF',
                  margin:     '0 0 12px',
                  letterSpacing: '-0.3px',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.35,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
                  {card.title}
                  {card.titleAccent && (
                    <>
                      {'\n'}
                      <span style={{
                        color: card.mode === 'business' ? '#FF6B35' : '#4A7DFF',
                      }}>
                        {card.titleAccent}
                      </span>
                    </>
                  )}
                </p>

                {/* 설명 */}
                <p style={{
                  fontSize:  13,
                  color:     '#FFFFFF',
                  margin:    0,
                  lineHeight: 1.75,
                  whiteSpace: 'pre-line',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
                  {card.desc}
                </p>
              </div>

              {/* CTA — 우측 하단 */}
              <div style={{
                display: 'flex',
                alignSelf: 'flex-end',
                alignItems: 'center', gap: 6,
                marginTop: 20,
                position: card.imageSrc ? 'relative' : undefined,
                zIndex:   card.imageSrc ? 1 : undefined,
              }}>
                <span style={{
                  fontSize:      14,
                  fontWeight:    700,
                  color:         '#FFFFFF',
                  background:    card.mode === 'business' ? '#FF6B35' : '#4A7DFF',
                  borderRadius:  25,
                  padding:       '10px 24px',
                  letterSpacing: '-0.2px',
                  boxShadow:     card.mode === 'business'
                    ? '0 2px 8px rgba(255, 107, 53, 0.4)'
                    : '0 2px 8px rgba(74, 125, 255, 0.4)',
                }}>
                  지금 확인하기 →
                </span>
              </div>
            </button>

            {/* 카드 하단 참여 인원 카운터 (필 형태) */}
            <div style={{
              marginTop: 12,
              display: 'flex', justifyContent: 'center',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 20,
                padding: '8px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                color: '#333',
                fontSize: 13, fontWeight: 500,
              }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span>이미</span>
                <span style={{
                  fontSize: 16, fontWeight: 800,
                  color: card.mode === 'business' ? '#FF6B00' : '#4A7DFF',
                }}>
                  <CountUpNumber target={CARD_COUNTERS[card.mode]} duration={1500} />명
                </span>
                <span>
                  의 {card.mode === 'business' ? '사장님' : '직장인'}이 참여 했어요
                </span>
              </div>
            </div>
            </div>
          ))}

          {/* 알바생 시급 환산기 카드 */}
          <div>
            <button
              onClick={() => router.push('/parttime')}
              style={{
                width:           '100%',
                padding:         '28px 24px',
                minHeight:       220,
                borderRadius:    20,
                background:      'linear-gradient(135deg, #22C55E 0%, #16A34A 60%, #15803D 100%)',
                border:          'none',
                cursor:          'pointer',
                textAlign:       'left',
                boxShadow:       '0 10px 36px rgba(34, 197, 94, 0.45)',
                transform:       'translateY(0)',
                transition:      'transform 0.15s ease, box-shadow 0.15s ease',
                display:         'flex',
                flexDirection:   'column',
                justifyContent:  'space-between',
                gap:             12,
                position:        'relative',
                overflow:        'hidden',
              }}
              onMouseEnter={e => {
                const t = e.currentTarget
                t.style.transform = 'translateY(-3px)'
                t.style.boxShadow = '0 16px 44px rgba(34, 197, 94, 0.55)'
              }}
              onMouseLeave={e => {
                const t = e.currentTarget
                t.style.transform = 'translateY(0)'
                t.style.boxShadow = '0 10px 36px rgba(34, 197, 94, 0.45)'
              }}
            >
              {/* 누렁이 배경 이미지 (자영업자/직장인 카드와 동일한 우측 정렬 cover) */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <Image
                  src="/images/nureungi-alba.png"
                  alt="프로 알바생 누렁이"
                  fill
                  sizes="(max-width: 430px) 100vw, 430px"
                  style={{ objectFit: 'cover', objectPosition: 'right center' }}
                  priority={false}
                />
              </div>
              {/* 좌우 그라데이션 오버레이 (텍스트 가독성) */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%), '
                  + 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
              }} />

              {/* 텍스트 영역 */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{
                  fontSize:       11, fontWeight: 600,
                  color:          'rgba(255,255,255,0.65)',
                  margin:         '0 0 6px',
                  textTransform:  'uppercase',
                  letterSpacing:  '1px',
                }}>
                  알바생 · 대학생 · 투잡러
                </p>
                <p style={{
                  fontSize:       21, fontWeight: 900,
                  color:          '#FFFFFF',
                  margin:         '0 0 12px',
                  letterSpacing:  '-0.3px',
                  whiteSpace:     'pre-line',
                  lineHeight:     1.35,
                  textShadow:     '0 1px 2px rgba(0,0,0,0.35)',
                }}>
                  {'알바비로 득템을 위한\n알바 시간 계산기'}
                </p>
                <p style={{
                  fontSize:    13,
                  color:       '#FFFFFF',
                  margin:      0,
                  lineHeight:  1.75,
                  whiteSpace:  'pre-line',
                  textShadow:  '0 1px 2px rgba(0,0,0,0.35)',
                }}>
                  {'시급으로 환산하면 얼마짜리?\n진짜 가성비를 따져보자!'}
                </p>
              </div>

              <div style={{
                display:    'flex',
                alignSelf:  'flex-end',
                alignItems: 'center', gap: 6,
                marginTop:  20,
                position:   'relative',
                zIndex:     1,
              }}>
                <span style={{
                  fontSize:      14,
                  fontWeight:    700,
                  color:         '#FFFFFF',
                  background:    '#22C55E',
                  borderRadius:  25,
                  padding:       '10px 24px',
                  letterSpacing: '-0.2px',
                  boxShadow:     '0 2px 8px rgba(34, 197, 94, 0.4)',
                }}>
                  지금 확인하기 →
                </span>
              </div>
            </button>

            {/* 소셜프루프 */}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 20,
                padding: '8px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                color: '#333',
                fontSize: 13, fontWeight: 500,
              }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span>이미</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#16A34A' }}>
                  <CountUpNumber target={PARTTIME_USERS} duration={1500} />명
                </span>
                <span>의 알바생이 참여 했어요</span>
              </div>
            </div>

          </div>
        </div>

        {/* 이어서 계산하기 (로그인 + 계산 이력 있는 경우에만) */}
        {isLoggedIn && hasSaved && (
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
