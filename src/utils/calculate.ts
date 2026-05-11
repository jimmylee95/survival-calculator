// ── 업종별 변동비율 ────────────────────────────────────────
export const VARIABLE_RATE: Record<string, number> = {
  restaurant: 0.38,
  cafe: 0.30,
  bar: 0.40,
  bakery: 0.40,
  delivery: 0.48,
  retail: 0.55,
  service:      0.20,
  fitness:      0.15,
  hospital:     0.25,
  academy:      0.15,
  laundry:      0.25,
  repair: 0.35,
  online_shop:  0.55,
  transport: 0.35,
  freelance:    0.10,
  shipping: 0.35,
  professional: 0.15,
  other:        0.35,
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
    revenue: 16_400_000, avgRunway: 75,
  },
  cafe: {
    label: '카페', emoji: '☕',
    fixedCost: 2_500_000, variableCost: 1_200_000,
    revenue: 12_000_000, avgRunway: 65,
  },
  bar: {
    label: '주점/BAR', emoji: '🍺',
    fixedCost: 3_000_000, variableCost: 1_800_000,
    revenue: 12_000_000, avgRunway: 55,
  },
  bakery: {
    label: '베이커리/디저트', emoji: '🧁',
    fixedCost: 2_800_000, variableCost: 1_600_000,
    revenue: 11_000_000, avgRunway: 60,
  },
  delivery: {
    label: '배달전문', emoji: '🛵',
    fixedCost: 1_800_000, variableCost: 1_500_000,
    revenue: 12_000_000, avgRunway: 55,
  },
  retail: {
    label: '소매/유통', emoji: '🛒',
    fixedCost: 3_000_000, variableCost: 2_500_000,
    revenue: 16_400_000, avgRunway: 80,
  },
  service: {
    label: '서비스업', emoji: '💇',
    fixedCost: 2_000_000, variableCost: 800_000,
    revenue: 10_000_000, avgRunway: 90,
  },
  fitness: {
    label: '헬스/피트니스', emoji: '🏋️',
    fixedCost: 4_500_000, variableCost: 800_000,
    revenue: 10_000_000, avgRunway: 70,
  },
  hospital: {
    label: '병원/약국', emoji: '🏥',
    fixedCost: 5_500_000, variableCost: 2_500_000,
    revenue: 25_000_000, avgRunway: 110,
  },
  academy: {
    label: '학원/교육', emoji: '📚',
    fixedCost: 3_500_000, variableCost: 1_000_000,
    revenue: 12_000_000, avgRunway: 85,
  },
  laundry: {
    label: '세탁/청소', emoji: '🧹',
    fixedCost: 2_000_000, variableCost: 700_000,
    revenue: 7_000_000, avgRunway: 80,
  },
  repair: {
    label: '수리/인테리어', emoji: '🛠️',
    fixedCost: 2_500_000, variableCost: 2_000_000,
    revenue: 11_000_000, avgRunway: 65,
  },
  online_shop: {
    label: '온라인쇼핑몰', emoji: '🛍️',
    fixedCost: 1_500_000, variableCost: 3_000_000,
    revenue: 13_000_000, avgRunway: 60,
  },
  transport: {
    label: '운송업', emoji: '🚛',
    fixedCost: 2_500_000, variableCost: 4_000_000,
    revenue: 12_000_000, avgRunway: 60,
  },
  freelance: {
    label: '프리랜서', emoji: '🎨',
    fixedCost: 1_000_000, variableCost: 500_000,
    revenue: 6_000_000, avgRunway: 90,
  },
  shipping: {
    label: '배송업', emoji: '📦',
    fixedCost: 2_000_000, variableCost: 3_000_000,
    revenue: 10_000_000, avgRunway: 65,
  },
  professional: {
    label: '전문직/사무소', emoji: '⚖️',
    fixedCost: 3_000_000, variableCost: 3_000_000,
    revenue: 15_000_000, avgRunway: 100,
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
  assets:         number  // 현재 자산
  salary:         number  // 월급
  monthlyExpense: number  // 월 생활비
  loanInterest:   number  // 대출이자
  sideIncome:     number  // 부업 수입
  targetAmount:   number  // 목표 금액 (이 금액 모으면 퇴사)
  jobType?:       string  // 선택한 직군 키
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
  monthlySavings:      number  // 월 저축액
  remainingAmount:     number  // 목표까지 남은 금액
  escapeDays:          number  // 탈출까지 남은 일수
  savingsRate:         number  // 저축률 (%)
  totalMonthlyExpense: number  // 월 총지출
  monthlyNetLoss:      number  // (호환용) 역으로 사용
  worstRunwayDays:     number  // (호환용)
  realisticRunwayDays: number  // (호환용) = escapeDays
  independenceIncome:  number  // (호환용)
  dangerLevel:         DangerLevel
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

// ── 1-2. 직장인 시뮬레이션용 계산 (슬라이더) ──────────────
export function simulateFreelancerRunway(
  input: FreelancerInput,
  overrides: { expenseChange?: number; sideIncomeAdd?: number; targetChange?: number }
): { days: number; monthlySavings: number } {
  const adjustedExpense = input.monthlyExpense * (1 + (overrides.expenseChange ?? 0))
  const adjustedSide    = input.sideIncome + (overrides.sideIncomeAdd ?? 0)
  const adjustedTarget  = input.targetAmount + (overrides.targetChange ?? 0)
  const totalExpense    = adjustedExpense + input.loanInterest
  const monthlySavings  = (input.salary - totalExpense) + adjustedSide
  const remaining       = Math.max(adjustedTarget - input.assets, 0)

  if (remaining <= 0) return { days: 0, monthlySavings }
  if (monthlySavings <= 0) return { days: Infinity, monthlySavings }
  return { days: (remaining / monthlySavings) * 30, monthlySavings }
}

// ── 2. 직장인 탈출 계산 ───────────────────────────────────
export function calculateFreelancerRunway(input: FreelancerInput): FreelancerResult {
  const totalMonthlyExpense = input.monthlyExpense + input.loanInterest
  const monthlySavings      = (input.salary - totalMonthlyExpense) + input.sideIncome
  const remainingAmount     = Math.max(input.targetAmount - input.assets, 0)
  const savingsRate         = input.salary > 0
    ? Math.round((monthlySavings / input.salary) * 100)
    : 0

  // 이미 목표 달성
  if (remainingAmount <= 0) {
    return {
      monthlySavings, remainingAmount: 0, escapeDays: 0, savingsRate,
      totalMonthlyExpense, monthlyNetLoss: 0,
      worstRunwayDays: 0, realisticRunwayDays: 0,
      independenceIncome: totalMonthlyExpense,
      dangerLevel: 'safe',
    }
  }

  // 저축 불가능 (적자)
  if (monthlySavings <= 0) {
    return {
      monthlySavings, remainingAmount, escapeDays: Infinity, savingsRate,
      totalMonthlyExpense, monthlyNetLoss: Math.abs(monthlySavings),
      worstRunwayDays: Infinity, realisticRunwayDays: Infinity,
      independenceIncome: totalMonthlyExpense,
      dangerLevel: 'critical',
    }
  }

  // 탈출까지 남은 일수
  const escapeDays = (remainingAmount / monthlySavings) * 30

  return {
    monthlySavings, remainingAmount, escapeDays, savingsRate,
    totalMonthlyExpense, monthlyNetLoss: 0,
    worstRunwayDays: escapeDays, realisticRunwayDays: escapeDays,
    independenceIncome: totalMonthlyExpense,
    dangerLevel: getEscapeLevel(escapeDays),
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

// ── 5. 탈출 위험도 (직장인 — 짧을수록 좋음) ──────────────
export function getEscapeLevel(days: number): DangerLevel {
  if (!isFinite(days)) return 'critical'     // 저축 불가
  if (days <= 0)       return 'safe'         // 이미 달성
  if (days <= 365)     return 'safe'         // 1년 이내
  if (days <= 730)     return 'caution'      // 1~2년
  if (days <= 1825)    return 'warning'      // 2~5년
  return 'critical'                          // 5년 이상
}

// ── 6. 퍼센타일 계산 (정규분포 근사) ─────────────────────
// myValue가 업종/직군 평균 대비 상위 몇 %인지 반환 (0~100)
export function calculatePercentile(myValue: number, avgValue: number): number {
  if (avgValue <= 0) return 50
  const stdDev = avgValue * 0.4
  const z = (myValue - avgValue) / stdDev
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804 * Math.exp(-z * z / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))))
  const percentile = z > 0 ? (1 - p) * 100 : p * 100
  return Math.round(Math.min(Math.max(percentile, 0.1), 99.9) * 10) / 10
}
