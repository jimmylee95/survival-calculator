'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Kakao: {
      isInitialized: () => boolean
      init:          (key: string) => void
      Share: {
        sendDefault: (options: KakaoShareOptions) => void
      }
    }
  }
}

interface KakaoShareOptions {
  objectType: 'text' | 'feed' | 'list' | 'location' | 'commerce' | 'calendar'
  text:       string
  link: {
    mobileWebUrl: string
    webUrl:       string
  }
  buttonTitle?: string
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? ''

export function useKakaoShare() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const tryInit = () => {
      if (!window.Kakao) return
      if (window.Kakao.isInitialized()) return
      if (!KAKAO_JS_KEY) return
      window.Kakao.init(KAKAO_JS_KEY)
    }
    // SDK가 async 로딩이므로 약간 지연
    const timer = setTimeout(tryInit, 500)
    return () => clearTimeout(timer)
  }, [])

  function shareViaKakao(text: string, url: string) {
    if (typeof window === 'undefined') return false
    if (!window.Kakao?.Share) return false
    try {
      window.Kakao.Share.sendDefault({
        objectType:  'text',
        text,
        link: { mobileWebUrl: url, webUrl: url },
        buttonTitle: '계산해보기',
      })
      return true
    } catch {
      return false
    }
  }

  const isKakaoReady = () =>
    typeof window !== 'undefined' &&
    !!window.Kakao?.isInitialized?.() &&
    !!KAKAO_JS_KEY

  return { shareViaKakao, isKakaoReady }
}
