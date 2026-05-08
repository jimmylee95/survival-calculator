import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'survival-admin-2026'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== ADMIN_SECRET) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  try {
    const now       = new Date()
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const sevenDaysAgo   = new Date(today.getTime() - 7 * 86400000)
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 86400000)

    // ── 기본 지표 ──
    const { count: totalCalcs } = await supabase.from('calculations').select('*', { count: 'exact', head: true })
    const { count: bizCount }   = await supabase.from('calculations').select('*', { count: 'exact', head: true }).eq('mode', 'business')
    const { count: freeCount }  = await supabase.from('calculations').select('*', { count: 'exact', head: true }).eq('mode', 'freelancer')

    // ── 오늘/어제 ──
    const { count: todayTotal } = await supabase.from('calculations').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
    const { count: yesterTotal } = await supabase.from('calculations').select('*', { count: 'exact', head: true }).gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString())
    const { count: todayBiz }   = await supabase.from('calculations').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()).eq('mode', 'business')
    const { count: todayFree }  = await supabase.from('calculations').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()).eq('mode', 'freelancer')

    // ── DAU ──
    const { data: todayUserData } = await supabase.from('calculations').select('user_id').gte('created_at', today.toISOString()).not('user_id', 'is', null)
    const todayUsers = new Set(todayUserData?.map(r => r.user_id)).size
    const { data: yesterUserData } = await supabase.from('calculations').select('user_id').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()).not('user_id', 'is', null)
    const yesterUsers = new Set(yesterUserData?.map(r => r.user_id)).size

    // ── 전체 유저 ──
    const { data: allUserData } = await supabase.from('calculations').select('user_id').not('user_id', 'is', null)
    const uniqueUsers = new Set(allUserData?.map(r => r.user_id)).size

    // ── 이벤트 (일별 집계) ──
    const { data: eventsRaw } = await supabase.from('events').select('event_type, created_at').gte('created_at', fourteenDaysAgo.toISOString())
    const { data: calcsRaw } = await supabase.from('calculations').select('created_at, mode').gte('created_at', fourteenDaysAgo.toISOString())

    const dailyEvents: Record<string, { calculations: number; kakao_shares: number; referral_visits: number; signups: number }> = {}
    const dailyCalcsByMode: Record<string, { biz: number; free: number }> = {}
    calcsRaw?.forEach(r => {
      const d = new Date(r.created_at).toISOString().slice(0, 10)
      if (!dailyEvents[d]) dailyEvents[d] = { calculations: 0, kakao_shares: 0, referral_visits: 0, signups: 0 }
      dailyEvents[d].calculations++
      if (!dailyCalcsByMode[d]) dailyCalcsByMode[d] = { biz: 0, free: 0 }
      if (r.mode === 'business') dailyCalcsByMode[d].biz++
      else dailyCalcsByMode[d].free++
    })
    eventsRaw?.forEach(r => {
      const d = new Date(r.created_at).toISOString().slice(0, 10)
      if (!dailyEvents[d]) dailyEvents[d] = { calculations: 0, kakao_shares: 0, referral_visits: 0, signups: 0 }
      if (r.event_type === 'kakao_share') dailyEvents[d].kakao_shares++
      if (r.event_type === 'referral_visit') dailyEvents[d].referral_visits++
      if (r.event_type === 'signup') dailyEvents[d].signups++
    })

    // 이벤트 합계
    const { count: totalShares }    = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'kakao_share')
    const { count: totalReferrals } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'referral_visit')
    const { count: totalSignups }   = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'signup')
    const { count: todayShares }    = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'kakao_share').gte('created_at', today.toISOString())
    const { count: todayReferrals } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'referral_visit').gte('created_at', today.toISOString())
    const { count: todaySignups }   = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'signup').gte('created_at', today.toISOString())
    const { count: yesterShares }   = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'kakao_share').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString())
    const { count: yesterReferrals } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'referral_visit').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString())
    const { count: yesterSignups }  = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'signup').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString())

    // ══ 유입 경로 집계 ══
    const { data: visitEvents } = await supabase.from('events').select('event_data').eq('event_type', 'page_visit')
    const trafficSources = { direct: 0, kakao_share: 0, search: 0, external: 0 }
    visitEvents?.forEach(r => {
      const src = (r.event_data as Record<string, string> | null)?.source ?? 'direct'
      if (src in trafficSources) trafficSources[src as keyof typeof trafficSources]++
      else trafficSources.external++
    })

    // ══ 리텐션 데이터 ══
    // 7일 이내 가입한 유저 중 재방문 비율
    const { data: recentSignupEvents } = await supabase.from('events').select('event_data').eq('event_type', 'signup').gte('created_at', sevenDaysAgo.toISOString())
    const recentSignupCount = recentSignupEvents?.length ?? 0

    // 7일 이내 가입 유저의 재계산 여부 체크
    const { data: allCalcUsers } = await supabase.from('calculations').select('user_id, created_at').not('user_id', 'is', null)
    
    // 유저별 방문 일수 계산
    const userVisitDays: Record<string, Set<string>> = {}
    allCalcUsers?.forEach(r => {
      if (!r.user_id) return
      if (!userVisitDays[r.user_id]) userVisitDays[r.user_id] = new Set()
      userVisitDays[r.user_id].add(new Date(r.created_at).toISOString().slice(0, 10))
    })

    const returningUsers = Object.values(userVisitDays).filter(days => days.size >= 2).length
    const oneTimeUsers   = Object.values(userVisitDays).filter(days => days.size === 1).length
    const totalLoggedInCalcs = allCalcUsers?.length ?? 0
    const avgCalcsPerUser = uniqueUsers > 0 ? Math.round((totalLoggedInCalcs / uniqueUsers) * 10) / 10 : 0

    // ══ 최근 기록 ══
    const { data: recentCalcs } = await supabase.from('calculations')
      .select('id, user_id, mode, industry_type, result_days, danger_level, monthly_net_loss, monthly_savings, created_at')
      .order('created_at', { ascending: false }).limit(20)

    return NextResponse.json({
      overview: { totalCalcs: totalCalcs ?? 0, uniqueUsers, bizCount: bizCount ?? 0, freeCount: freeCount ?? 0 },
      today:     { total: todayTotal ?? 0, biz: todayBiz ?? 0, free: todayFree ?? 0, users: todayUsers, shares: todayShares ?? 0, referrals: todayReferrals ?? 0, signups: todaySignups ?? 0 },
      yesterday: { total: yesterTotal ?? 0, users: yesterUsers, shares: yesterShares ?? 0, referrals: yesterReferrals ?? 0, signups: yesterSignups ?? 0 },
      events:    { totalShares: totalShares ?? 0, totalReferrals: totalReferrals ?? 0, totalSignups: totalSignups ?? 0 },
      trafficSources,
      dailyEvents,
      dailyCalcsByMode,
      retention: { returningUsers, oneTimeUsers, recentSignupCount, totalRegistered: uniqueUsers, avgCalcsPerUser },
      conversion: { totalUsers: uniqueUsers, paidUsers: 0, paidRate: 0, totalCalcs: totalCalcs ?? 0 },
      funnel: { visits: totalCalcs ?? 0, calculations: totalCalcs ?? 0, signups: totalSignups ?? 0, purchases: 0 },
      recentCalcs: recentCalcs ?? [],
    })
  } catch (err) {
    console.error('[Admin API]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
