'use client'

import { createClient } from '@/lib/supabase/client'

export type EventType = 'kakao_share' | 'referral_visit' | 'signup' | 'calculation'

export async function trackEvent(eventType: EventType, eventData?: Record<string, unknown>) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('events').insert({
      user_id: user?.id ?? null,
      event_type: eventType,
      event_data: eventData ?? null,
    })
  } catch {
    // 이벤트 추적 실패는 무시 (UX에 영향 없음)
  }
}
