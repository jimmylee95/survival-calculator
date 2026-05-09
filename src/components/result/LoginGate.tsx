'use client'

import { useRouter } from 'next/navigation'

const KAKAO_YELLOW = '#FEE500'

export function KakaoLoginButton({
  label = '카카오로 3초만에 시작하기',
  compact = false,
}: {
  label?: string
  compact?: boolean
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push('/login')}
      style={{
        width: '100%', height: compact ? 44 : 52,
        borderRadius: 12, border: 'none',
        background: KAKAO_YELLOW,
        fontSize: compact ? 13 : 14, fontWeight: 800, color: '#191919',
        cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 4px 14px rgba(254,229,0,0.35)',
        letterSpacing: '-0.3px',
      }}>
      <KakaoBubble size={compact ? 16 : 18} />
      {label}
    </button>
  )
}

/** 카카오 브랜드 말풍선 아이콘 (단색) */
function KakaoBubble({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 18 18"
      fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden
    >
      <path
        d="M9 1.5C4.58 1.5 1 4.36 1 7.88c0 2.31 1.55 4.33 3.86 5.46l-.78 2.85c-.07.26.21.47.43.32l3.43-2.27c.35.04.7.06 1.06.06 4.42 0 8-2.86 8-6.42S13.42 1.5 9 1.5z"
        fill="#191919"
      />
    </svg>
  )
}

/**
 * 비로그인 사용자에게 자식 콘텐츠를 블러로 가리고 위에 CTA를 띄운다.
 * 로그인 사용자에게는 자식만 그대로 렌더.
 */
export function LoginGate({
  children, isLoggedIn,
  message, sub,
  blurAmount = 8,
}: {
  children: React.ReactNode
  isLoggedIn: boolean
  message: string
  sub?: string
  blurAmount?: number
}) {
  if (isLoggedIn) return <>{children}</>

  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden
        style={{
          filter: `blur(${blurAmount}px)`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {children}
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: 20,
        borderRadius: 'inherit',
      }}>
        <p style={{
          fontSize: 15, fontWeight: 900, color: '#1A1F5E',
          textAlign: 'center', margin: 0, letterSpacing: '-0.3px',
        }}>
          🔒 {message}
        </p>
        {sub && (
          <p style={{
            fontSize: 12, color: '#64748B',
            textAlign: 'center', margin: 0, lineHeight: 1.5,
          }}>
            {sub}
          </p>
        )}
        <div style={{ width: '100%', maxWidth: 260, marginTop: 4 }}>
          <KakaoLoginButton compact />
        </div>
      </div>
    </div>
  )
}

/** 단독 CTA 카드 (블러 없이 카드 자체로 노출) */
export function LoginPromptCard({
  icon, title, sub,
}: {
  icon: string
  title: string
  sub: string
}) {
  return (
    <div style={{
      borderRadius: 20, padding: '20px 20px',
      background: '#FFFBEA',
      border: '1.5px solid #FDE68A',
      boxShadow: '0 2px 16px rgba(254,229,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <p style={{
          fontSize: 15, fontWeight: 900, color: '#1A1F5E',
          margin: 0, letterSpacing: '-0.3px',
        }}>
          {title}
        </p>
      </div>
      <p style={{
        fontSize: 13, color: '#64748B',
        margin: '0 0 14px', lineHeight: 1.6,
      }}>
        {sub}
      </p>
      <KakaoLoginButton />
    </div>
  )
}
