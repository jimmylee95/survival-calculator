'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus]   = useState<'loading' | 'success' | 'error'>('loading')
  const [periodEnd, setPeriodEnd] = useState('')
  const [errorMsg, setErrorMsg]   = useState('')

  useEffect(() => {
    const authKey     = searchParams.get('authKey')
    const customerKey = searchParams.get('customerKey')

    if (!authKey || !customerKey) {
      setErrorMsg('잘못된 접근입니다')
      setStatus('error')
      return
    }

    fetch('/api/billing/issue', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ authKey, customerKey }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPeriodEnd(data.periodEnd ? new Date(data.periodEnd).toLocaleDateString('ko-KR') : '')
          setStatus('success')
        } else {
          setErrorMsg(data.error ?? '구독 처리 중 오류가 발생했어요')
          setStatus('error')
        }
      })
      .catch(() => {
        setErrorMsg('네트워크 오류가 발생했어요')
        setStatus('error')
      })
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', background: '#F8F9FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 36 }}>⏳</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#4A5568' }}>결제를 처리하고 있어요...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100dvh', background: '#F8F9FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1F5E', margin: '0 0 8px' }}>결제에 실패했어요</h1>
        <p style={{ fontSize: 14, color: '#718096', margin: '0 0 32px' }}>{errorMsg}</p>
        <button
          onClick={() => router.push('/subscribe')}
          style={{
            padding: '14px 32px', borderRadius: 14, border: 'none',
            background: '#1A1F5E', color: '#fff',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}
        >
          다시 시도하기
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #22543D 0%, #276749 30%, #F8F9FB 30%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 430, padding: '64px 20px 80px', textAlign: 'center' }}>

        {/* 성공 아이콘 */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
        }}>
          🎉
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
          구독이 시작됐어요!
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 48px' }}>
          해방 플랜의 모든 기능을 사용할 수 있어요
        </p>

        {/* 구독 정보 카드 */}
        <div style={{
          background: '#fff', borderRadius: 20,
          boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
          padding: '28px 24px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🫧</div>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1F5E', margin: '0 0 4px' }}>해방 플랜 활성화</p>
          {periodEnd && (
            <p style={{ fontSize: 14, color: '#718096', margin: '0 0 20px' }}>
              다음 결제일: {periodEnd}
            </p>
          )}
          <div style={{ background: '#F0FFF4', borderRadius: 12, padding: '12px 16px' }}>
            <p style={{ fontSize: 13, color: '#276749', fontWeight: 700, margin: 0 }}>
              ✓ 월 9,900원 · 자동 갱신
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%', height: 54, borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #1A1F5E, #4F46E5)',
            color: '#fff', fontSize: 16, fontWeight: 900,
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(26,31,94,0.3)',
          }}
        >
          대시보드 보러가기 →
        </button>
      </div>
    </div>
  )
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 28 }}>⚡</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
