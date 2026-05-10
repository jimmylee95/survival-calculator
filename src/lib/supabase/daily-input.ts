'use client'

import { createClient } from '@/lib/supabase/client'

export type DailyInputType = 'revenue' | 'expense' | 'savings'
export type DailyInputMode = 'business' | 'freelancer'

export interface DailyInputRecord {
  id:         string
  mode:       DailyInputMode
  input_type: DailyInputType
  amount:     number
  category:   string | null
  memo:       string | null
  created_at: string
}

const SELECT_COLUMNS = 'id, mode, input_type, amount, category, memo, created_at'

/** 오늘의 매출/지출/저축 1건 저장 */
export async function saveDailyInput(
  userId: string,
  mode: DailyInputMode,
  type: DailyInputType,
  amount: number,
  category?: string | null,
  memo?: string | null,
): Promise<{ success: boolean }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('daily_inputs').insert({
      user_id:    userId,
      mode,
      input_type: type,
      amount:     Math.max(0, Math.floor(amount)),
      category:   category ?? null,
      memo:       memo    ?? null,
    })
    if (error) {
      console.error('[saveDailyInput]', error)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    console.error('[saveDailyInput]', err)
    return { success: false }
  }
}

/** 기간(startDate ~ endDate, ISO 문자열) 내 입력 목록 (최신순) */
export async function getDailyInputs(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<DailyInputRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('daily_inputs')
    .select(SELECT_COLUMNS)
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getDailyInputs]', error)
    return []
  }
  return (data ?? []) as DailyInputRecord[]
}

/** 오늘(로컬 자정 ~ 다음날 자정) 입력 목록 */
export async function getTodayInputs(userId: string): Promise<DailyInputRecord[]> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return getDailyInputs(userId, start.toISOString(), end.toISOString())
}
