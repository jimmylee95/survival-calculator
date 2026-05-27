'use client'

import { createClient } from '@/lib/supabase/client'

export type FeedbackCategory = 'idea' | 'bug' | 'comment' | 'like'

export type Feedback = {
  id:          string
  user_id:     string | null
  nickname:    string
  avatar_url:  string | null
  category:    FeedbackCategory
  content:     string
  paw_count:   number
  created_at:  string
}

const PAGE_SIZE = 20
const SELECT_COLS = 'id, user_id, nickname, avatar_url, category, content, paw_count, created_at'

export async function fetchFeedbacks(opts: {
  category?: FeedbackCategory | 'all'
  cursor?:   string
}): Promise<{ rows: Feedback[]; hasMore: boolean }> {
  const supabase = createClient()
  let q = supabase
    .from('feedbacks')
    .select(SELECT_COLS)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (opts.category && opts.category !== 'all') {
    q = q.eq('category', opts.category)
  }
  if (opts.cursor) {
    q = q.lt('created_at', opts.cursor)
  }

  const { data, error } = await q
  if (error) throw error

  const rows    = (data ?? []) as Feedback[]
  const hasMore = rows.length > PAGE_SIZE
  return { rows: rows.slice(0, PAGE_SIZE), hasMore }
}

export class NotLoggedInError extends Error {
  constructor() { super('login_required'); this.name = 'NotLoggedInError' }
}

export async function createFeedback(input: {
  category: FeedbackCategory
  content:  string
}): Promise<Feedback> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new NotLoggedInError()

  const meta = user.user_metadata ?? {}
  const nickname   = (typeof meta.name === 'string' && meta.name.trim()) || '익명'
  const avatar_url = (typeof meta.avatar_url === 'string' && meta.avatar_url) || null

  const { data, error } = await supabase
    .from('feedbacks')
    .insert({
      user_id:    user.id,
      nickname,
      avatar_url,
      category:   input.category,
      content:    input.content.trim(),
    })
    .select(SELECT_COLS)
    .single()

  if (error) throw error
  return data as Feedback
}

export async function incrementFeedbackPaw(id: string): Promise<number> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new NotLoggedInError()

  const { data, error } = await supabase.rpc('increment_feedback_paw', { p_id: id })
  if (error) throw error
  return (data ?? 0) as number
}
