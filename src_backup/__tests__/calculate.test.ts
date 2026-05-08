import {
  calculateBusinessRunway,
  calculateFreelancerRunway,
  formatWon,
  formatDays,
  getDangerLevel,
  type BusinessInput,
  type FreelancerInput,
} from '@/utils/calculate'

// ── calculateBusinessRunway ───────────────────────────────
describe('calculateBusinessRunway', () => {
  const base: BusinessInput = {
    balance:        10_000_000, // 1000만원
    monthlyRevenue:  5_000_000, // 500만원
    fixedCost:       3_000_000, // 300만원
    loanInterest:      500_000, // 50만원
    industryType:   'restaurant', // 변동비율 40%
  }

  test('변동비를 매출 × 변동비율로 계산한다', () => {
    const result = calculateBusinessRunway(base)
    expect(result.variableCost).toBeCloseTo(5_000_000 * 0.40)
  })

  test('월 총지출 = 고정비 + 이자 + 변동비', () => {
    const result = calculateBusinessRunway(base)
    const expected = 3_000_000 + 500_000 + 5_000_000 * 0.40
    expect(result.totalMonthlyExpense).toBeCloseTo(expected)
  })

  test('월 순손실 = 총지출 - 매출', () => {
    const result = calculateBusinessRunway(base)
    expect(result.monthlyNetLoss).toBeCloseTo(result.totalMonthlyExpense - base.monthlyRevenue)
  })

  test('최악 런웨이 = 잔고 ÷ (고정비 + 이자) × 30', () => {
    const result = calculateBusinessRunway(base)
    const expected = (10_000_000 / (3_000_000 + 500_000)) * 30
    expect(result.worstRunwayDays).toBeCloseTo(expected)
  })

  test('매출이 총지출보다 크면 현실 런웨이는 Infinity', () => {
    const profitable: BusinessInput = {
      ...base,
      monthlyRevenue: 10_000_000, // 매출이 충분히 큼
    }
    const result = calculateBusinessRunway(profitable)
    expect(result.realisticRunwayDays).toBe(Infinity)
  })

  test('현실 런웨이 = 잔고 ÷ 월순손실 × 30 (적자일 때)', () => {
    const result = calculateBusinessRunway(base)
    // base: 총지출 = 300+50+200 = 550만, 순손실 = 550-500 = 50만
    const expected = (10_000_000 / result.monthlyNetLoss) * 30
    expect(result.realisticRunwayDays).toBeCloseTo(expected)
  })

  test('손익분기 매출 = (고정비 + 이자) ÷ (1 - 변동비율)', () => {
    const result = calculateBusinessRunway(base)
    const expected = (3_000_000 + 500_000) / (1 - 0.40)
    expect(result.breakEvenRevenue).toBeCloseTo(expected)
  })

  test('잔고가 0이면 런웨이도 0', () => {
    const broke: BusinessInput = { ...base, balance: 0 }
    const result = calculateBusinessRunway(broke)
    expect(result.worstRunwayDays).toBe(0)
  })

  test('dangerLevel 필드가 포함된다', () => {
    const result = calculateBusinessRunway(base)
    expect(['critical', 'warning', 'caution', 'safe', 'infinite']).toContain(result.dangerLevel)
  })
})

