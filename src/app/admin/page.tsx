'use client'

import { useState, useCallback } from 'react'

const NAV_BG = '#1B1E28'
const ACCENT = '#3182F6'
const RED    = '#F04452'
const GREEN  = '#16A34A'
const PURPLE = '#818CF8'
const ORANGE = '#F97316'

const INDUSTRY_LABELS: Record<string, string> = {
  restaurant: '🍽️ 음식점', cafe: '☕ 카페', retail: '🛒 소매/유통',
  service: '💇 서비스업', delivery: '🛵 배달전문', other: '🏢 기타',
}
const DANGER_META: Record<string, { label: string; emoji: string; color: string }> = {
  critical: { label: '위험', emoji: '🚨', color: '#FC8181' }, warning: { label: '경고', emoji: '⚠️', color: '#F6AD55' },
  caution: { label: '주의', emoji: '🟡', color: '#ECC94B' }, safe: { label: '안전', emoji: '✅', color: '#68D391' },
  infinite: { label: '흑자/달성', emoji: '🎉', color: '#63B3ED' },
}

interface AdminData {
  overview: { totalCalcs: number; uniqueUsers: number; bizCount: number; freeCount: number }
  today: { total: number; biz: number; free: number; users: number; shares: number; referrals: number; signups: number }
  yesterday: { total: number; users: number; shares: number; referrals: number; signups: number }
  events: { totalShares: number; totalReferrals: number; totalSignups: number }
  dailyEvents: Record<string, { calculations: number; kakao_shares: number; referral_visits: number; signups: number }>
  retention: { returningUsers: number; oneTimeUsers: number; recentSignupCount: number; totalRegistered: number; avgCalcsPerUser: number }
  conversion: { totalUsers: number; paidUsers: number; paidRate: number; totalCalcs: number }
  recentCalcs: { id: string; user_id: string | null; mode: string; industry_type: string | null; result_days: number | null; danger_level: string; monthly_net_loss: number | null; monthly_savings: number | null; created_at: string }[]
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuth] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeNav, setActiveNav] = useState('home')

  const fetchData = useCallback(async (pw: string) => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin?secret=${encodeURIComponent(pw)}`)
      if (!res.ok) { setError('인증 실패'); setLoading(false); return }
      setData(await res.json()); setAuth(true)
    } catch { setError('서버 오류') }
    setLoading(false)
  }, [])

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 36px', width: '100%', maxWidth: 400, boxShadow: '0 2px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🔐</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1B1E28', margin: '0 0 6px' }}>생존 계산기 어드민</h1>
          <p style={{ fontSize: 13, color: '#8B95A1', margin: '0 0 28px' }}>관리자 비밀번호를 입력하세요</p>
          <input type="password" value={secret} onChange={e => setSecret(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchData(secret)}
            placeholder="비밀번호" style={{ width: '100%', height: 46, borderRadius: 10, border: '1.5px solid #E5E8EB', padding: '0 16px', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
          {error && <p style={{ fontSize: 12, color: RED, margin: '0 0 12px' }}>{error}</p>}
          <button onClick={() => fetchData(secret)} disabled={loading}
            style={{ width: '100%', height: 46, borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? '로딩...' : '로그인'}
          </button>
        </div>
      </div>
    )
  }
  if (!data) return null
  const { overview: ov, today: td, yesterday: yd, events: ev, dailyEvents, retention: ret, conversion: conv, recentCalcs } = data

  const retentionRate = ret.totalRegistered > 0 ? Math.round((ret.returningUsers / ret.totalRegistered) * 100) : 0

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {/* ══ 사이드바 ══ */}
      <aside style={{ width: 220, background: NAV_BG, position: 'fixed', top: 0, left: 0, height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 50, overflowY: 'auto' }}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 20 }}>⚡</span><span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>생존 계산기</span></div>
        </div>
        <nav style={{ padding: '14px 10px', flex: 1 }}>
          <NGroup label="Menu">
            <NItem icon="🏠" label="홈" id="home" active={activeNav} onClick={setActiveNav} />
            <NItem icon="📋" label="계산 기록" id="records" active={activeNav} onClick={setActiveNav} />
          </NGroup>
          <NGroup label="분석">
            <NItem icon="📈" label="기간별 분석" id="analytics" active={activeNav} onClick={setActiveNav} />
            <NItem icon="🔗" label="바이럴 현황" id="viral" active={activeNav} onClick={setActiveNav} />
            <NItem icon="👤" label="유저 리텐션" id="retention" active={activeNav} onClick={setActiveNav} />
            <NItem icon="💰" label="유료 전환율" id="conversion" active={activeNav} onClick={setActiveNav} />
          </NGroup>
          <NGroup label="관리">
            <NItem icon="👤" label="고객 관리" id="users" active={activeNav} onClick={setActiveNav} badge="Soon" />
            <NItem icon="💳" label="결제" id="billing" active={activeNav} onClick={setActiveNav} badge="Soon" />
            <NItem icon="⚙️" label="설정" id="settings" active={activeNav} onClick={setActiveNav} badge="Soon" />
          </NGroup>
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2D3143', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
            <div><p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>관리자</p><p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>admin@survival.app</p></div>
          </div>
        </div>
      </aside>

      {/* ══ 메인 ══ */}
      <main style={{ flex: 1, marginLeft: 220, background: '#F5F6F8' }}>
        <div style={{ padding: '24px 32px 48px' }}>

          {activeNav === 'home' && <>
            {/* 배너 */}
            <div style={{ background: 'linear-gradient(135deg, #FFF9DB 0%, #FFECD2 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1B1E28', margin: '0 0 6px' }}>안녕하세요, 관리자님 👋</h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>오늘도 데이터와 함께 성장해보세요.</p>
              </div>
              <button onClick={() => fetchData(secret)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#4E5968', cursor: 'pointer' }}>🔄 새로고침</button>
            </div>

            {/* ── 사이트 현황 ── */}
            <SectionHead title="사이트 현황" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* 전체 회원수 */}
              <BigCard>
                <CardTop label="전체 고객수 ⓘ" value={ov.uniqueUsers.toLocaleString()} icon="👥" iconBg="#F3E8FF" />
                <CardDivider />
                <SubRow label="카카오 로그인" value={`${ov.uniqueUsers.toLocaleString()}`} />
                <SubRow label="전체 계산 수" value={`${ov.totalCalcs.toLocaleString()}`} />
              </BigCard>
              {/* DAU */}
              <BigCard>
                <CardTop label="DAU ⓘ" value={String(td.users)} icon="📊" iconBg="#EFF6FF" delta={td.users - yd.users} />
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 14 }}>
                    {td.total > 0 ? <><div style={{ width: `${(td.biz / td.total) * 100}%`, background: PURPLE }} /><div style={{ width: `${(td.free / td.total) * 100}%`, background: ACCENT }} /></> : <div style={{ width: '100%', background: '#F2F4F6' }} />}
                  </div>
                  <SubRowDot color={PURPLE} label="신규 계산" value={td.total} />
                  <SubRowDot color={ACCENT} label="재방문" value={td.users} />
                </div>
              </BigCard>
            </div>

            {/* ── 매출액 ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
              <BigCard>
                <CardTop label="사장님 계산기 ⓘ" value="₩0" icon="🏪" iconBg="#EEF2FF" />
                <ProgressBar pct={ov.totalCalcs > 0 ? (ov.bizCount / ov.totalCalcs) * 100 : 0} color={ACCENT} />
                <SubRow label="전체 계산" value={`${ov.bizCount}건`} />
                <SubRow label="오늘 계산" value={`${td.biz}건`} />
                <SubRow label="구독 매출" value="₩0" sub="준비중" />
              </BigCard>
              <BigCard>
                <CardTop label="탈출 계산기 ⓘ" value="₩0" icon="🚀" iconBg="#FFF4EE" />
                <ProgressBar pct={ov.totalCalcs > 0 ? (ov.freeCount / ov.totalCalcs) * 100 : 0} color={ORANGE} />
                <SubRow label="전체 계산" value={`${ov.freeCount}건`} />
                <SubRow label="오늘 계산" value={`${td.free}건`} />
                <SubRow label="구독 매출" value="₩0" sub="준비중" />
              </BigCard>
            </div>

            {/* ── 유저 리텐션 + 전환율 ── */}
            <SectionHead title="👤 유저 리텐션 & 전환율" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
              {/* 재방문율 */}
              <BigCard>
                <p style={{ fontSize: 13, color: '#8B95A1', margin: '0 0 6px', fontWeight: 600 }}>재방문율</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: retentionRate >= 30 ? GREEN : retentionRate >= 10 ? ORANGE : RED, margin: '0 0 8px', letterSpacing: '-1px' }}>
                  {retentionRate}%
                </p>
                <div style={{ height: 8, background: '#F2F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ height: '100%', width: `${retentionRate}%`, background: retentionRate >= 30 ? GREEN : retentionRate >= 10 ? ORANGE : RED, borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
                <SubRow label="2회 이상 방문" value={`${ret.returningUsers}명`} />
                <SubRow label="1회만 방문" value={`${ret.oneTimeUsers}명`} />
              </BigCard>

              {/* 신규 vs 재방문 도넛 */}
              <BigCard>
                <p style={{ fontSize: 13, color: '#8B95A1', margin: '0 0 6px', fontWeight: 600 }}>유저 구성</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, margin: '16px 0' }}>
                  <DonutChart returning={ret.returningUsers} oneTime={ret.oneTimeUsers} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <SubRowDot color={ACCENT} label="재방문" value={ret.returningUsers} />
                    <SubRowDot color="#E2E8F0" label="1회 방문" value={ret.oneTimeUsers} />
                  </div>
                </div>
              </BigCard>

              {/* 유료 전환율 */}
              <BigCard>
                <p style={{ fontSize: 13, color: '#8B95A1', margin: '0 0 6px', fontWeight: 600 }}>유료 전환율</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: conv.paidRate > 0 ? GREEN : '#B0B8C1', margin: '0 0 8px', letterSpacing: '-1px' }}>
                  {conv.paidRate}%
                </p>
                <div style={{ height: 8, background: '#F2F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ height: '100%', width: `${conv.paidRate}%`, background: GREEN, borderRadius: 4 }} />
                </div>
                <SubRow label="전체 가입자" value={`${conv.totalUsers}명`} />
                <SubRow label="유료 구독" value={`${conv.paidUsers}명`} sub={conv.paidUsers === 0 ? '준비중' : undefined} />
                <SubRow label="ARPU" value="₩0" sub="준비중" />
              </BigCard>
            </div>

            {/* ── 기간별 분석 ── */}
            <SectionHead title="📈 기간별 분석" />
            <WCard title="일별 현황" sub="최근 14일">
              <DailyTable dailyEvents={dailyEvents} />
            </WCard>

            {/* ── 바이럴 현황 ── */}
            <SectionHead title="🔗 바이럴 현황" style={{ marginTop: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
              <MiniCard emoji="📤" label="카카오 공유" total={ev.totalShares} today={td.shares} delta={td.shares - yd.shares} />
              <MiniCard emoji="🔗" label="공유 유입" total={ev.totalReferrals} today={td.referrals} delta={td.referrals - yd.referrals} />
              <MiniCard emoji="✅" label="신규 가입" total={ev.totalSignups} today={td.signups} delta={td.signups - yd.signups} />
            </div>

            {/* ── 최근 기록 ── */}
            <SectionHead title="🕐 최근 계산 기록" />
            <WCard><RecordsTable records={recentCalcs} /></WCard>
          </>}

          {activeNav === 'records' && <WCard title="전체 계산 기록"><RecordsTable records={recentCalcs} /></WCard>}
          {activeNav === 'analytics' && <><SectionHead title="기간별 분석" /><WCard title="일별 현황"><DailyTable dailyEvents={dailyEvents} /></WCard></>}
          {activeNav === 'viral' && <>
            <SectionHead title="바이럴 현황" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              <MiniCard emoji="📤" label="카카오 공유" total={ev.totalShares} today={td.shares} delta={td.shares - yd.shares} />
              <MiniCard emoji="🔗" label="공유 유입" total={ev.totalReferrals} today={td.referrals} delta={td.referrals - yd.referrals} />
              <MiniCard emoji="✅" label="신규 가입" total={ev.totalSignups} today={td.signups} delta={td.signups - yd.signups} />
            </div>
            <WCard title="일별 바이럴 추이"><DailyTable dailyEvents={dailyEvents} /></WCard>
          </>}
          {activeNav === 'retention' && <>
            <SectionHead title="👤 유저 리텐션 분석" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <StatCard label="재방문율" value={`${retentionRate}%`} color={retentionRate >= 30 ? GREEN : retentionRate >= 10 ? ORANGE : RED} icon="🔁" />
              <StatCard label="전체 가입 유저" value={`${ret.totalRegistered.toLocaleString()}명`} color="#1B1E28" icon="👥" />
              <StatCard label="재방문 유저" value={`${ret.returningUsers.toLocaleString()}명`} color={ACCENT} icon="↩️" />
              <StatCard label="1회 방문 유저" value={`${ret.oneTimeUsers.toLocaleString()}명`} color="#8B95A1" icon="1️⃣" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <BigCard>
                <p style={{ fontSize: 13, color: '#8B95A1', fontWeight: 600, margin: '0 0 16px' }}>유저 구성 비율</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
                  <DonutChart returning={ret.returningUsers} oneTime={ret.oneTimeUsers} />
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT }} /><span style={{ fontSize: 13, color: '#4E5968' }}>재방문 유저</span></div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#1B1E28' }}>{ret.returningUsers}명</span>
                      </div>
                      <div style={{ height: 8, background: '#F2F4F6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${ret.totalRegistered > 0 ? (ret.returningUsers / ret.totalRegistered) * 100 : 0}%`, background: ACCENT, borderRadius: 4 }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E2E8F0' }} /><span style={{ fontSize: 13, color: '#4E5968' }}>1회 방문</span></div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#1B1E28' }}>{ret.oneTimeUsers}명</span>
                      </div>
                      <div style={{ height: 8, background: '#F2F4F6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${ret.totalRegistered > 0 ? (ret.oneTimeUsers / ret.totalRegistered) * 100 : 0}%`, background: '#CBD5E1', borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </BigCard>
              <BigCard>
                <p style={{ fontSize: 13, color: '#8B95A1', fontWeight: 600, margin: '0 0 16px' }}>세부 지표</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <MetricRow label="7일 신규 가입" value={`${ret.recentSignupCount}명`} icon="✨" color="#7C3AED" />
                  <MetricRow label="유저 평균 계산 횟수" value={`${ret.avgCalcsPerUser}회`} icon="🔢" color={ACCENT} />
                  <MetricRow label="전체 등록 유저" value={`${ret.totalRegistered}명`} icon="👤" color="#1B1E28" />
                  <MetricRow label="재방문 전환 목표" value="30%" icon="🎯" color={GREEN} sub="현재 대비 목표" />
                </div>
              </BigCard>
            </div>
            <WCard title="리텐션 개선 인사이트">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <InsightCard
                  icon="📊"
                  title="현재 재방문율"
                  desc={retentionRate >= 30 ? '양호한 재방문율입니다. 유저 만족도가 높습니다.' : retentionRate >= 10 ? '재방문율 개선이 필요합니다. 푸시 알림 또는 이메일 리마인더를 고려해보세요.' : '재방문율이 낮습니다. 온보딩 경험을 개선하고 결과 공유 기능을 강화해보세요.'}
                  color={retentionRate >= 30 ? GREEN : retentionRate >= 10 ? ORANGE : RED}
                />
                <InsightCard icon="🔔" title="재방문 유도 전략" desc="카카오 공유 후 결과 비교 기능, 정기 알림으로 유저 재방문을 유도할 수 있습니다." color={ACCENT} />
                <InsightCard icon="🎁" title="구독 전환 기회" desc="재방문 유저는 유료 구독 전환 가능성이 높습니다. 프리미엄 기능 출시 시 우선 타겟으로 활용하세요." color={PURPLE} />
              </div>
            </WCard>
          </>}

          {activeNav === 'conversion' && <>
            <SectionHead title="💰 유료 전환율 분석" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <StatCard label="유료 전환율" value={`${conv.paidRate}%`} color={conv.paidRate > 0 ? GREEN : '#B0B8C1'} icon="📈" sub={conv.paidRate === 0 ? '구독 준비중' : undefined} />
              <StatCard label="유료 구독자" value={`${conv.paidUsers}명`} color={conv.paidUsers > 0 ? GREEN : '#B0B8C1'} icon="💳" sub={conv.paidUsers === 0 ? '준비중' : undefined} />
              <StatCard label="ARPU" value="₩0" color="#B0B8C1" icon="💵" sub="준비중" />
              <StatCard label="MRR" value="₩0" color="#B0B8C1" icon="📅" sub="준비중" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
              <WCard title="전환 퍼널" sub="전체 계산 → 가입 → 유료">
                <ConversionFunnel totalCalcs={conv.totalCalcs} totalUsers={conv.totalUsers} paidUsers={conv.paidUsers} />
              </WCard>
              <BigCard>
                <p style={{ fontSize: 13, color: '#8B95A1', fontWeight: 600, margin: '0 0 16px' }}>퍼널 전환율</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#4E5968' }}>계산 → 가입</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#1B1E28' }}>
                        {conv.totalCalcs > 0 ? `${Math.round((conv.totalUsers / conv.totalCalcs) * 100)}%` : '0%'}
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#F2F4F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${conv.totalCalcs > 0 ? Math.min((conv.totalUsers / conv.totalCalcs) * 100, 100) : 0}%`, background: ACCENT, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#4E5968' }}>가입 → 유료</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#B0B8C1' }}>0%</span>
                    </div>
                    <div style={{ height: 6, background: '#F2F4F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '0%', background: GREEN, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 4, padding: '12px 14px', background: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', margin: '0 0 2px' }}>💡 벤치마크</p>
                    <p style={{ fontSize: 11, color: '#A16207', margin: 0 }}>SaaS 평균 유료 전환율은 2~5%입니다. 구독 기능 출시 후 목표를 설정해보세요.</p>
                  </div>
                </div>
              </BigCard>
            </div>
            <WCard title="구독 플랜 현황" sub="준비중">
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: 48 }}>🚀</span>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#1B1E28', margin: '16px 0 6px' }}>구독 기능 준비 중</p>
                <p style={{ fontSize: 13, color: '#8B95A1', margin: 0 }}>유료 플랜이 출시되면 여기서 구독 현황과 매출 지표를 확인할 수 있습니다</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                  {['스탠다드 ₩9,900/월', '프리미엄 ₩19,900/월', '팀 ₩49,900/월'].map(p => (
                    <div key={p} style={{ padding: '8px 16px', background: '#F2F4F6', borderRadius: 20, fontSize: 12, color: '#8B95A1', fontWeight: 600 }}>{p}</div>
                  ))}
                </div>
              </div>
            </WCard>
          </>}

          {['users', 'billing', 'settings'].includes(activeNav) && (
            <div style={{ textAlign: 'center', padding: '100px 0' }}><span style={{ fontSize: 56 }}>🚧</span><p style={{ fontSize: 18, fontWeight: 800, color: '#1B1E28', margin: '16px 0 6px' }}>준비 중입니다</p><p style={{ fontSize: 14, color: '#8B95A1' }}>이 기능은 곧 추가될 예정이에요</p></div>
          )}
        </div>
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   공통 컴포넌트
   ═══════════════════════════════════════════════════════════ */
function NGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 18 }}><p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', margin: '0 0 6px 12px', letterSpacing: '0.5px' }}>{label}</p>{children}</div>
}
function NItem({ icon, label, id, active, onClick, badge }: { icon: string; label: string; id: string; active: string; onClick: (id: string) => void; badge?: string }) {
  const on = active === id
  return <button onClick={() => onClick(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: on ? 'rgba(49,130,246,0.12)' : 'transparent', color: on ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: on ? 700 : 500, textAlign: 'left', marginBottom: 1 }}>
    <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span><span style={{ flex: 1 }}>{label}</span>
    {badge && <span style={{ fontSize: 9, fontWeight: 700, color: PURPLE, background: 'rgba(129,140,248,0.15)', borderRadius: 10, padding: '2px 8px' }}>{badge}</span>}
  </button>
}

function SectionHead({ title, style: s }: { title: string; style?: React.CSSProperties }) {
  return <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B1E28', margin: '0 0 16px', ...s }}>{title}</h3>
}
function BigCard({ children }: { children: React.ReactNode }) { return <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E8EB', padding: '28px' }}>{children}</div> }
function WCard({ title, sub, children }: { title?: string; sub?: string; children: React.ReactNode }) {
  return <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E8EB', overflow: 'hidden' }}>
    {title && <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #F2F4F6', display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: 15, fontWeight: 800, color: '#1B1E28', margin: 0 }}>{title}</p>{sub && <span style={{ fontSize: 11, color: '#8B95A1' }}>{sub}</span>}</div>}
    <div style={{ padding: '18px 24px' }}>{children}</div>
  </div>
}
function CardTop({ label, value, icon, iconBg, delta }: { label: string; value: string; icon: string; iconBg: string; delta?: number }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <div>
      <p style={{ fontSize: 13, color: '#8B95A1', margin: '0 0 6px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 900, color: '#1B1E28', margin: '0 0 4px', letterSpacing: '-1px' }}>{value}</p>
      {delta !== undefined && <Delta value={delta} label="전일 대비" />}
    </div>
    <div style={{ width: 52, height: 52, borderRadius: 16, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{icon}</div>
  </div>
}
function CardDivider() { return <div style={{ borderTop: '1px solid #F2F4F6', margin: '16px 0', padding: 0 }} /> }
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return <div style={{ marginTop: 16, marginBottom: 14 }}><div style={{ height: 6, background: '#F2F4F6', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} /></div></div>
}
function SubRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <span style={{ fontSize: 13, color: '#8B95A1' }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 14, fontWeight: 800, color: '#1B1E28' }}>{value}</span>{sub && <span style={{ fontSize: 10, color: '#B0B8C1' }}>{sub}</span>}</div>
  </div>
}
function SubRowDot({ color, label, value }: { color: string; label: string; value: number }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} /><span style={{ fontSize: 13, color: '#4E5968' }}>{label}</span></div>
    <span style={{ fontSize: 14, fontWeight: 800, color: '#1B1E28' }}>{value}</span>
  </div>
}
function MiniCard({ emoji, label, total, today, delta }: { emoji: string; label: string; total: number; today: number; delta: number }) {
  const [hovered, setHovered] = useState(false)
  const yesterday = today - delta
  return (
    <div
      style={{ position: 'relative', background: '#fff', borderRadius: 14, border: '1px solid #E5E8EB', padding: '22px 20px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ fontSize: 20 }}>{emoji}</span><span style={{ fontSize: 13, fontWeight: 600, color: '#8B95A1' }}>{label}</span></div>
      <p style={{ fontSize: 28, fontWeight: 900, color: '#1B1E28', margin: '0 0 6px', letterSpacing: '-1px' }}>{total.toLocaleString()}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 12, color: '#8B95A1' }}>오늘 {today}건</span><Delta value={delta} compact /></div>
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)', border: '1px solid #E5E8EB',
          padding: '12px 16px', zIndex: 100, pointerEvents: 'none', minWidth: 180, whiteSpace: 'nowrap',
        }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#1B1E28', margin: '0 0 8px' }}>{emoji} {label}</p>
          <TipRow emoji="📦" label="전체 누적" value={`${total.toLocaleString()}건`} />
          <TipRow emoji="📅" label="오늘" value={`${today}건`} />
          <TipRow emoji="📅" label="어제" value={`${yesterday}건`} />
          <div style={{ borderTop: '1px solid #F2F4F6', marginTop: 8, paddingTop: 8 }}>
            <TipRow
              emoji={delta > 0 ? '📈' : delta < 0 ? '📉' : '➡️'}
              label="전일 대비"
              value={delta === 0 ? '변동없음' : `${delta > 0 ? '+' : ''}${delta}건`}
              valueColor={delta > 0 ? GREEN : delta < 0 ? RED : '#B0B8C1'}
            />
          </div>
        </div>
      )}
    </div>
  )
}
function Delta({ value, label, compact }: { value: number; label?: string; compact?: boolean }) {
  if (value === 0) return <span style={{ fontSize: compact ? 11 : 12, color: '#B0B8C1' }}>{compact ? '' : (label ? label + ' ' : '')}변동없음</span>
  return <span style={{ fontSize: compact ? 11 : 13, color: value > 0 ? GREEN : RED, fontWeight: 600 }}>
    {!compact && label && <span style={{ color: '#8B95A1', marginRight: 4 }}>{label}</span>}
    {value > 0 ? '▲' : '▼'}{Math.abs(value)}
  </span>
}

