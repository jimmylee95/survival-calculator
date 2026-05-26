'use client'

import { useEffect } from 'react'
import { useCalculatorStore } from '@/store/useCalculatorStore'
import { FreelancerWizard } from '@/components/calculator/FreelancerWizard'

export default function EmployeePage() {
  const { setMode, _hydrated } = useCalculatorStore()

  useEffect(() => {
    if (_hydrated) setMode('freelancer')
  }, [_hydrated, setMode])

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

  return <FreelancerWizard />
}
