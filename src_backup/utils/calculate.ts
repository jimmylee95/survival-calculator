// ── 업종별 변동비율 ────────────────────────────────────────
export const VARIABLE_RATE: Record<string, number> = {
  restaurant:  0.40, // 음식점
  cafe:        0.35, // 카페
  retail:      0.50, // 소매/유통
  service:     0.20, // 서비스업
  delivery:    0.45, // 배달전문
  other:       0.35, // 기타
}

// ── 입력 타입 ─────────────────────────────────────────────
export interface BusinessInput {
  balance:       number // 현재 잔고 (원)
  monthlyRevenue: number // 월 매출 (원)
  fixedCost:     number // 월 고정비 (원)
  loanInterest:  number // 월 이자 (원)
  industryType:  keyof typeof VARIABLE_RATE
}

export interface FreelancerInput {
  assets:         number // 총 자산 (원)
  monthlyExpense: number // 월 생활비 (원)
  loanInterest:   number // 월 이자 (원)
  sideIncome:     number // 월 부업 수입 (원)
}

// ── 결과 타입 ─────────────────────────────────────────────
export interface BusinessResult {
  variableCost:       number  // 변동비 (원)
  totalMonthlyExpense: number // 월 총지출 (원)
  monthlyNetLoss:     number  // 월 순손실 (원, 양수면 적자)
  worstRunwayDays:    number  // 최악 런웨이 (일)
  realisticRunwayDays: number // 현실 런웨이 (일)
  breakEvenRevenue:   number  // 손익분기 매출 (원)
  dangerLevel:        DangerLevel
}

export interface FreelancerResult {
  totalMonthlyExpense:  number // 월 총지출 (원)
  monthlyNetLoss:       number // 월 순손실 (원)
  worstRunwayDays:      number // 최악 런웨이 (일)
  realisticRunwayDays:  number // 현실 런웨이 (일)
  independenceIncome:   number // 독립 가능 월 수입 (원)
  dangerLevel:          DangerLevel
}

export type CalcResult = BusinessResult | FreelancerResult
export type DangerLevel = 'critical' | 'warning' | 'caution' | 'safe' | 'infinite'

// ── 1. 자영업자 런웨이 계산 ───────────────────────────────
export function calculateBusinessRunway(input: BusinessInput): BusinessResult {
  const variableRate   = VARIABLE_RATE[input.industryType] ?? 0.35
  const variableCost   = input.monthlyRevenue * variableRate
  const totalMonthlyExpense = input.fixedCost + input.loanInterest + variableCost
  const monthlyNetLoss = totalMonthlyExpense - input.monthlyRevenue

  // 최악: 매출 0, 고정비+이자만 소진
  const worstRunwayDays = input.balance > 0
    ? (input.balance / (input.fixedCost + input.loanInterest)) * 30
    : 0

  // 현실: 실제 순손실 기준
  const realisticRunwayDays = monthlyNetLoss <= 0
    ? Infinity
    : (input.balance / monthlyNetLoss) * 30

  // 손익분기 매출 = (고정비 + 이자) / (1 - 변동비율)
  const breakEvenRevenue = (input.fixedCost + input.loanInterest) / (1 - variableRate)

  return {
    variableCost,
    totalMonthlyExpense,
    monthlyNetLoss,
    worstRunwayDays,
    realisticRunwayDays,
    breakEvenRevenue,
    dangerLevel: getDangerLevel(realisticRunwayDays),
  }
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

  const independenceIncome = totalMonthlyExpense

  return {
    totalMonthlyExpense,
    monthlyNetLoss,
    worstRunwayDays,
    realisticRunwayDays,
    independenceIncome,
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
    return `${man % 1 === 0 ? man : man.toFixed(1)}만원`
  }
  return `${amount.toLocaleString()}원`
}

export function formatDays(days: number): string {
  if (!isFinite(days)) return '∞'
  const d = Math.floor(days)
  if (d >= 365) {
    const years = Math.floor(d / 365)
    const rem   = d % 365
    return rem === 0 ? `${years}년` : `${years}년 ${rem}일`
  }
  if (d >= 30) {
    const months = Math.floor(d / 30)
    const rem    = d % 30
    return rem === 0 ? `${months}개월` : `${months}개월 ${rem}일`
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
