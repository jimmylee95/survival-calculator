'use client'

import { createClient } from '@/lib/supabase/client'
import type { BusinessInput, FreelancerInput, DangerLevel } from '@/utils/calculate'

export interface CalculationRecord {
  mode:         'business' | 'freelancer'
  input_data:   BusinessInput | FreelancerInput
  result_days:  number | null
  danger_level: DangerLevel
  created_at:   string
}

const SELECT_COLUMNS = 'mode, input_data, result_days, danger_level, created_at'

/** 해당 유저의 가장 최근 계산 기록 1건 (없으면 null) */
export async function getLatestCalculation(
  userId: string,
): Promise<CalculationRecord | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calculations')
    .select(SELECT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[getLatestCalculation]', error)
    return null
  }
  return (data as CalculationRecord | null) ?? null
}

/** 해당 유저의 최근 2번째 계산 기록 (없으면 null) — 변화량 비교용 */
export async function getPreviousCalculation(
  userId: string,
): Promise<CalculationRecord | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calculations')
    .select(SELECT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(1, 1)
    .maybeSingle()

  if (error) {
    console.error('[getPreviousCalculation]', error)
    return null
  }
  return (data as CalculationRecord | null) ?? null
}

/** 해당 유저의 계산 기록 목록 (최신순, 기본 20건) */
export async function getCalculationHistory(
  userId: string,
  limit: number = 20,
): Promise<CalculationRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calculations')
    .select(SELECT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getCalculationHistory]', error)
    return []
  }
  return (data ?? []) as CalculationRecord[]
}

/** 해당 유저의 계산 기록이 1건이라도 있는지 */
export async function hasCalculationHistory(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('calculations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .limit(1)

  if (error) {
    console.error('[hasCalculationHistory]', error)
    return false
  }
  return (count ?? 0) > 0
}
