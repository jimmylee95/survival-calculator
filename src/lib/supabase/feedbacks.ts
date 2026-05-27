'use client'

import { createClient } from '@/lib/supabase/client'

export type FeedbackCategory = 'idea' | 'bug' | 'comment' | 'like'

export type Feedback = {
  id:         string
  nickname:   string
  category:   FeedbackCategory
  content:    string
  paw_count:  number
  created_at: string
}

const PAGE_SIZE = 20

export async function fetchFeedbacks(opts: {
  category?: FeedbackCategory | 'all'
  cursor?:   string  // created_at < cursor
}): Promise<{ rows: Feedback[]; hasMore: boolean }> {
  const supabase = createClient()
  let q = supabase
    .from('feedbacks')
    .select('id, nickname, category, content, paw_count, created_at')
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

export async function createFeedback(input: {
  nickname: string
  category: FeedbackCategory
  content:  string
}): Promise<Feedback> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('feedbacks')
    .insert({
      nickname: input.nickname.trim() || '익명의 누렁이',
      category: input.category,
      content:  input.content.trim(),
    })
    .select('id, nickname, category, content, paw_count, created_at')
    .single()

  if (error) throw error
  return data as Feedback
}

export async function incrementFeedbackPaw(id: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('increment_feedback_paw', { p_id: id })
  if (error) throw error
  return (data ?? 0) as number
}
