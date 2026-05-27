'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Category = 'idea' | 'bug' | 'comment' | 'like'

type Feedback = {
  id:          string
  user_id:     string | null
  nickname:    string
  avatar_url:  string | null
  category:    Category
  content:     string
  paw_count:   number
  created_at:  string
}

type Stats = {
  total:      number
  todayCount: number
  byCategory: Record<Category, number>
  last7Days:  { date: string; count: number }[]
}

const CAT_META: Record<Category, { emoji: string; label: string; color: string; bg: string }> = {
  idea:    { emoji: '💡', label: '아이디어', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  bug:     { emoji: '🐛', label: '불편해요', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  comment: { emoji: '💬', label: '한마디',   color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  like:    { emoji: '❤️',  label: '좋아요',   color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' },
}
const CATEGORIES: ('all' | Category)[] = ['all', 'idea', 'bug', 'comment', 'like']

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function BoardSection({ secret }: { secret: string }) {
  const [items, setItems]       = useState<Feedback[]>([])
  const [stats, setStats]       = useState<Stats | null>(null)
  const [filter, setFilter]     = useState<'all' | Category>('all')
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [hasMore, setHasMore]   = useState(false)
  const [cursor, setCursor]     = useState<string | undefined>(undefined)
  const [error, setError]       = useState<string | null>(null)
  const [newCount, setNewCount] = useState(0)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPage = useCallback(async (opts: { reset: boolean }) => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ secret })
      if (filter !== 'all') params.set('category', filter)
      if (query.trim())     params.set('q', query.trim())
      if (!opts.reset && cursor) params.set('cursor', cursor)

      const res = await fetch(`/api/admin/feedbacks?${params}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as { items: Feedback[]; hasMore: boolean; stats: Stats | null }

      setItems(prev => opts.reset ? data.items : [...prev, ...data.items])
      setHasMore(data.hasMore)
      if (data.items.length > 0) setCursor(data.items[data.items.length - 1].created_at)
      if (data.stats) setStats(data.stats)
      if (opts.reset) setNewCount(0)
    } catch (e) {
      setError((e as Error).message ?? '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }, [secret, filter, query, cursor])

  // 필터/검색 변경 시 첫 페이지 재조회 (검색은 debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setCursor(undefined)
      fetchPage({ reset: true })
    }, query ? 300 : 0)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query])

  // 실시간 INSERT 구독 — 새 글 카운터만 증가
  useEffect(() => {
    const sb = createClient()
    const ch = sb
      .channel('admin-feedbacks-insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedbacks' },
        () => setNewCount(n => n + 1),
      )
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [])

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/feedbacks?secret=${encodeURIComponent(secret)}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      setItems(prev => prev.filter(f => f.id !== id))
      setStats(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev)
      setConfirmId(null)
    } catch (e) {
      alert((e as Error).message ?? '삭제 실패')
    } finally {
      setDeleting(false)
    }
  }

  function refresh() {
    setCursor(undefined)
    fetchPage({ reset: true })
  }

  const last7Max = useMemo(
    () => Math.max(1, ...(stats?.last7Days.map(d => d.count) ?? [1])),
    [stats],
  )
  const catTotal = useMemo(
    () => stats ? Object.values(stats.byCategory).reduce((a, b) => a + b, 0) : 0,
    [stats],
  )

  const confirmTarget = items.find(f => f.id === confirmId)

  return (
    <div>
      {/* 상단 통계 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1B1E28', margin: 0 }}>📝 게시판 관리</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {newCount > 0 && (
            <button onClick={refresh}
              style={{
                padding: '8px 14px', borderRadius: 10,
                border: 'none', background: '#FF6B35', color: '#fff',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}>
              🔔 새 글 {newCount}건 — 새로고침
            </button>
          )}
          <button onClick={refresh} disabled={loading}
            style={{
              padding: '8px 14px', borderRadius: 10,
              border: 'none', background: 'rgba(0,0,0,0.06)', color: '#4E5968',
              fontSize: 12, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            }}>
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="전체 글" value={stats ? stats.total.toLocaleString() : '—'} emoji="📄" />
        <StatCard label="오늘 작성" value={stats ? `${stats.todayCount}건` : '—'} emoji="📅" accent />
        <CategoryRatio stats={stats} catTotal={catTotal} />
        <Trend7Days stats={stats} max={last7Max} />
      </div>

      {/* 검색 / 필터 */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: 12,
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginBottom: 16,
      }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="내용 또는 닉네임 검색"
          style={{
            flex: '1 1 240px', minWidth: 200, height: 36,
            border: '1px solid #E5E8EB', borderRadius: 8,
            padding: '0 12px', fontSize: 13, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => {
            const sel = filter === c
            const meta = c === 'all' ? null : CAT_META[c]
            return (
              <button key={c} onClick={() => setFilter(c)}
                style={{
                  height: 36, padding: '0 12px', borderRadius: 8,
                  border: 'none',
                  background: sel ? '#1B1E28' : '#F2F4F6',
                  color: sel ? '#fff' : '#4E5968',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                {meta && <span>{meta.emoji}</span>}
                <span>{c === 'all' ? '전체' : meta!.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 리스트 */}
      {error && (
        <p style={{ fontSize: 13, color: '#EF4444', padding: 16, background: '#FEF2F2', borderRadius: 10 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(f => {
          const meta = CAT_META[f.category]
          return (
            <div key={f.id} style={{
              background: '#fff', borderRadius: 10,
              padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999,
                    fontSize: 11, fontWeight: 800,
                    background: meta.bg, color: meta.color,
                  }}>
                    {meta.emoji} {meta.label}
                  </span>
                  {f.avatar_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={f.avatar_url} alt="" width={18} height={18}
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                      referrerPolicy="no-referrer" />
                  )}
                  <span style={{ fontSize: 12, color: '#4E5968', fontWeight: 700 }}>{f.nickname}</span>
                  <span style={{ fontSize: 11, color: '#8B95A1' }}>· {fmtTime(f.created_at)}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#16A34A',
                    background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 999,
                  }}>
                    🐾 {f.paw_count}
                  </span>
                </div>
                <p style={{
                  fontSize: 13.5, color: '#1B1E28', margin: 0,
                  lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {f.content}
                </p>
              </div>
              <button onClick={() => setConfirmId(f.id)}
                style={{
                  flexShrink: 0,
                  padding: '6px 10px', borderRadius: 8,
                  border: '1px solid #FECACA', background: '#FEF2F2',
                  color: '#DC2626', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                }}>
                삭제
              </button>
            </div>
          )
        })}
      </div>

      {!loading && items.length === 0 && !error && (
        <div style={{
          padding: '60px 20px', textAlign: 'center',
          background: '#fff', borderRadius: 10,
        }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>📭</p>
          <p style={{ fontSize: 13, color: '#8B95A1', margin: 0, fontWeight: 600 }}>
            조건에 맞는 글이 없습니다
          </p>
        </div>
      )}

      {hasMore && (
        <button onClick={() => fetchPage({ reset: false })} disabled={loading}
          style={{
            marginTop: 12, width: '100%', height: 40, borderRadius: 10,
            border: '1px solid #E5E8EB', background: '#fff', color: '#4E5968',
            fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
          }}>
          {loading ? '불러오는 중…' : '더 보기'}
        </button>
      )}

      {/* 삭제 확인 모달 */}
      {confirmTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
          onClick={() => !deleting && setConfirmId(null)}>
          <div style={{
            background: '#fff', borderRadius: 14,
            padding: '22px 22px 18px', maxWidth: 420, width: '100%',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px', color: '#1B1E28' }}>
              이 글을 삭제할까요?
            </h3>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 14px' }}>
              삭제하면 되돌릴 수 없어요.
            </p>
            <div style={{
              padding: 12, borderRadius: 10, background: '#F8FAFC',
              border: '1px solid #E5E8EB', marginBottom: 16,
              fontSize: 13, lineHeight: 1.5, color: '#1B1E28',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              maxHeight: 160, overflowY: 'auto',
            }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 700 }}>
                {confirmTarget.nickname} · {fmtTime(confirmTarget.created_at)}
              </div>
              {confirmTarget.content}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmId(null)} disabled={deleting}
                style={{
                  flex: 1, height: 42, borderRadius: 10,
                  border: '1px solid #E5E8EB', background: '#fff', color: '#4E5968',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                취소
              </button>
              <button onClick={() => handleDelete(confirmTarget.id)} disabled={deleting}
                style={{
                  flex: 1.2, height: 42, borderRadius: 10,
                  border: 'none', background: '#DC2626', color: '#fff',
                  fontSize: 13, fontWeight: 800, cursor: deleting ? 'default' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}>
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───── 보조 UI ─────────────────────────────────── */

function StatCard({ label, value, emoji, accent }: { label: string; value: string; emoji: string; accent?: boolean }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '14px 16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      borderLeft: accent ? '3px solid #FF6B35' : '3px solid transparent',
    }}>
      <p style={{ fontSize: 11, color: '#6B7280', margin: 0, fontWeight: 600 }}>{emoji} {label}</p>
      <p style={{ fontSize: 24, fontWeight: 900, color: '#1B1E28', margin: '4px 0 0' }}>{value}</p>
    </div>
  )
}

function CategoryRatio({ stats, catTotal }: { stats: Stats | null; catTotal: number }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 10px', fontWeight: 600 }}>📊 카테고리 비율</p>
      {stats && catTotal > 0 ? (
        <>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            {(Object.keys(CAT_META) as Category[]).map(c => {
              const pct = (stats.byCategory[c] / catTotal) * 100
              if (pct === 0) return null
              return <div key={c} style={{ width: `${pct}%`, background: CAT_META[c].color }} />
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: 10, fontWeight: 700 }}>
            {(Object.keys(CAT_META) as Category[]).map(c => (
              <span key={c} style={{ color: CAT_META[c].color }}>
                {CAT_META[c].emoji}{stats.byCategory[c]}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>—</p>
      )}
    </div>
  )
}

function Trend7Days({ stats, max }: { stats: Stats | null; max: number }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>📈 최근 7일</p>
      {stats ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40 }}>
          {stats.last7Days.map(d => (
            <div key={d.date}
              title={`${d.date.slice(5)} · ${d.count}건`}
              style={{
                flex: 1,
                height: `${Math.max(6, (d.count / max) * 100)}%`,
                background: '#3B82F6', borderRadius: 3,
                transition: 'height 0.3s',
              }} />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>—</p>
      )}
    </div>
  )
}
