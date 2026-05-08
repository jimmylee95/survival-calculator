'use client'

import { useCalculatorStore } from '@/store/useCalculatorStore'
import { BusinessWizard }  from '@/components/calculator/BusinessWizard'
import { FreelancerWizard } from '@/components/calculator/FreelancerWizard'

export default function CalculatorPage() {
  const { mode, _hydrated } = useCalculatorStore()

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

  if (mode === 'business') return <BusinessWizard />
  return <FreelancerWizard />
}
