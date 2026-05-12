import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ isSubscribed: false, status: null })
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('status, current_period_end, current_period_start, cancelled_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ isSubscribed: false, status: null })
  }

  const now        = new Date()
  const periodEnd  = new Date(sub.current_period_end)
  const isActive   = (sub.status === 'active' || sub.status === 'cancelled') && periodEnd > now

  return NextResponse.json({
    isSubscribed:    isActive,
    status:          sub.status,
    periodEnd:       sub.current_period_end,
    periodStart:     sub.current_period_start,
    cancelledAt:     sub.cancelled_at,
  })
}
