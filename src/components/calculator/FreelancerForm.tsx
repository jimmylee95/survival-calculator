'use client'

import { useState } from 'react'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import { SectionCard } from './SectionCard'
import { NumberInput } from './NumberInput'

const ACCENT = '#1A1F5E'

// 직군별 월 평균 생활비 (원)
const JOB_PRESETS: Record<string, { label: string; expense: number }> = {
  office:    { label: '사무직',       expense: 2_500_000 },
  it:        { label: 'IT/개발',      expense: 2_800_000 },
  sales:     { label: '영업',         expense: 2_300_000 },
  creator:   { label: '크리에이터',   expense: 2_000_000 },
  other:     { label: '기타',         expense: 2_300_000 },
}

const ASSET_PRESETS = [
  { label: '500만',  value: 5_000_000  },
  { label: '1천만',  value: 10_000_000 },
  { label: '3천만',  value: 30_000_000 },
  { label: '5천만',  value: 50_000_000 },
]

export function FreelancerForm() {
  const { freelancerInput, updateFreelancerInput } = useCalculatorStore()

  const [selectedJob,  setSelectedJob]  = useState<string | null>(null)
  const [autoFillMsg,  setAutoFillMsg]  = useState<string | null>(null)
  const [skipSideIncome, setSkipSideIncome] = useState(freelancerInput.sideIncome === 0)

  function handleJobChange(key: string) {
    const preset = JOB_PRESETS[key]
    setSelectedJob(key)
    updateFreelancerInput({ monthlyExpense: preset.expense })
    setAutoFillMsg(`${preset.label} 평균 ${(preset.expense / 10000).toFixed(0)}만원을 입력했어요`)
    setTimeout(() => setAutoFillMsg(null), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 섹션 1 — 자산 */}
      <SectionCard
        icon="💰"
        title="현재 자산"
        subtitle="예금 + 적금 + 주식 합산 (대략도 OK)"
      >
        <NumberInput
          value={freelancerInput.assets}
          onChange={v => updateFreelancerInput({ assets: v })}
          placeholder="현재 총 자산"
          presets={ASSET_PRESETS}
          accent={ACCENT}
        />
      </SectionCard>

      {/* 섹션 2 — 생활비 */}
      <SectionCard
        icon="🏠"
        title="월 생활비"
        subtitle="월세 + 식비 + 보험 + 기타"
      >
        {/* 직군 선택 */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>
            직군 선택 (평균값 자동 입력)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(JOB_PRESETS).map(([key, val]) => {
              const isSel = selectedJob === key
              return (
                <button
                  key={key}
                  onClick={() => handleJobChange(key)}
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
                  {val.label}
                </button>
              )
            })}
          </div>

          {autoFillMsg && (
            <p style={{
              fontSize:     12,
              color:        '#48BB78',
              fontWeight:   600,
              marginTop:    8,
              padding:      '6px 10px',
              background:   '#F0FFF4',
              borderRadius: 8,
            }}>
              ✓ {autoFillMsg}
            </p>
          )}
        </div>

        <NumberInput
          value={freelancerInput.monthlyExpense}
          onChange={v => updateFreelancerInput({ monthlyExpense: v })}
          placeholder="월 생활비 합계"
          accent={ACCENT}
        />
      </SectionCard>

      {/* 섹션 3 — 대출이자 */}
      <SectionCard
        icon="🏦"
        title="월 대출이자"
        subtitle="대출이 없으면 0"
      >
        <NumberInput
          value={freelancerInput.loanInterest}
          onChange={v => updateFreelancerInput({ loanInterest: v })}
          placeholder="0"
          accent={ACCENT}
        />
      </SectionCard>

      {/* 섹션 4 — 부업수입 (선택) */}
      <SectionCard
        icon="💡"
        title="월 부업 수입"
        subtitle="현재 부업이 없으면 0"
        action={
          !skipSideIncome ? (
            <button
              onClick={() => { setSkipSideIncome(true); updateFreelancerInput({ sideIncome: 0 }) }}
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
              없음
            </button>
          ) : (
            <button
              onClick={() => setSkipSideIncome(false)}
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
          )
        }
      >
        {skipSideIncome ? (
          <div style={{
            padding:      '14px 16px',
            borderRadius: 12,
            background:   '#FFF8F0',
            border:       '1.5px dashed #FED7AA',
          }}>
            <p style={{ fontSize: 13, color: '#F97316', fontWeight: 600, margin: 0 }}>
              부업 수입 없음으로 계산할게요
            </p>
          </div>
        ) : (
          <NumberInput
            value={freelancerInput.sideIncome}
            onChange={v => updateFreelancerInput({ sideIncome: v })}
            placeholder="0"
            accent={ACCENT}
          />
        )}
      </SectionCard>

    </div>
  )
}
