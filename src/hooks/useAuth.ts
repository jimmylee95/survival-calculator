'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'

export interface UseAuthOptions {
  /** 비로그인/에러/타임아웃 시 이동 경로 (기본 '/') */
  redirectTo?: string
  /** 안전 타임아웃 (기본 3000ms) */
  timeoutMs?:  number
}

export interface UseAuthReturn {
  user:    User | null
  loading: boolean
}

/**
 * 모든 보호된 페이지가 동일한 패턴으로 인증 처리하도록 하는 공통 훅.
 *
 * - getUser() 성공 + user 있음 → user 세팅, loading=false
 * - getUser() 성공 + user 없음 → router.replace(redirectTo)
 * - getUser() 실패              → router.replace(redirectTo)
 * - 응답이 timeoutMs 초과         → router.replace(redirectTo)
 *
 * 페이지에서:
 *   const { user, loading } = useAuth()
 *   if (loading) return <Loading />
 *   if (!user)   return null
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { redirectTo = '/', timeoutMs = 3000 } = options
  const router = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[useAuth] effect mounted, redirectTo=', redirectTo, 'timeoutMs=', timeoutMs)
    let cancelled = false

    // 안전 타임아웃 — auth 응답이 없으면 강제로 redirectTo 이동
    const timer = setTimeout(() => {
      if (cancelled) return
      console.warn(`[useAuth] timeout (${timeoutMs}ms) → ${redirectTo}`)
      router.replace(redirectTo)
    }, timeoutMs)

    ;(async () => {
      console.log('[useAuth] calling getUser()...')
      const t0 = performance.now()
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const elapsed = (performance.now() - t0).toFixed(0)
        console.log(`[useAuth] getUser() resolved in ${elapsed}ms — user=`, user ? user.id : null)
        if (cancelled) return
        clearTimeout(timer)
        if (!user) {
          console.log('[useAuth] no user → replace', redirectTo)
          router.replace(redirectTo)
          return
        }
        setUser(user)
      } catch (err) {
        console.error('[useAuth] error during getUser', err)
        clearTimeout(timer)
        if (!cancelled) router.replace(redirectTo)
      } finally {
        if (!cancelled) {
          console.log('[useAuth] finally → setLoading(false)')
          setLoading(false)
        }
      }
    })()

    return () => {
      console.log('[useAuth] cleanup')
      cancelled = true
      clearTimeout(timer)
    }
  }, [router, redirectTo, timeoutMs])

  return { user, loading }
}
