import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'survival-admin-2026'
const PAGE_SIZE    = 50

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function checkAuth(request: Request): boolean {
  const { searchParams } = new URL(request.url)
  return searchParams.get('secret') === ADMIN_SECRET
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')   // 'all' | 'idea' | 'bug' | 'comment' | 'like'
  const q        = (searchParams.get('q') ?? '').trim()
  const cursor   = searchParams.get('cursor')     // ISO timestamp

  const sb = admin()

  // ── 리스트 ────────────────────────────────────────────
  let query = sb.from('feedbacks')
    .select('id, user_id, nickname, avatar_url, category, content, paw_count, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }
  if (q) {
    // 내용 또는 닉네임 부분일치
    const safe = q.replace(/[%,]/g, '')
    query = query.or(`content.ilike.%${safe}%,nickname.ilike.%${safe}%`)
  }
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: listData, error: listErr } = await query
  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 })
  }
  const rows    = listData ?? []
  const hasMore = rows.length > PAGE_SIZE
  const items   = rows.slice(0, PAGE_SIZE)

  // ── 통계 (커서 없을 때만, 첫 페이지 응답에 포함) ───────────
  let stats: {
    total:        number
    todayCount:   number
    byCategory:   Record<'idea' | 'bug' | 'comment' | 'like', number>
    last7Days:    { date: string; count: number }[]
  } | null = null

  if (!cursor) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const sevenAgo = new Date(today); sevenAgo.setDate(sevenAgo.getDate() - 6)

    const [totalRes, todayRes, byCatRes, recentRes] = await Promise.all([
      sb.from('feedbacks').select('id', { count: 'exact', head: true }),
      sb.from('feedbacks').select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      sb.from('feedbacks').select('category'),
      sb.from('feedbacks').select('created_at').gte('created_at', sevenAgo.toISOString()),
    ])

    const byCategory: Record<'idea' | 'bug' | 'comment' | 'like', number> = {
      idea: 0, bug: 0, comment: 0, like: 0,
    }
    for (const r of byCatRes.data ?? []) {
      const c = (r as { category: 'idea' | 'bug' | 'comment' | 'like' }).category
      if (byCategory[c] !== undefined) byCategory[c] += 1
    }

    // 최근 7일 일별 count
    const buckets: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(d.getDate() - (6 - i))
      buckets[d.toISOString().slice(0, 10)] = 0
    }
    for (const r of recentRes.data ?? []) {
      const key = new Date((r as { created_at: string }).created_at).toISOString().slice(0, 10)
      if (buckets[key] !== undefined) buckets[key] += 1
    }
    const last7Days = Object.entries(buckets).map(([date, count]) => ({ date, count }))

    stats = {
      total:      totalRes.count ?? 0,
      todayCount: todayRes.count ?? 0,
      byCategory,
      last7Days,
    }
  }

  return NextResponse.json({ items, hasMore, stats })
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await admin().from('feedbacks').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
