'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Loading } from '@/components/layout/Loading'

function formatJoinDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function MyPage() {
  console.log('[mypage] rendering')
  const router = useRouter()
  const { user, loading } = useAuth({ redirectTo: '/login' })
  console.log('[mypage] auth state — loading:', loading, 'user:', user?.id ?? null)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    const sb = createClient()
    await sb.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  if (loading) return <Loading />
  if (!user)   return null

  const nickname = (user.user_metadata?.name as string | undefined) ?? '사용자'
  const avatar   = user.user_metadata?.avatar_url as string | undefined
  const joinDate = formatJoinDate(user.created_at)

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F9FB',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: '100%', overflowX: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: 430 }}>

        {/* 헤더 */}
        <div style={{ padding: '24px 24px 8px' }}>
          <h1 style={{
            fontSize: 22, fontWeight: 900, color: '#1A1F5E',
            margin: 0, letterSpacing: '-0.5px',
          }}>
            마이페이지
          </h1>
        </div>

        {/* 프로필 카드 */}
        <div style={{ padding: '12px 16px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#fff', borderRadius: 18,
            padding: '20px 22px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}>
            <Avatar nickname={nickname} src={avatar} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 17, fontWeight: 900, color: '#1A1F5E',
                margin: 0, letterSpacing: '-0.3px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {nickname}
              </p>
              <p style={{
                fontSize: 12, color: '#94A3B8',
                margin: '4px 0 0', fontWeight: 600,
              }}>
                {joinDate} 가입
              </p>
            </div>
          </div>
        </div>

        {/* 메뉴 리스트 */}
        <div style={{ padding: '12px 16px 8px' }}>
          <div style={{
            background: '#fff', borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}>
            <MenuRow
              icon="📊" label="내 계산 기록"
              onClick={() => router.push('/history')}
            />
            <Divider />
            <MenuRow
              icon="💳" label="구독 관리"
              onClick={() => alert('준비중입니다')}
            />
            <Divider />
            <MenuRow
              icon="🔔" label="알림 설정"
              onClick={() => alert('준비중입니다')}
            />
            <Divider />
            <MenuRow
              icon="📞" label="문의하기"
              onClick={() => alert('준비중입니다')}
            />
            <Divider />
            <MenuRow
              icon="🔒" label="개인정보 처리방침"
              onClick={() => alert('준비중입니다')}
            />
          </div>
        </div>

        {/* 로그아웃 */}
        <div style={{ padding: '8px 16px 32px' }}>
          <button onClick={handleLogout}
            style={{
              width: '100%', height: 52, borderRadius: 14,
              border: '1.5px solid #E2E8F0', background: '#fff',
              fontSize: 14, fontWeight: 800, color: '#64748B',
              cursor: 'pointer', letterSpacing: '-0.2px',
            }}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 아바타 ──────────────────────────────────────────── */
function Avatar({ nickname, src }: { nickname: string; src?: string }) {
  const [errored, setErrored] = useState(false)
  const initial = nickname.trim().charAt(0).toUpperCase() || '?'

  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={nickname}
        onError={() => setErrored(true)}
        style={{
          width: 56, height: 56, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          background: '#F1F5F9',
        }}
      />
    )
  }

  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: 'linear-gradient(135deg, #1A1F5E, #4F46E5)',
      color: '#fff', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, fontWeight: 900,
    }}>
      {initial}
    </div>
  )
}

/* ── 메뉴 행 ─────────────────────────────────────────── */
function MenuRow({
  icon, label, onClick,
}: {
  icon: string; label: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      style={{
        width: '100%', padding: '16px 20px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        textAlign: 'left',
      }}>
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{
        flex: 1, fontSize: 15, fontWeight: 700,
        color: '#1A1F5E', letterSpacing: '-0.2px',
      }}>
        {label}
      </span>
      <span style={{ fontSize: 18, color: '#CBD5E1' }}>›</span>
    </button>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#F1F5F9', margin: '0 20px' }} />
}