/* ── 도넛 차트 ── */
function DonutChart({ returning, oneTime }: { returning: number; oneTime: number }) {
  const total = returning + oneTime
  const pct = total > 0 ? Math.round((returning / total) * 100) : 0
  const r = 40, stroke = 10, circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle cx={50} cy={50} r={r} fill="none" stroke={ACCENT} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.5s' }} />
      <text x={50} y={46} textAnchor="middle" style={{ fontSize: 18, fontWeight: 900, fill: '#1B1E28' }}>{pct}%</text>
      <text x={50} y={62} textAnchor="middle" style={{ fontSize: 9, fill: '#8B95A1' }}>재방문율</text>
    </svg>
  )
}

/* ── 일별 테이블 ── */
type DailyRow = { calculations: number; kakao_shares: number; referral_visits: number; signups: number }
type DailyTooltip = { x: number; y: number; date: string; data: DailyRow } | null

function DailyTable({ dailyEvents }: { dailyEvents: AdminData['dailyEvents'] }) {
  const [tooltip, setTooltip] = useState<DailyTooltip>(null)
  const entries = Object.entries(dailyEvents).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14)
  if (!entries.length) return <Empty />
  const totals = entries.reduce((a, [, v]) => ({ calculations: a.calculations + v.calculations, kakao_shares: a.kakao_shares + v.kakao_shares, referral_visits: a.referral_visits + v.referral_visits, signups: a.signups + v.signups }), { calculations: 0, kakao_shares: 0, referral_visits: 0, signups: 0 })
  return <>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead><tr style={{ borderBottom: '2px solid #F2F4F6' }}>
        <th style={thS}>일자</th><th style={{ ...thS, textAlign: 'right' }}>계산 요청</th><th style={{ ...thS, textAlign: 'right' }}>카카오 공유</th><th style={{ ...thS, textAlign: 'right' }}>공유 유입</th><th style={{ ...thS, textAlign: 'right' }}>회원가입</th>
      </tr></thead>
      <tbody>
        {entries.map(([d, v]) => (
          <tr key={d}
            style={{ borderBottom: '1px solid #F8F9FB', cursor: 'default' }}
            onMouseEnter={e => {
              const r = e.currentTarget.getBoundingClientRect()
              setTooltip({ x: r.left + r.width / 2, y: r.top, date: d, data: v })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <td style={tdS}>{d}</td>
            <td style={{ ...tdS, textAlign: 'right', fontWeight: 700 }}>{v.calculations}</td>
            <td style={{ ...tdS, textAlign: 'right' }}>{v.kakao_shares}</td>
            <td style={{ ...tdS, textAlign: 'right' }}>{v.referral_visits}</td>
            <td style={{ ...tdS, textAlign: 'right' }}>{v.signups}</td>
          </tr>
        ))}
        <tr style={{ borderTop: '2px solid #E5E8EB', background: '#FAFBFC' }}>
          <td style={{ ...tdS, fontWeight: 800 }}>합계</td>
          <td style={{ ...tdS, textAlign: 'right', fontWeight: 800, color: ACCENT }}>{totals.calculations}</td>
          <td style={{ ...tdS, textAlign: 'right', fontWeight: 800 }}>{totals.kakao_shares}</td>
          <td style={{ ...tdS, textAlign: 'right', fontWeight: 800 }}>{totals.referral_visits}</td>
          <td style={{ ...tdS, textAlign: 'right', fontWeight: 800 }}>{totals.signups}</td>
        </tr>
      </tbody>
    </table>
    {tooltip && (
      <div style={{
        position: 'fixed', left: tooltip.x, top: tooltip.y - 8,
        transform: 'translate(-50%, -100%)',
        background: '#fff', borderRadius: 12,
        boxShadow: '0 8px 28px rgba(0,0,0,0.12)', border: '1px solid #E5E8EB',
        padding: '12px 16px', zIndex: 1000, pointerEvents: 'none', minWidth: 196,
      }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#1B1E28', margin: '0 0 8px' }}>📅 {tooltip.date}</p>
        <TipRow emoji="📊" label="계산 요청" value={`${tooltip.data.calculations}건`} />
        <TipRow emoji="📤" label="카카오 공유" value={`${tooltip.data.kakao_shares}건`} />
        <TipRow emoji="🔗" label="공유 유입" value={`${tooltip.data.referral_visits}건`} />
        <TipRow emoji="✅" label="회원가입" value={`${tooltip.data.signups}건`} />
      </div>
    )}
  </>
}

function RecordsTable({ records }: { records: AdminData['recentCalcs'] }) {
  if (!records.length) return <Empty />
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
    <thead><tr style={{ borderBottom: '2px solid #F2F4F6' }}>{['시간', '모드', '업종', '결과', '위험도', '로그인'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
    <tbody>{records.map(r => {
      const d = DANGER_META[r.danger_level] ?? { emoji: '❓', label: '?', color: '#CBD5E1' }; const t = new Date(r.created_at)
      return <tr key={r.id} style={{ borderBottom: '1px solid #F8F9FB' }}>
        <td style={tdS}>{t.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {t.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</td>
        <td style={tdS}><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: r.mode === 'business' ? '#EEF2FF' : '#FFF4EE', color: r.mode === 'business' ? '#3730A3' : '#C2410C' }}>{r.mode === 'business' ? '자영업' : '직장인'}</span></td>
        <td style={tdS}>{r.industry_type ? (INDUSTRY_LABELS[r.industry_type] ?? r.industry_type) : '-'}</td>
        <td style={{ ...tdS, fontWeight: 800, color: '#1B1E28' }}>{r.result_days != null ? `${r.result_days.toLocaleString()}일` : '∞'}</td>
        <td style={tdS}><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: `${d.color}18`, color: d.color }}>{d.emoji} {d.label}</span></td>
        <td style={tdS}>{r.user_id ? '✅' : '—'}</td>
      </tr>
    })}</tbody>
  </table></div>
}

function Empty() { return <p style={{ fontSize: 13, color: '#8B95A1', textAlign: 'center', padding: '30px 0' }}>데이터가 아직 없어요</p> }
function TipRow({ emoji, label, value, valueColor }: { emoji: string; label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '3px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 11 }}>{emoji}</span>
        <span style={{ fontSize: 12, color: '#8B95A1' }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: valueColor ?? '#1B1E28' }}>{value}</span>
    </div>
  )
}
const thS: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', fontWeight: 700, color: '#8B95A1', fontSize: 11, whiteSpace: 'nowrap' }
const tdS: React.CSSProperties = { padding: '11px 8px', color: '#4E5968', whiteSpace: 'nowrap' }

function StatCard({ label, value, color, icon, sub }: { label: string; value: string; color: string; icon: string; sub?: string }) {
  return <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E8EB', padding: '20px 20px 18px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: '#8B95A1', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 18 }}>{icon}</span>
    </div>
    <p style={{ fontSize: 28, fontWeight: 900, color, margin: '0 0 2px', letterSpacing: '-1px' }}>{value}</p>
    {sub && <p style={{ fontSize: 11, color: '#B0B8C1', margin: 0 }}>{sub}</p>}
  </div>
}

