'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function KakaoLoginButton({
  redirectTo = '/',
}: {
  redirectTo?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`,
      },
    })
    setLoading(false)
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      style={{
        width:          '100%',
        height:         52,
        background:     '#FEE500',
        border:         'none',
        borderRadius:   12,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            10,
        cursor:         loading ? 'not-allowed' : 'pointer',
        fontSize:       16,
        fontWeight:     700,
        color:          '#000000',
        opacity:        loading ? 0.7 : 1,
        transition:     'opacity 0.2s',
      }}
    >
      {/* 카카오 로고 SVG */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 2C5.582 2 2 4.896 2 8.456c0 2.24 1.402 4.207 3.512 5.348l-.896 3.34a.3.3 0 00.461.324l3.897-2.573c.33.047.668.072 1.026.072 4.418 0 8-2.896 8-6.511C18 4.896 14.418 2 10 2z"
          fill="#000000"
        />
      </svg>
      {loading ? '로그인 중...' : '카카오로 시작하기'}
    </button>
  )
}
