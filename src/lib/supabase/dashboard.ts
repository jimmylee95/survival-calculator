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

/** 차트용: 최신 limit건의 계산을 오래된→최신 순서로 반환 */
export async function getRunwayHistory(
  userId: string,
  limit: number = 30,
): Promise<CalculationRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calculations')
    .select(SELECT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getRunwayHistory]', error)
    return []
  }
  return ((data ?? []) as CalculationRecord[]).slice().reverse()
}

/** 차트용: 일별 매출/지출/저축 합산 (오래된→최신, 빈 날짜 0으로 채움) */
export interface DailyInputAggregate {
  date:    string  // YYYY-MM-DD (로컬 자정 기준)
  revenue: number
  expense: number
  savings: number
}

export async function getDailyInputHistory(
  userId: string,
  days: number = 14,
): Promise<DailyInputAggregate[]> {
  const supabase = createClient()

  // 시작일 = 오늘 자정에서 (days-1) 일 전
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (days - 1))

  const { data, error } = await supabase
    .from('daily_inputs')
    .select('input_type, amount, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getDailyInputHistory]', error)
    return []
  }

  // 빈 날짜 0으로 채워넣은 맵
  const map = new Map<string, DailyInputAggregate>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const key = formatDateKey(d)
    map.set(key, { date: key, revenue: 0, expense: 0, savings: 0 })
  }

  type Row = { input_type: string; amount: number; created_at: string }
  for (const row of (data ?? []) as Row[]) {
    const key = formatDateKey(new Date(row.created_at))
    const agg = map.get(key)
    if (!agg) continue
    if (row.input_type === 'revenue')      agg.revenue += row.amount
    else if (row.input_type === 'expense') agg.expense += row.amount
    else if (row.input_type === 'savings') agg.savings += row.amount
  }

  return Array.from(map.values())
}

function formatDateKey(d: Date): string {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
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