function MetricRow({ label, value, icon, color, sub }: { label: string; value: string; icon: string; color: string; sub?: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F2F4F6' }}>
    <span style={{ fontSize: 16, marginRight: 10 }}>{icon}</span>
    <span style={{ fontSize: 13, color: '#4E5968', flex: 1 }}>{label}</span>
    <div style={{ textAlign: 'right' }}>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
      {sub && <p style={{ fontSize: 10, color: '#B0B8C1', margin: 0 }}>{sub}</p>}
    </div>
  </div>
}

function InsightCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  return <div style={{ padding: '18px', background: '#FAFBFC', borderRadius: 12, border: `1px solid ${color}22` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{title}</span>
    </div>
    <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{desc}</p>
  </div>
}

function ConversionFunnel({ totalCalcs, totalUsers, paidUsers }: { totalCalcs: number; totalUsers: number; paidUsers: number }) {
  const steps = [
    { label: '전체 계산 이용', value: totalCalcs, color: '#C7D2FE', textColor: PURPLE },
    { label: '카카오 로그인 가입', value: totalUsers, color: '#BFDBFE', textColor: ACCENT },
    { label: '유료 구독', value: paidUsers, color: '#BBF7D0', textColor: GREEN },
  ]
  const max = Math.max(totalCalcs, 1)
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
    {steps.map((s, i) => {
      const pct = Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)
      const convPct = i > 0 && steps[i - 1].value > 0 ? Math.round((s.value / steps[i - 1].value) * 100) : null
      return <div key={s.label}>
        {i > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0 6px 16px' }}>
          <div style={{ width: 1, height: 14, background: '#E5E8EB' }} />
          <span style={{ fontSize: 11, color: '#B0B8C1' }}>전환율 {convPct !== null ? `${convPct}%` : '–'}</span>
        </div>}
        <div style={{ position: 'relative', height: 52, borderRadius: 10, overflow: 'hidden', background: '#F2F4F6' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: s.color, transition: 'width 0.6s', borderRadius: 10 }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4E5968' }}>{s.label}</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: s.textColor }}>{s.value.toLocaleString()}{s.value === 0 && i === 2 ? ' 준비중' : ''}</span>
          </div>
        </div>
      </div>
    })}
  </div>
}
