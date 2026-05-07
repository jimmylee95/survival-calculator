'use client'

import { useState, useEffect } from 'react'

export default function KakaoLoginButton() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadKakaoSDK = () => {
      console.log('현재 JS KEY:', process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.slice(0, 8))
      console.log('현재 REST KEY:', process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY?.slice(0, 8))

      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!)
          console.log('Kakao initialized:', window.Kakao.isInitialized())
        }
        return
      }

      const script = document.createElement('script')
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
      script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4'
      script.crossOrigin = 'anonymous'
      script.async = true
      script.onload = () => {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!)
          console.log('Kakao SDK loaded and initialized')
        }
      }
      document.head.appendChild(script)
    }
    loadKakaoSDK()
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    try {
      if (!window.Kakao?.isInitialized()) {
        alert('카카오 SDK 초기화 중입니다. 잠시 후 다시 시도해주세요.')
        setLoading(false)
        return
      }
      // client_id는 Kakao.init() 시 바인딩된 키가 자동으로 사용됨
      window.Kakao.Auth.authorize({
        redirectUri: `${window.location.origin}/api/auth/callback/kakao`,
        scope: 'profile_nickname,profile_image',
      })
    } catch (err) {
      console.error('카카오 로그인 실패:', err)
      setLoading(false)
    }
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
      }}
    >
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
