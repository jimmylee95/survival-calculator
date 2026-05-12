'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SubscriptionState {
  loading:         boolean
  isSubscribed:    boolean
  isPremium:       boolean
  status:          string | null
  subscriptionEnd: Date | null
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    loading: true, isSubscribed: false, isPremium: false,
    status: null, subscriptionEnd: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setState({ loading: false, isSubscribed: false, isPremium: false, status: null, subscriptionEnd: null })
        return
      }

      try {
        const res  = await fetch('/api/billing/status')
        const data = await res.json()
        if (!cancelled) {
          setState({
            loading:         false,
            isSubscribed:    data.isSubscribed ?? false,
            isPremium:       data.isSubscribed ?? false,
            status:          data.status ?? null,
            subscriptionEnd: data.periodEnd ? new Date(data.periodEnd) : null,
          })
        }
      } catch {
        if (!cancelled) setState({ loading: false, isSubscribed: false, isPremium: false, status: null, subscriptionEnd: null })
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return state
}