// ── calculateFreelancerRunway ─────────────────────────────
describe('calculateFreelancerRunway', () => {
  const base: FreelancerInput = {
    assets:          20_000_000, // 2000만원
    monthlyExpense:   2_000_000, // 200만원
    loanInterest:       300_000, // 30만원
    sideIncome:         500_000, // 50만원
  }

  test('월 총지출 = 생활비 + 이자', () => {
    const result = calculateFreelancerRunway(base)
    expect(result.totalMonthlyExpense).toBe(2_000_000 + 300_000)
  })

  test('월 순손실 = 총지출 - 부업수입', () => {
    const result = calculateFreelancerRunway(base)
    expect(result.monthlyNetLoss).toBeCloseTo(result.totalMonthlyExpense - base.sideIncome)
  })

  test('최악 런웨이 = 자산 ÷ 총지출 × 30', () => {
    const result = calculateFreelancerRunway(base)
    const expected = (20_000_000 / (2_000_000 + 300_000)) * 30
    expect(result.worstRunwayDays).toBeCloseTo(expected)
  })

  test('부업수입 >= 총지출이면 현실 런웨이는 Infinity', () => {
    const independent: FreelancerInput = {
      ...base,
      sideIncome: 5_000_000,
    }
    const result = calculateFreelancerRunway(independent)
    expect(result.realisticRunwayDays).toBe(Infinity)
  })

  test('독립 가능 월 수입 = 월 총지출', () => {
    const result = calculateFreelancerRunway(base)
    expect(result.independenceIncome).toBe(result.totalMonthlyExpense)
  })

  test('자산이 0이면 런웨이도 0', () => {
    const broke: FreelancerInput = { ...base, assets: 0 }
    const result = calculateFreelancerRunway(broke)
    expect(result.worstRunwayDays).toBe(0)
  })
})

// ── formatWon ─────────────────────────────────────────────
describe('formatWon', () => {
  test('10000 → "1만원"',      () => expect(formatWon(10_000)).toBe('1만원'))
  test('500000 → "50만원"',    () => expect(formatWon(500_000)).toBe('50만원'))
  test('1000000 → "100만원"',  () => expect(formatWon(1_000_000)).toBe('100만원'))
  test('1500000 → "150만원"',  () => expect(formatWon(1_500_000)).toBe('150만원'))
  test('100000000 → "1억원"',  () => expect(formatWon(100_000_000)).toBe('1억원'))
  test('150000000 → "1.5억원"',() => expect(formatWon(150_000_000)).toBe('1.5억원'))
  test('9999 → "9,999원"',     () => expect(formatWon(9_999)).toBe('9,999원'))
  test('0 → "0원"',            () => expect(formatWon(0)).toBe('0원'))
  test('소수 만원 → 소수점 표시',() => expect(formatWon(15_000)).toBe('1.5만원'))
})

// ── formatDays ────────────────────────────────────────────
describe('formatDays', () => {
  test('Infinity → "∞"',           () => expect(formatDays(Infinity)).toBe('∞'))
  test('0 → "0일"',                () => expect(formatDays(0)).toBe('0일'))
  test('30 → "1개월"',             () => expect(formatDays(30)).toBe('1개월'))
  test('45 → "1개월 15일"',        () => expect(formatDays(45)).toBe('1개월 15일'))
  test('365 → "1년"',              () => expect(formatDays(365)).toBe('1년'))
  test('400 → "1년 35일"',         () => expect(formatDays(400)).toBe('1년 35일'))
  test('29 → "29일"',              () => expect(formatDays(29)).toBe('29일'))
  test('소수점은 floor 처리',       () => expect(formatDays(30.9)).toBe('1개월'))
})

// ── getDangerLevel ────────────────────────────────────────
describe('getDangerLevel', () => {
  test('0일 → critical',      () => expect(getDangerLevel(0)).toBe('critical'))
  test('30일 → critical',     () => expect(getDangerLevel(30)).toBe('critical'))
  test('31일 → warning',      () => expect(getDangerLevel(31)).toBe('warning'))
  test('60일 → warning',      () => expect(getDangerLevel(60)).toBe('warning'))
  test('61일 → caution',      () => expect(getDangerLevel(61)).toBe('caution'))
  test('90일 → caution',      () => expect(getDangerLevel(90)).toBe('caution'))
  test('91일 → safe',         () => expect(getDangerLevel(91)).toBe('safe'))
  test('365일 → safe',        () => expect(getDangerLevel(365)).toBe('safe'))
  test('366일 → infinite',    () => expect(getDangerLevel(366)).toBe('infinite'))
  test('Infinity → infinite', () => expect(getDangerLevel(Infinity)).toBe('infinite'))
})
