'use client'

import { createClient } from '@/lib/supabase/client'
import { formatWon } from '@/utils/calculate'

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  emoji: string
  title: string
  message: string
}

type CalcRow = {
  mode: string
  result_days: number | null
  input_data: Record<string, number>
  monthly_savings: number | null
  monthly_net_loss: number | null
}

export async function generateAlerts(userId: string): Promise<Alert[]> {
  const supabase = createClient()
  const alerts: Alert[] = []

  const { data: calcs } = await supabase
    .from('calculations')
    .select('mode, result_days, input_data, monthly_savings, monthly_net_loss')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(2)

  if (!calcs?.length) return alerts

  const cur = calcs[0] as CalcRow
  const prev = calcs[1] as CalcRow | undefined
  const input = (cur.input_data ?? {}) as Record<string, number>

  // ── 자영업자 ─────────────────────────────────────────────
  if (cur.mode === 'business') {

    // 런웨이 위기
    const days = cur.result_days
    if (days !== null) {
      if (days <= 30) {
        alerts.push({ id: 'runway-critical', type: 'critical', emoji: '🚨', title: '긴급 점검 필요', message: '버틸 수 있는 날이 30일 미만이에요. 지금 바로 지출을 점검하세요' })
      } else if (days <= 60) {
        alerts.push({ id: 'runway-warning', type: 'warning', emoji: '⚠️', title: '주의가 필요해요', message: '버틸 수 있는 날이 2개월 이하예요. 비용 절감 방법을 찾아보세요' })
      } else if (days <= 90) {
        alerts.push({ id: 'runway-caution', type: 'info', emoji: '🟡', title: '아직은 괜찮아요', message: '하지만 방심은 금물! 매출 유지에 집중하세요' })
      } else {
        alerts.push({ id: 'runway-safe', type: 'success', emoji: '💪', title: '안정적이에요', message: '이 기세를 유지하면서 성장을 준비하세요' })
      }
    }

    // 런웨이 변화 (이전 계산 대비)
    if (prev && cur.result_days !== null && prev.result_days !== null) {
      const diff = cur.result_days - prev.result_days
      if (diff >= 10) {
        alerts.push({ id: 'runway-up', type: 'success', emoji: '🎉', title: '버틸 수 있는 날이 늘었어요!', message: `지난번보다 ${diff}일 늘었어요. 좋은 흐름이에요` })
      } else if (diff <= -10) {
        alerts.push({ id: 'runway-down', type: 'warning', emoji: '😰', title: '버틸 수 있는 날이 줄었어요', message: `지난번보다 ${Math.abs(diff)}일 줄었어요. 원인을 확인해보세요` })
      }
    }

    // 매출 vs 지출 — monthly_net_loss > 0이면 적자
    const netLoss = cur.monthly_net_loss ?? 0
    const revenue = input.monthlyRevenue ?? 0
    if (netLoss > 0) {
      alerts.push({ id: 'deficit', type: 'critical', emoji: '📉', title: '적자 상태예요', message: `매달 ${formatWon(netLoss)}씩 적자가 나고 있어요. 매출을 늘리거나 지출을 줄여야 해요` })
    } else if (revenue > 0 && netLoss < -(revenue / 3)) {
      // revenue > totalExpense * 1.5 ↔ netLoss < -(revenue / 3)
      alerts.push({ id: 'surplus', type: 'success', emoji: '📈', title: '흑자 운영 중!', message: '매출이 지출의 1.5배 이상이에요. 훌륭해요' })
    }

    // daily_inputs — 3일 연속 매출 없음 (테이블 없으면 무시)
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: daily } = await supabase
        .from('daily_inputs')
        .select('revenue, expense')
        .eq('user_id', userId)
        .gte('date', sevenDaysAgo.toISOString().slice(0, 10))
        .order('date', { ascending: false })
        .limit(3)

      if (daily && daily.length >= 3) {
        const allNoRevenue = daily.every(
          (d: Record<string, number>) => (d.expense ?? 0) > 0 && (d.revenue ?? 0) === 0
        )
        if (allNoRevenue) {
          alerts.push({ id: 'no-revenue-streak', type: 'warning', emoji: '💸', title: '매출 없는 날이 계속되고 있어요', message: '3일 연속 지출만 기록됐어요. 매출 상황을 확인해보세요' })
        }
      }
    } catch { /* daily_inputs 테이블 없으면 무시 */ }

  // ── 직장인 ───────────────────────────────────────────────
  } else {
    const days = cur.result_days

    // 탈출일 기준
    if (days !== null) {
      if (days <= 365) {
        alerts.push({ id: 'escape-soon', type: 'success', emoji: '🔥', title: '1년 안에 탈출 가능!', message: '퇴사 준비를 슬슬 시작해도 좋아요' })
      } else if (days <= 730) {
        alerts.push({ id: 'escape-2years', type: 'info', emoji: '👀', title: '2년 안에 가능해요', message: '부업을 시작하면 훨씬 앞당겨져요' })
      } else if (days >= 1825) {
        alerts.push({ id: 'escape-far', type: 'warning', emoji: '😤', title: '갈 길이 멀어요', message: '저축률을 높이거나 부업을 고려해보세요' })
      }
    }

    // 목표 달성률
    const assets = input.assets ?? 0
    const targetAmount = input.targetAmount ?? 0
    if (targetAmount > 0) {
      const rate = Math.min(Math.round((assets / targetAmount) * 100), 100)
      if (rate >= 75) {
        alerts.push({ id: 'goal-high', type: 'success', emoji: '🎯', title: '거의 다 왔어요!', message: `목표의 ${rate}% 달성! 조금만 더!` })
      } else if (rate >= 50) {
        alerts.push({ id: 'goal-mid', type: 'info', emoji: '🏃', title: '절반을 넘었어요', message: `목표의 ${rate}% 달성. 꾸준히 가면 돼요` })
      } else if (rate >= 25) {
        alerts.push({ id: 'goal-low', type: 'info', emoji: '🌱', title: '성장하고 있어요', message: `목표의 ${rate}% 달성. 시작이 반이에요` })
      }
    }

    // 탈출일 변화
    if (prev && cur.result_days !== null && prev.result_days !== null) {
      const diff = cur.result_days - prev.result_days
      if (diff <= -30) {
        alerts.push({ id: 'escape-shorter', type: 'success', emoji: '🚀', title: '탈출이 앞당겨졌어요!', message: `지난번보다 ${Math.abs(diff)}일 앞당겨졌어요` })
      } else if (diff >= 30) {
        alerts.push({ id: 'escape-longer', type: 'warning', emoji: '😥', title: '탈출이 밀렸어요', message: `${diff}일 늘어났어요. 지출을 점검해보세요` })
      }
    }

    // 저축 상태
    if ((cur.monthly_savings ?? 1) <= 0) {
      alerts.push({ id: 'no-savings', type: 'critical', emoji: '🚨', title: '저축이 안 되고 있어요', message: '수입보다 지출이 많아요. 생활비를 점검하세요' })
    }
  }

  return alerts
}
