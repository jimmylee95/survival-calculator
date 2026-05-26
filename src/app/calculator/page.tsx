'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculatorStore } from '@/store/useCalculatorStore'

export default function CalculatorRedirectPage() {
  const router = useRouter()
  const { mode, _hydrated } = useCalculatorStore()

  useEffect(() => {
    if (!_hydrated) return
    if (mode === 'business')        router.replace('/self-employed')
    else if (mode === 'freelancer') router.replace('/employee')
    else                            router.replace('/')
  }, [_hydrated, mode, router])

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F9FB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 28 }}>⚡</div>
    </div>
  )
}
