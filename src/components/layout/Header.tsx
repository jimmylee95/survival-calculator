'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { type User } from '@supabase/supabase-js'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [])

  // 어드민 페이지에서는 헤더 숨김
  if (pathname?.startsWith('/admin')) return null

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header style={{
      position:       'sticky',
      top:            0,
      zIndex:         10,
      background:     'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(8px)',
      borderBottom:   '1px solid #F0F0F0',
      padding:        '12px 16px',
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      maxWidth:       430,
      margin:         '0 auto',
      width:          '100%',
    }}>
      <Link href="/" style={{
        fontSize:       18,
        fontWeight:     900,
        color:          '#1A1F5E',
        textDecoration: 'none',
        display:        'flex',
        alignItems:     'center',
        gap:            6,
      }}>
        🫧 누렁이의 해방 계산기
      </Link>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#4A5568' }}>
            {user.user_metadata?.name ?? '사용자'}님
          </span>
          <button
            onClick={handleLogout}
            style={{
              fontSize:   12,
              color:      '#A0AEC0',
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              padding:    '4px 8px',
            }}
          >
            로그아웃
          </button>
        </div>
      ) : (
        <Link href="/login" style={{
          fontSize:       13,
          fontWeight:     700,
          color:          '#000',
          background:     '#FEE500',
          padding:        '8px 14px',
          borderRadius:   20,
          textDecoration: 'none',
        }}>
          카카오 로그인
        </Link>
      )}
    </header>
  )
}
