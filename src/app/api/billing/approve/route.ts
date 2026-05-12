import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 매월 자동결제 갱신용 — 서버(크론)에서 ADMIN_SECRET 포함해 호출
const ADMIN_SECRET  = process.env.ADMIN_SECRET ?? 'survival-admin-2026'
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const TOSS_AUTH = `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}`

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== ADMIN_SECRET) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const { userId } = await req.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId가 필요합니다' }, { status: 400 })
  }

  // 구독 정보 조회
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (subErr || !sub) {
    return NextResponse.json({ error: '활성 구독을 찾을 수 없습니다' }, { status: 404 })
  }

  // 결제 승인
  const orderId = `renew_${Date.now()}_${userId.replace(/-/g, '').slice(0, 8)}`
  const payRes = await fetch(`https://api.tosspayments.com/v1/billing/${sub.billing_key}`, {
    method: 'POST',
    headers: { Authorization: TOSS_AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerKey: sub.customer_key,
      amount:      9900,
      orderId,
      orderName:   '해방 플랜 월 구독',
    }),
  })

  if (!payRes.ok) {
    const err = await payRes.json()
    console.error('[billing/approve] 결제 실패', err)
    // 결제 실패 시 past_due로 변경
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('user_id', userId)
    return NextResponse.json({ error: err.message ?? '결제 실패' }, { status: 400 })
  }

  // 구독 기간 갱신
  const newEnd = new Date(sub.current_period_end)
  newEnd.setMonth(newEnd.getMonth() + 1)

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status:               'active',
      current_period_start: sub.current_period_end,
      current_period_end:   newEnd.toISOString(),
    })
    .eq('user_id', userId)

  return NextResponse.json({ success: true, newPeriodEnd: newEnd.toISOString() })
}
