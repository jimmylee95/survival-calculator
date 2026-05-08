'use client'

import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import { ProgressHeader }  from '@/components/calculator/ProgressHeader'
import { BusinessWizard }  from '@/components/calculator/BusinessWizard'
import { FreelancerForm }  from '@/components/calculator/FreelancerForm'

const MODE_META = {
  business:   { title: '사장님 생존 계산기', accent: '#1A1F5E', label: '자영업자 모드' },
  freelancer: { title: '직장인 독립 계산기', accent: '#FF6B35', label: '직장인 모드'   },
}

export default function CalculatorPage() {
  const router = useRouter()
  const { mode, freelancerInput, calculate, _hydrated } = useCalculatorStore()

  // 하이드레이션 전 빈 화면
  if (!_hydrated) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#F8F9FB',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 28 }}>⚡</div>
      </div>
    )
  }

  // 자영업자 모드: 새 3단계 위저드 사용
  if (mode === 'business') {
    return <BusinessWizard />
  }

  // 직장인 모드: 기존 폼 유지
  const meta = MODE_META.freelancer
  const isReady = freelancerInput.assets > 0 || freelancerInput.monthlyExpense > 0

  function handleCalculate() {
    calculate()
    router.push('/result')
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F9FB',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <ProgressHeader
          step={1} totalSteps={2}
          title={meta.label} accent={meta.accent}
        />
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 16px 120px',
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          <div style={{ marginBottom: 20, paddingLeft: 4 }}>
            <h2 style={{
              fontSize: 20, fontWeight: 900, color: '#1A1F5E',
              margin: '0 0 4px', letterSpacing: '-0.3px',
            }}>
              {meta.title}
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
              아래 항목을 입력하면 바로 계산해드려요
            </p>
          </div>
          <FreelancerForm />
        </div>
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, padding: '12px 16px 28px',
          background: 'linear-gradient(to top, #F8F9FB 60%, transparent)',
          zIndex: 30,
        }}>
          <button
            onClick={handleCalculate}
            disabled={!isReady}
            style={{
              width: '100%', height: 56, borderRadius: 16, border: 'none',
              cursor: isReady ? 'pointer' : 'not-allowed',
              fontSize: 16, fontWeight: 900, color: '#fff',
              background: isReady
                ? `linear-gradient(135deg, ${meta.accent}, ${meta.accent}CC)`
                : '#E2E8F0',
              boxShadow: isReady ? `0 8px 24px ${meta.accent}50` : 'none',
              transition: 'all 0.2s', letterSpacing: '-0.3px',
            }}
          >
            {isReady ? '계산하기 🧮' : '금액을 입력해주세요'}
          </button>
        </div>
      </div>
    </div>
  )
}
