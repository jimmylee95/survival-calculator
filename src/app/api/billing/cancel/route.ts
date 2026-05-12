import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status:       'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .in('status', ['active', 'past_due'])

  if (error) {
    console.error('[billing/cancel] 해지 실패', error)
    return NextResponse.json({ error: '구독 해지 실패' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
