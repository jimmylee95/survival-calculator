'use client'

import { usePathname, useRouter } from 'next/navigation'

const ACTIVE   = '#3182F6'
const INACTIVE = '#B0B8C1'

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  // 숨김 조건
  if (pathname?.startsWith('/admin')) return null
  if (pathname === '/calculator')      return null
  if (pathname === '/employee')        return null
  if (pathname === '/self-employed')   return null
  if (pathname === '/parttime')        return null
  if (pathname === '/input')           return null

  const isHomeActive    = pathname === '/' || pathname === '/dashboard'
  const isHistoryActive = pathname === '/history'
  const isMyActive      = pathname === '/mypage'

  return (
    <nav style={{
      position: 'fixed', bottom: 0,
      left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: '#ffffff',
      borderTop: '1px solid #E5E8EB',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 9999,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        height: 60,
        alignItems: 'center',
      }}>
        <NavItem
          icon="🏠" label="홈"
          active={isHomeActive}
          onClick={() => router.push('/')}
        />
        <NavItem
          icon="📊" label="내 기록"
          active={isHistoryActive}
          onClick={() => router.push('/history')}
        />
        <NavItem
          icon="💬" label="이용후기"
          active={pathname === '/community'}
          onClick={() => router.push('/community')}
        />
        <NavItem
          icon="👤" label="마이"
          active={isMyActive}
          onClick={() => router.push('/mypage')}
        />
      </div>
    </nav>
  )
}

function NavItem({
  icon, label, active, onClick,
}: {
  icon:    string
  label:   string
  active:  boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 3, padding: 0, height: '100%',
        color: active ? ACTIVE : INACTIVE,
        transition: 'color 0.15s',
      }}
    >
      <span style={{
        fontSize: 22, lineHeight: 1,
        filter: active ? 'none' : 'grayscale(40%)',
        transition: 'filter 0.15s',
      }}>
        {icon}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700,
        letterSpacing: '-0.2px',
      }}>
        {label}
      </span>
    </button>
  )
}
