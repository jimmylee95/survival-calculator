'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function FailContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const code    = searchParams.get('code')    ?? ''
  const message = searchParams.get('message') ?? '결제가 취소됐어요'

  const errorMessages: Record<string, string> = {
    PAY_PROCESS_CANCELED:  '결제가 취소됐어요',
    PAY_PROCESS_ABORTED:   '결제 중 오류가 발생했어요',
    REJECT_CARD_COMPANY:   '카드사에서 결제를 거절했어요',
    INVALID_CARD_EXPIRY:   '카드 유효기간을 확인해주세요',
    INVALID_STOPPED_CARD:  '정지된 카드예요',
    NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: '해당 카드는 지원하지 않아요',
  }

  const displayMessage = errorMessages[code] ?? decodeURIComponent(message)

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F9FB',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 430, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😓</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1A1F5E', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          결제가 완료되지 않았어요
        </h1>
        <p style={{ fontSize: 15, color: '#718096', margin: '0 0 8px' }}>
          {displayMessage}
        </p>
        {code && (
          <p style={{ fontSize: 12, color: '#A0AEC0', margin: '0 0 36px', fontFamily: 'monospace' }}>
            오류 코드: {code}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => router.push('/subscribe')}
            style={{
              width: '100%', height: 54, borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #1A1F5E, #4F46E5)',
              color: '#fff', fontSize: 15, fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 6px 20px rgba(26,31,94,0.25)',
            }}
          >
            🔄 다시 시도하기
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%', height: 54, borderRadius: 14,
              border: '1.5px solid #E2E8F0', background: '#fff',
              fontSize: 15, fontWeight: 700, color: '#4A5568', cursor: 'pointer',
            }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SubscribeFailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 28 }}>⚡</div>
      </div>
    }>
      <FailContent />
    </Suspense>
  )
}
