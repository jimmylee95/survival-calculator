'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import KakaoLoginButton from '@/components/auth/KakaoLoginButton'
import {
  createFeedback,
  fetchFeedbacks,
  incrementFeedbackPaw,
  NotLoggedInError,
  type Feedback,
  type FeedbackCategory,
} from '@/lib/supabase/feedbacks'

const ACCENT      = '#22C55E'
const ACCENT_DARK = '#16A34A'

type CatMeta = { key: FeedbackCategory; emoji: string; label: string; color: string; bg: string }
const CATEGORIES: CatMeta[] = [
  { key: 'idea',    emoji: '💡', label: '아이디어',  color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  { key: 'bug',     emoji: '🐛', label: '불편해요',  color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { key: 'comment', emoji: '💬', label: '한마디',    color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  { key: 'like',    emoji: '❤️',  label: '좋아요',    color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' },
]
const CAT_MAP: Record<FeedbackCategory, CatMeta> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.key]: c }),
  {} as Record<FeedbackCategory, CatMeta>,
)

const PAW_LS_KEY = 'feedback_pawed_ids_v1'
const LAST_SUBMIT_LS_KEY = 'feedback_last_submit_v1'
const SUBMIT_COOLDOWN_MS = 60_000

function timeAgo(iso: string): string {
  const now = Date.now()
  const t   = new Date(iso).getTime()
  const diff = Math.max(0, now - t)
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function CommunityPage() {
  // ── 로그인 상태 ────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user))
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (_, session) => setIsLoggedIn(!!session?.user),
    )
    return () => subscription.unsubscribe()
  }, [])

  // ── 입력 폼 상태 ──────────────────────────────────────
  const [category, setCategory] = useState<FeedbackCategory>('comment')
  const [content, setContent]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── 리스트 상태 ────────────────────────────────────────
  const [filter, setFilter]     = useState<FeedbackCategory | 'all'>('all')
  const [items, setItems]       = useState<Feedback[]>([])
  const [loading, setLoading]   = useState(false)
  const [hasMore, setHasMore]   = useState(false)
  const [cursor, setCursor]     = useState<string | undefined>(undefined)
  const [listError, setListError] = useState<string | null>(null)

  // ── 공감 기록 (localStorage) ───────────────────────────
  const [pawed, setPawed] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PAW_LS_KEY)
      if (raw) setPawed(new Set(JSON.parse(raw)))
    } catch { /* ignore */ }
  }, [])

  const loadInitial = useCallback(async (cat: FeedbackCategory | 'all') => {
    setLoading(true)
    setListError(null)
    try {
      const { rows, hasMore } = await fetchFeedbacks({ category: cat })
      setItems(rows)
      setHasMore(hasMore)
      setCursor(rows.length > 0 ? rows[rows.length - 1].created_at : undefined)
    } catch (e) {
      setListError((e as Error).message ?? '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitial(filter)
  }, [filter, loadInitial])

  async function loadMore() {
    if (loading || !hasMore || !cursor) return
    setLoading(true)
    try {
      const { rows, hasMore: more } = await fetchFeedbacks({ category: filter, cursor })
      setItems(prev => [...prev, ...rows])
      setHasMore(more)
      if (rows.length > 0) setCursor(rows[rows.length - 1].created_at)
    } catch (e) {
      setListError((e as Error).message ?? '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    setSubmitError(null)
    const trimmed = content.trim()
    if (trimmed.length < 3) {
      setSubmitError('3자 이상 입력해주세요')
      return
    }
    if (trimmed.length > 100) {
      setSubmitError('100자 이내로 작성해주세요')
      return
    }

    // 60초 쿨다운
    try {
      const last = localStorage.getItem(LAST_SUBMIT_LS_KEY)
      if (last) {
        const elapsed = Date.now() - parseInt(last, 10)
        if (elapsed < SUBMIT_COOLDOWN_MS) {
          const remain = Math.ceil((SUBMIT_COOLDOWN_MS - elapsed) / 1000)
          setSubmitError(`${remain}초 뒤에 다시 작성할 수 있어요`)
          return
        }
      }
    } catch { /* ignore */ }

    setSubmitting(true)
    try {
      const created = await createFeedback({ category, content: trimmed })
      setItems(prev => [created, ...prev])
      setContent('')
      localStorage.setItem(LAST_SUBMIT_LS_KEY, String(Date.now()))
    } catch (e) {
      if (e instanceof NotLoggedInError) {
        setSubmitError('로그인 후 이용해주세요')
        setIsLoggedIn(false)
      } else {
        setSubmitError((e as Error).message ?? '전송 실패')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePaw(id: string) {
    if (pawed.has(id)) return
    if (!isLoggedIn) {
      // 로그인 안내
      alert('공감은 로그인 후 이용할 수 있어요')
      return
    }
    // optimistic
    setItems(prev => prev.map(f => f.id === id ? { ...f, paw_count: f.paw_count + 1 } : f))
    const next = new Set(pawed); next.add(id); setPawed(next)
    try {
      localStorage.setItem(PAW_LS_KEY, JSON.stringify(Array.from(next)))
      await incrementFeedbackPaw(id)
    } catch (e) {
      // 롤백
      setItems(prev => prev.map(f => f.id === id ? { ...f, paw_count: Math.max(0, f.paw_count - 1) } : f))
      const back = new Set(pawed); back.delete(id); setPawed(back)
      if (e instanceof NotLoggedInError) {
        setIsLoggedIn(false)
        alert('공감은 로그인 후 이용할 수 있어요')
      }
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 60%)',
      paddingBottom: 80,
    }}>
      <div style={{
        width: '100%', maxWidth: 430, margin: '0 auto',
        padding: '20px 18px 0',
      }}>
        {/* 타이틀 */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontSize: 24, fontWeight: 900, color: '#0F172A',
            margin: '0 0 6px', letterSpacing: '-0.5px',
          }}>
            유저 이용후기
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            자유롭게 글을 남겨주세요
          </p>
        </div>

        {/* 입력 폼 — 로그인 유저만, 비로그인 시 로그인 CTA */}
        {isLoggedIn === false ? (
          <div style={{
            background: '#fff',
            borderRadius: 18,
            padding: '24px 18px',
            boxShadow: '0 6px 22px rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.15)',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 28, margin: '0 0 10px' }}>🔐</p>
            <p style={{ fontSize: 14, color: '#0F172A', margin: '0 0 18px', fontWeight: 700, lineHeight: 1.5 }}>
              로그인 후 글을 작성할 수 있습니다
            </p>
            <KakaoLoginButton redirectTo="/community" />
          </div>
        ) : isLoggedIn === true ? (
          <div style={{
            background: '#fff',
            borderRadius: 18,
            padding: '18px 16px',
            boxShadow: '0 6px 22px rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.15)',
            marginBottom: 24,
          }}>
            {/* 카테고리 선택 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => {
                const sel = category === c.key
                return (
                  <button key={c.key} onClick={() => setCategory(c.key)}
                    style={{
                      padding: '8px 12px', borderRadius: 999,
                      fontSize: 12, fontWeight: 800,
                      border: `1.5px solid ${sel ? c.color : '#E2E8F0'}`,
                      background: sel ? c.bg : '#fff',
                      color: sel ? c.color : '#64748B',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    <span>{c.emoji}</span>
                    <span>{c.label}</span>
                  </button>
                )
              })}
            </div>

            {/* 내용 */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, 100))}
              placeholder="내용을 입력해주세요"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #E2E8F0',
                fontSize: 14, fontWeight: 500,
                color: '#0F172A', outline: 'none',
                resize: 'none',
                marginBottom: 6,
                boxSizing: 'border-box',
                lineHeight: 1.5,
                fontFamily: 'inherit',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = ACCENT }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0' }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 11, color: '#94A3B8', marginBottom: 12,
            }}>
              <span style={{ color: submitError ? '#EF4444' : '#94A3B8' }}>
                {submitError ?? '3자 이상 100자 이내'}
              </span>
              <span>{content.length}/100</span>
            </div>
            <button onClick={handleSubmit} disabled={submitting || content.trim().length < 3}
              style={{
                width: '100%', height: 46, borderRadius: 12,
                border: 'none',
                background: submitting || content.trim().length < 3 ? '#E2E8F0' : ACCENT,
                color: '#fff',
                fontSize: 14, fontWeight: 800,
                cursor: submitting || content.trim().length < 3 ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.2px',
                boxShadow: submitting || content.trim().length < 3 ? 'none' : `0 4px 14px ${ACCENT}30`,
              }}>
              {submitting ? '등록 중…' : '등록'}
            </button>
          </div>
        ) : (
          // 초기 로딩 (auth 체크 중) — 스켈레톤 자리 차지용
          <div style={{ height: 240, marginBottom: 24 }} />
        )}

        {/* 리스트 필터 */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 14,
          overflowX: 'auto', padding: '0 0 6px',
          scrollbarWidth: 'none',
        }}>
          {(['all', 'idea', 'bug', 'comment', 'like'] as const).map(key => {
            const sel = filter === key
            const meta = key === 'all' ? null : CAT_MAP[key]
            return (
              <button key={key} onClick={() => setFilter(key)}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px', borderRadius: 999,
                  border: 'none',
                  background: sel ? ACCENT : '#F1F5F9',
                  color: sel ? '#fff' : '#64748B',
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                {meta && <span>{meta.emoji}</span>}
                <span>{key === 'all' ? '전체' : meta!.label}</span>
              </button>
            )
          })}
        </div>

        {/* 리스트 */}
        {listError && (
          <p style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', padding: '20px 0' }}>
            {listError}
          </p>
        )}

        {!loading && !listError && items.length === 0 && (
          <div style={{
            padding: '48px 20px', textAlign: 'center',
            background: '#fff', borderRadius: 16,
            border: '1.5px dashed #E2E8F0',
          }}>
            <p style={{ fontSize: 28, margin: '0 0 8px' }}>📝</p>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, fontWeight: 700, lineHeight: 1.5 }}>
              아직 작성된 글이 없습니다.<br />
              첫 번째 글을 남겨보세요!
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(f => {
            const meta = CAT_MAP[f.category]
            const isPawed = pawed.has(f.id)
            return (
              <div key={f.id} style={{
                background: '#fff',
                borderRadius: 14,
                padding: '14px 14px 12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #F1F5F9',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 8, flexWrap: 'wrap',
                }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: 999,
                    fontSize: 11, fontWeight: 800,
                    background: meta.bg, color: meta.color,
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}>
                    <span>{meta.emoji}</span><span>{meta.label}</span>
                  </span>
                  {f.avatar_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={f.avatar_url} alt="" width={20} height={20}
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                      referrerPolicy="no-referrer" />
                  )}
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>
                    {f.nickname}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>
                    {timeAgo(f.created_at)}
                  </span>
                </div>
                <p style={{
                  fontSize: 14, color: '#0F172A', margin: '0 0 10px',
                  lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {f.content}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handlePaw(f.id)} disabled={isPawed}
                    style={{
                      padding: '6px 12px', borderRadius: 999,
                      border: `1.5px solid ${isPawed ? ACCENT : '#E2E8F0'}`,
                      background: isPawed ? `${ACCENT}14` : '#fff',
                      color: isPawed ? ACCENT_DARK : '#64748B',
                      fontSize: 12, fontWeight: 800,
                      cursor: isPawed ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                    <span>🐾</span>
                    <span>{f.paw_count}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {hasMore && (
          <button onClick={loadMore} disabled={loading}
            style={{
              marginTop: 16, width: '100%', height: 44,
              borderRadius: 12,
              border: '1.5px solid #E2E8F0',
              background: '#fff',
              color: '#475569',
              fontSize: 13, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
            }}>
            {loading ? '불러오는 중…' : '더 보기'}
          </button>
        )}

        {loading && items.length === 0 && (
          <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>
            불러오는 중…
          </p>
        )}
      </div>
    </div>
  )
}
