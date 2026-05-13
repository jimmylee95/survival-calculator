'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSubscription } from '@/hooks/useSubscription'
import type { User } from '@supabase/supabase-js'

const FEATURES = [
  { icon: '📊', text: '매일 런웨이 자동 저장 & 추세 분석' },
  { icon: '🔔', text: '위험 알림 & 행동 처방전' },
  { icon: '🎯', text: '업종별 벤치마크 상세 비교' },
  { icon: '📸', text: '결과 이미지 다운로드 (무제한)' },
  { icon: '🤝', text: '커뮤니티 기능 우선 접근' },
  { icon: '✨', text: '향후 추가될 모든 프리미엄 기능' },
]

function getGuestCustomerKey(): string {
  const existing = localStorage.getItem('guest_customer_key')
  if (existing) return existing
  const key = 'guest_' + crypto.randomUUID()
  localStorage.setItem('guest_customer_key', key)
  return key
}

export default function SubscribePage() {
  const router   = useRouter()
  const [user, setUser]           = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const { isSubscribed, loading: subLoading } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthLoading(false)
    }).catch(() => setAuthLoading(false))
  }, [])

  async function handleSubscribe() {
    setLoading(true)
    setError('')

    const customerKey = user ? user.id : getGuestCustomerKey()

    try {
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk')
      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      const payment = tossPayments.payment({ customerKey })

      await payment.requestBillingAuth({
        method:        'CARD',
        successUrl:    `${window.location.origin}/subscribe/success`,
        failUrl:       `${window.location.origin}/subscribe/fail`,
        customerEmail: user?.email ?? '',
        customerName:  user?.user_metadata?.name ?? '사용자',
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '결제창을 열지 못했어요'
      setError(msg)
      setLoading(false)
    }
  }

  if (subLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FB' }}>
        <div style={{ fontSize: 28 }}>🫧</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(180deg, #1A1F5E 0%, #2D3581 40%, #F8F9FB 40%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 430, padding: '48px 20px 80px' }}>

        {/* 뒤로가기 */}
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
          fontSize: 24, cursor: 'pointer', padding: '0 0 24px', display: 'block',
        }}>←</button>

        {/* 비로그인 안내 */}
        {!user && !authLoading && (
          <div style={{
            background: 'rgba(255,255,255,0.12)', borderRadius: 12,
            padding: '10px 16px', marginBottom: 16, textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
              로그인하면 구독이 계정에 연결됩니다
            </p>
          </div>
        )}

        {/* 타이틀 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🫧</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            해방 플랜
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            자유를 향한 가장 현명한 투자
          </p>
        </div>

        {/* 메인 카드 */}
        <div style={{
          background: '#fff', borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}>
          {/* 가격 영역 */}
          <div style={{
            background: 'linear-gradient(135deg, #1A1F5E 0%, #4F46E5 100%)',
            padding: '32px 24px', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>9,900</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>원</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginLeft: 2 }}>/ 월</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '8px 0 0' }}>
              언제든 해지 가능 · 남은 기간 유효
            </p>
          </div>

          {/* 기능 목록 */}
          <div style={{ padding: '24px 24px 8px' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#A0AEC0', margin: '0 0 16px', letterSpacing: '0.5px' }}>
              포함된 기능
            </p>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < FEATURES.length - 1 ? '1px solid #F7FAFC' : 'none',
              }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2D3748' }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* CTA 버튼 */}
          <div style={{ padding: '20px 24px 28px' }}>
            {isSubscribed ? (
              <div style={{
                width: '100%', height: 56, borderRadius: 14,
                background: '#F0FFF4', border: '1.5px solid #9AE6B4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 800, color: '#276749',
              }}>
                ✓ 이미 구독 중이에요
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                style={{
                  width: '100%', height: 56, borderRadius: 14, border: 'none',
                  background: loading ? '#E2E8F0' : 'linear-gradient(135deg, #1A1F5E, #4F46E5)',
                  color: loading ? '#A0AEC0' : '#fff',
                  fontSize: 16, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(26,31,94,0.3)',
                  transition: 'all 0.2s', letterSpacing: '-0.3px',
                }}
              >
                {loading ? '처리 중...' : '🚀 구독 시작하기'}
              </button>
            )}

            {error && (
              <p style={{ fontSize: 13, color: '#E53E3E', textAlign: 'center', margin: '12px 0 0', fontWeight: 600 }}>
                {error}
              </p>
            )}

            <p style={{ fontSize: 12, color: '#A0AEC0', textAlign: 'center', margin: '14px 0 0', lineHeight: 1.6 }}>
              신용·체크카드 결제 · 첫 결제 후 매월 자동 갱신<br />
              카드 등록 후 즉시 9,900원이 청구됩니다
            </p>
          </div>
        </div>

        {/* 안내 텍스트 */}
        <div style={{ marginTop: 24, padding: '0 4px' }}>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', lineHeight: 1.8, textAlign: 'center' }}>
            결제는 토스페이먼츠를 통해 안전하게 처리됩니다<br />
            구독 해지는 마이페이지에서 언제든 가능합니다
          </p>
        </div>
      </div>
    </div>
  )
}
