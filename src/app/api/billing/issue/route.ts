import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const TOSS_AUTH = `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}`

export async function POST(req: Request) {
  // 1. 유저 인증
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { authKey, customerKey } = await req.json()
  if (!authKey || !customerKey) {
    return NextResponse.json({ error: 'authKey, customerKey가 필요합니다' }, { status: 400 })
  }

  // 2. 토스 빌링키 발급
  const issueRes = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
    method: 'POST',
    headers: { Authorization: TOSS_AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ authKey, customerKey }),
  })

  if (!issueRes.ok) {
    const err = await issueRes.json()
    console.error('[billing/issue] 빌링키 발급 실패', err)
    return NextResponse.json({ error: err.message ?? '빌링키 발급 실패' }, { status: 400 })
  }

  const { billingKey } = await issueRes.json()

  // 3. 첫 결제 실행
  const orderId = `order_${Date.now()}_${user.id.replace(/-/g, '').slice(0, 8)}`
  const payRes = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
    method: 'POST',
    headers: { Authorization: TOSS_AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerKey,
      amount:        4900,
      orderId,
      orderName:     '해방 플랜 월 구독',
      customerEmail: user.email ?? '',
      customerName:  user.user_metadata?.name ?? '사용자',
    }),
  })

  if (!payRes.ok) {
    const err = await payRes.json()
    console.error('[billing/issue] 첫 결제 실패', err)
    return NextResponse.json({ error: err.message ?? '첫 결제 실패' }, { status: 400 })
  }

  // 4. 구독 저장 (upsert — 재구독 시 덮어씀)
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  const { error: dbErr } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id:              user.id,
      billing_key:          billingKey,
      customer_key:         customerKey,
      status:               'active',
      current_period_start: now.toISOString(),
      current_period_end:   periodEnd.toISOString(),
      cancelled_at:         null,
    }, { onConflict: 'user_id' })

  if (dbErr) {
    console.error('[billing/issue] DB 저장 실패', dbErr)
    return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 })
  }

  return NextResponse.json({ success: true, periodEnd: periodEnd.toISOString() })
}
