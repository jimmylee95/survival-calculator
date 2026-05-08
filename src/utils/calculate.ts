// ── 업종별 변동비율 ────────────────────────────────────────
export const VARIABLE_RATE: Record<string, number> = {
  restaurant:  0.40,
  cafe:        0.35,
  retail:      0.50,
  service:     0.20,
  delivery:    0.45,
  other:       0.35,
}

// ── 업종별 평균 벤치마크 데이터 ────────────────────────────
export interface IndustryBenchmark {
  label:        string
  emoji:        string
  fixedCost:    number
  variableCost: number
  revenue:      number
  avgRunway:    number
}

export const INDUSTRY_BENCHMARKS: Record<keyof typeof VARIABLE_RATE, IndustryBenchmark> = {
  restaurant: {
    label: '음식점', emoji: '🍽️',
    fixedCost: 3_500_000, variableCost: 2_000_000,
    revenue: 18_000_000, avgRunway: 75,
  },
  cafe: {
    label: '카페', emoji: '☕',
    fixedCost: 2_500_000, variableCost: 1_200_000,
    revenue: 10_000_000, avgRunway: 65,
  },
  retail: {
    label: '소매/유통', emoji: '🛒',
    fixedCost: 3_000_000, variableCost: 2_500_000,
    revenue: 15_000_000, avgRunway: 80,
  },
  service: {
    label: '서비스업', emoji: '💇',
    fixedCost: 2_000_000, variableCost: 800_000,
    revenue: 8_000_000, avgRunway: 90,
  },
  delivery: {
    label: '배달전문', emoji: '🛵',
    fixedCost: 1_800_000, variableCost: 1_500_000,
    revenue: 12_000_000, avgRunway: 55,
  },
  other: {
    label: '기타', emoji: '🏢',
    fixedCost: 2_500_000, variableCost: 1_500_000,
    revenue: 10_000_000, avgRunway: 70,
  },
}

// ── 입력 타입 ─────────────────────────────────────────────
export interface BusinessInput {
  balance:        number
  monthlyRevenue: number
  fixedCost:      number
  loanInterest:   number
  industryType:   keyof typeof VARIABLE_RATE
}

export interface FreelancerInput {
  assets:         number
  monthlyExpense: number
  loanInterest:   number
  sideIncome:     number
}

// ── 결과 타입 ─────────────────────────────────────────────
export interface BusinessResult {
  variableCost:        number
  totalMonthlyExpense: number
  monthlyNetLoss:      number
  worstRunwayDays:     number
  realisticRunwayDays: number
  breakEvenRevenue:    number
  dangerLevel:         DangerLevel
}

export interface FreelancerResult {
  totalMonthlyExpense:  number
  monthlyNetLoss:       number
  worstRunwayDays:      number
  realisticRunwayDays:  number
  independenceIncome:   number
  dangerLevel:          DangerLevel
}

export type CalcResult = BusinessResult | FreelancerResult
export type DangerLevel = 'critical' | 'warning' | 'caution' | 'safe' | 'infinite'

// ── 1. 자영업자 런웨이 계산 ───────────────────────────────
export function calculateBusinessRunway(input: BusinessInput): BusinessResult {
  const variableRate        = VARIABLE_RATE[input.industryType] ?? 0.35
  const variableCost        = input.monthlyRevenue * variableRate
  const totalMonthlyExpense = input.fixedCost + input.loanInterest + variableCost
  const monthlyNetLoss      = totalMonthlyExpense - input.monthlyRevenue

  const worstRunwayDays = input.balance > 0 && (input.fixedCost + input.loanInterest) > 0
    ? (input.balance / (input.fixedCost + input.loanInterest)) * 30
    : 0

  const realisticRunwayDays = monthlyNetLoss <= 0
    ? Infinity
    : (input.balance / monthlyNetLoss) * 30

  const breakEvenRevenue = (1 - variableRate) > 0
    ? (input.fixedCost + input.loanInterest) / (1 - variableRate)
    : 0

  return {
    variableCost, totalMonthlyExpense, monthlyNetLoss,
    worstRunwayDays, realisticRunwayDays, breakEvenRevenue,
    dangerLevel: getDangerLevel(realisticRunwayDays),
  }
}

// ── 1-1. 시뮬레이션용 계산 (슬라이더) ─────────────────────
export function simulateBusinessRunway(
  input: BusinessInput,
  overrides: { fixedCostChange?: number; revenueChange?: number }
): { days: number; monthlyNet: number } {
  const variableRate    = VARIABLE_RATE[input.industryType] ?? 0.35
  const adjustedFixed   = input.fixedCost * (1 + (overrides.fixedCostChange ?? 0))
  const adjustedRevenue = input.monthlyRevenue * (1 + (overrides.revenueChange ?? 0))
  const variableCost    = adjustedRevenue * variableRate
  const totalExpense    = adjustedFixed + input.loanInterest + variableCost
  const monthlyNet      = totalExpense - adjustedRevenue

  if (monthlyNet <= 0) return { days: Infinity, monthlyNet }
  return { days: (input.balance / monthlyNet) * 30, monthlyNet }
}

// ── 2. 직장인 독립 계산 ───────────────────────────────────
export function calculateFreelancerRunway(input: FreelancerInput): FreelancerResult {
  const totalMonthlyExpense = input.monthlyExpense + input.loanInterest
  const monthlyNetLoss      = totalMonthlyExpense - input.sideIncome

  const worstRunwayDays = input.assets > 0
    ? (input.assets / totalMonthlyExpense) * 30
    : 0

  const realisticRunwayDays = monthlyNetLoss <= 0
    ? Infinity
    : (input.assets / monthlyNetLoss) * 30

  return {
    totalMonthlyExpense, monthlyNetLoss,
    worstRunwayDays, realisticRunwayDays,
    independenceIncome: totalMonthlyExpense,
    dangerLevel: getDangerLevel(realisticRunwayDays),
  }
}

// ── 3. 숫자 포맷 유틸 ─────────────────────────────────────
export function formatWon(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = amount / 100_000_000
    return `${eok % 1 === 0 ? eok : eok.toFixed(1)}억원`
  }
  if (amount >= 10_000) {
    const man = amount / 10_000
    return `${man % 1 === 0 ? man : man.toFixed(0)}만원`
  }
  return `${amount.toLocaleString()}원`
}

export function formatDays(days: number): string {
  if (!isFinite(days)) return '∞'
  const d = Math.floor(days)
  if (d >= 365) {
    const y = Math.floor(d / 365)
    const r = d % 365
    return r === 0 ? `${y}년` : `${y}년 ${r}일`
  }
  if (d >= 30) {
    const m = Math.floor(d / 30)
    const r = d % 30
    return r === 0 ? `${m}개월` : `${m}개월 ${r}일`
  }
  return `${d}일`
}

// ── 4. 런웨이 위험도 ──────────────────────────────────────
export function getDangerLevel(days: number): DangerLevel {
  if (!isFinite(days) || days > 365) return 'infinite'
  if (days > 90)  return 'safe'
  if (days > 60)  return 'caution'
  if (days > 30)  return 'warning'
  return 'critical'
}
