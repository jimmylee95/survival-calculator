'use client'

import { useState } from 'react'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import { VARIABLE_RATE } from '@/utils/calculate'
import { SectionCard }  from './SectionCard'
import { NumberInput }  from './NumberInput'

const ACCENT = '#1A1F5E'

// 업종별 평균값 (원)
const INDUSTRY_PRESETS: Partial<Record<keyof typeof VARIABLE_RATE, {
  label:    string
  fixedCost: number
  revenue:  number
}>> = {
  restaurant: { label: '음식점',    fixedCost: 2_200_000, revenue: 5_000_000 },
  cafe:       { label: '카페',      fixedCost: 1_800_000, revenue: 4_000_000 },
  retail:     { label: '소매/유통', fixedCost: 2_000_000, revenue: 4_500_000 },
  service:    { label: '서비스업',  fixedCost: 1_500_000, revenue: 3_500_000 },
  delivery:   { label: '배달전문',  fixedCost: 1_200_000, revenue: 3_000_000 },
  other:      { label: '기타',      fixedCost: 1_800_000, revenue: 4_000_000 },
}

const BALANCE_PRESETS = [
  { label: '100만',  value: 1_000_000 },
  { label: '300만',  value: 3_000_000 },
  { label: '500만',  value: 5_000_000 },
  { label: '1천만',  value: 10_000_000 },
  { label: '3천만',  value: 30_000_000 },
]

export function BusinessForm() {
  const { businessInput, updateBusinessInput } = useCalculatorStore()

  const [autoFillMsg, setAutoFillMsg] = useState<string | null>(null)
  const [skipRevenue, setSkipRevenue] = useState(businessInput.monthlyRevenue === 0)

  function handleIndustryChange(type: keyof typeof VARIABLE_RATE) {
    const preset = INDUSTRY_PRESETS[type]
    if (!preset) {
      updateBusinessInput({ industryType: type })
      return
    }
    updateBusinessInput({
      industryType: type,
      fixedCost:    preset.fixedCost,
      ...(!skipRevenue && { monthlyRevenue: preset.revenue }),
    })
    setAutoFillMsg(`${preset.label} 평균 ${(preset.fixedCost / 10000).toFixed(0)}만원을 입력했어요`)
    setTimeout(() => setAutoFillMsg(null), 3000)
  }

  function handleSkipRevenue() {
    setSkipRevenue(true)
    updateBusinessInput({ monthlyRevenue: 0 })
  }

  function handleEnterRevenue() {
    setSkipRevenue(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 섹션 1 — 잔고 */}
      <SectionCard
        icon="💰"
        title="현재 잔고"
        subtitle="통장에 있는 돈 (대략도 OK)"
      >
        <NumberInput
          value={businessInput.balance}
          onChange={v => updateBusinessInput({ balance: v })}
          placeholder="통장에 있는 돈 (대략도 OK)"
          presets={BALANCE_PRESETS}
          accent={ACCENT}
        />
      </SectionCard>

      {/* 섹션 2 — 고정비 */}
      <SectionCard
        icon="📋"
        title="월 고정비"
        subtitle="임대료 + 인건비 + 기타 고정비 합산"
      >
        {/* 업종 선택 */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>
            업종 선택 (평균값 자동 입력)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(INDUSTRY_PRESETS) as (keyof typeof VARIABLE_RATE)[]).map(key => {
              const isSel = businessInput.industryType === key
              return (
                <button
                  key={key}
                  onClick={() => handleIndustryChange(key)}
                  style={{
                    padding:      '8px 14px',
                    borderRadius: 20,
                    fontSize:     13,
                    fontWeight:   700,
                    border:       `1.5px solid ${isSel ? ACCENT : '#E2E8F0'}`,
                    background:   isSel ? ACCENT : '#fff',
                    color:        isSel ? '#fff' : '#475569',
                    cursor:       'pointer',
                    transition:   'all 0.12s',
                  }}
                >
                  {INDUSTRY_PRESETS[key]?.label}
                </button>
              )
            })}
          </div>

          {autoFillMsg && (
            <p style={{
              fontSize:   12,
              color:      '#48BB78',
              fontWeight: 600,
              marginTop:  8,
              padding:    '6px 10px',
              background: '#F0FFF4',
              borderRadius: 8,
            }}>
              ✓ {autoFillMsg}
            </p>
          )}
        </div>

        <NumberInput
          value={businessInput.fixedCost}
          onChange={v => updateBusinessInput({ fixedCost: v })}
          placeholder="월 고정비 합계"
          accent={ACCENT}
        />
      </SectionCard>

      {/* 섹션 3 — 이자 */}
      <SectionCard
        icon="🏦"
        title="월 이자비용"
        subtitle="대출 이자 없으면 0"
      >
        <NumberInput
          value={businessInput.loanInterest}
          onChange={v => updateBusinessInput({ loanInterest: v })}
          placeholder="0"
          accent={ACCENT}
        />
      </SectionCard>

      {/* 섹션 4 — 매출 (선택) */}
      <SectionCard
        icon="📈"
        title="월 예상 매출"
        subtitle="없으면 건너뛰어도 돼요"
        action={
          skipRevenue ? (
            <button
              onClick={handleEnterRevenue}
              style={{
                fontSize:     12,
                fontWeight:   700,
                color:        ACCENT,
                background:   `${ACCENT}12`,
                border:       'none',
                borderRadius: 20,
                padding:      '5px 12px',
                cursor:       'pointer',
              }}
            >
              입력하기
            </button>
          ) : (
            <button
              onClick={handleSkipRevenue}
              style={{
                fontSize:     12,
                fontWeight:   700,
                color:        '#64748B',
                background:   '#F1F5F9',
                border:       'none',
                borderRadius: 20,
                padding:      '5px 12px',
                cursor:       'pointer',
              }}
            >
              건너뛰기
            </button>
          )
        }
      >
        {skipRevenue ? (
          <div style={{
            padding:      '14px 16px',
            borderRadius: 12,
            background:   '#FFF8F0',
            border:       '1.5px dashed #FED7AA',
          }}>
            <p style={{ fontSize: 13, color: '#F97316', fontWeight: 600, margin: 0 }}>
              최악 시나리오 (매출 0)로 계산할게요
            </p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
              실제 매출이 있다면 &apos;입력하기&apos;를 눌러주세요
            </p>
          </div>
        ) : (
          <NumberInput
            value={businessInput.monthlyRevenue}
            onChange={v => updateBusinessInput({ monthlyRevenue: v })}
            placeholder="월 평균 매출"
            accent={ACCENT}
          />
        )}
      </SectionCard>

    </div>
  )
}
