'use client'

import { createClient } from '@/lib/supabase/client'
import type { BusinessInput, FreelancerInput, BusinessResult, FreelancerResult } from '@/utils/calculate'

export async function saveCalculation(params: {
  mode: 'business' | 'freelancer'
  input: BusinessInput | FreelancerInput
  result: BusinessResult | FreelancerResult
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { mode, input, result } = params
    const isBiz = mode === 'business'
    const bizR = isBiz ? (result as BusinessResult) : null
    const freeR = !isBiz ? (result as FreelancerResult) : null

    const { error } = await supabase.from('calculations').insert({
      user_id: user?.id ?? null,
      mode,
      industry_type: isBiz ? (input as BusinessInput).industryType : null,
      input_data: input,
      result_days: isBiz
        ? (isFinite(bizR!.realisticRunwayDays) ? Math.floor(bizR!.realisticRunwayDays) : null)
        : (isFinite(freeR!.escapeDays) ? Math.floor(freeR!.escapeDays) : null),
      danger_level: result.dangerLevel,
      monthly_savings: freeR?.monthlySavings ? Math.floor(freeR.monthlySavings) : null,
      monthly_net_loss: bizR?.monthlyNetLoss ? Math.floor(bizR.monthlyNetLoss) : null,
      break_even_revenue: bizR?.breakEvenRevenue ? Math.floor(bizR.breakEvenRevenue) : null,
    })

    if (error) console.error('[saveCalculation]', error)
    return { success: !error }
  } catch (err) {
    console.error('[saveCalculation]', err)
    return { success: false }
  }
}
