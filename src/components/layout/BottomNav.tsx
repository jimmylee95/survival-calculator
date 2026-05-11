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
        gridTemplateColumns: 'repeat(5, 1fr)',
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
        <CenterButton onClick={() => router.push('/calculator')} />
        <NavItem
          icon="💬" label="커뮤니티"
          active={false}
          onClick={() => alert('준비중입니다')}
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

function CenterButton({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <button
        onClick={onClick}
        aria-label="계산하기"
        style={{
          width: 56, height: 56, borderRadius: '50%',
          marginTop: -20,
          background: 'linear-gradient(135deg, #1A1F5E, #4F46E5)',
          border: '4px solid #fff',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 8px 20px rgba(26, 31, 94, 0.35)',
          transition: 'transform 0.15s ease',
        }}
      >
        <span style={{ fontSize: 24, lineHeight: 1 }}>🧮</span>
      </button>
    </div>
  )
}
