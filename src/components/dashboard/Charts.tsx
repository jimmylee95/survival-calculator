'use client'

import { useId, useState } from 'react'

const W     = 360
const PAD_L = 40
const PAD_R = 14
const PAD_T = 16
const PAD_B = 28

/* ── 유틸 ─────────────────────────────────────────────── */

/** 5_300_000 → "530만", 1_200_000_000 → "12억" */
export function formatShort(n: number): string {
  if (n === 0) return '0'
  const sign = n < 0 ? '-' : ''
  const abs  = Math.abs(n)
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000)      return `${sign}${Math.round(abs / 10_000).toLocaleString()}만`
  if (abs >= 1_000)       return `${sign}${(abs / 1_000).toFixed(1)}천`
  return `${sign}${abs.toLocaleString()}`
}

/** "2026-05-08" 또는 ISO → "5/8" */
function fmtDayMonth(s: string): string {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** "2026-05-08" 또는 ISO → "5월 8일" */
function fmtDateLong(s: string): string {
  const d = new Date(s)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** Catmull-Rom → Cubic Bezier 보간 path */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`

  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function ChartEmpty({ height, message }: { height: number; message: string }) {
  return (
    <div style={{
      height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
    }}>
      <p style={{
        fontSize: 13, color: '#94A3B8', textAlign: 'center',
        lineHeight: 1.6, margin: 0, fontWeight: 600,
      }}>
        {message}
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TrendChart — 라인 + 영역 + 옵션 타겟선
   ═══════════════════════════════════════════════════════════ */
export interface TrendPoint { date: string; value: number }

interface TrendChartProps {
  points:        TrendPoint[]
  height?:       number
  unit?:         string
  lineColor?:    string
  fillTop?:      string  // 그라데이션 상단 색
  fillBottom?:   string  // 그라데이션 하단 색
  targetValue?:  number
  targetLabel?:  string
  emptyMessage:  string
  formatValue?:  (v: number) => string
}

export function TrendChart({
  points, height = 200, unit = '',
  lineColor = '#3182F6',
  fillTop, fillBottom,
  targetValue, targetLabel,
  emptyMessage,
  formatValue,
}: TrendChartProps) {
  const id = useId()
  const [active, setActive] = useState<number | null>(null)

  if (points.length < 2) return <ChartEmpty height={height} message={emptyMessage} />

  const ch = height - PAD_T - PAD_B
  const cw = W - PAD_L - PAD_R

  const values = points.map(p => p.value)
  const targetClamped = targetValue ?? null
  let yMin = Math.min(...values, ...(targetClamped != null ? [targetClamped] : []))
  let yMax = Math.max(...values, ...(targetClamped != null ? [targetClamped] : []))
  if (yMin === yMax) { yMin -= 1; yMax += 1 }
  const range0 = yMax - yMin
  yMin -= range0 * 0.1
  yMax += range0 * 0.15
  const rangeP = yMax - yMin

  const yPx = (v: number) => PAD_T + (1 - (v - yMin) / rangeP) * ch
  const xPx = (i: number) => PAD_L + (i / Math.max(points.length - 1, 1)) * cw

  const xy     = points.map((p, i) => ({ x: xPx(i), y: yPx(p.value) }))
  const lineD  = smoothPath(xy)
  const areaD  = `${lineD} L ${xy[xy.length - 1].x} ${PAD_T + ch} L ${xy[0].x} ${PAD_T + ch} Z`

  const yTicks = [
    yMin + rangeP * 0.15,
    (yMin + yMax) / 2,
    yMax - rangeP * 0.15,
  ]
  const xLabelIdx = points.length <= 4
    ? points.map((_, i) => i)
    : [0, Math.floor((points.length - 1) / 2), points.length - 1]

  const top    = fillTop    ?? lineColor
  const bottom = fillBottom ?? lineColor

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        width="100%" height={height}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`tg-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={top}    stopOpacity="0.35" />
            <stop offset="100%" stopColor={bottom} stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* 그리드 */}
        {yTicks.map((t, i) => (
          <line key={i}
            x1={PAD_L} x2={W - PAD_R} y1={yPx(t)} y2={yPx(t)}
            stroke="#F1F5F9" strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* 타겟선 */}
        {targetClamped != null && (
          <line
            x1={PAD_L} x2={W - PAD_R}
            y1={yPx(targetClamped)} y2={yPx(targetClamped)}
            stroke="#94A3B8" strokeWidth={1} strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* 영역 */}
        <path d={areaD} fill={`url(#tg-${id})`} />

        {/* 라인 */}
        <path
          d={lineD} fill="none" stroke={lineColor}
          strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* 히트 영역 */}
        {xy.map((pt, i) => {
          const left  = i === 0 ? PAD_L : (xy[i - 1].x + pt.x) / 2
          const right = i === xy.length - 1 ? W - PAD_R : (pt.x + xy[i + 1].x) / 2
          return (
            <rect key={i}
              x={left} y={PAD_T} width={right - left} height={ch}
              fill="transparent"
              onClick={() => setActive(active === i ? null : i)}
              style={{ cursor: 'pointer' }}
            />
          )
        })}

        {/* Y축 라벨 */}
        {yTicks.map((t, i) => (
          <text key={i}
            x={PAD_L - 6} y={yPx(t) + 3}
            fontSize={9} fill="#94A3B8" textAnchor="end"
          >
            {formatValue ? formatValue(t) : Math.round(t).toLocaleString()}
          </text>
        ))}

        {/* X축 라벨 */}
        {xLabelIdx.map(i => (
          <text key={i}
            x={xy[i].x} y={height - 8}
            fontSize={9} fill="#94A3B8" textAnchor="middle"
          >
            {fmtDayMonth(points[i].date)}
          </text>
        ))}
      </svg>

      {/* 마커 (DOM — 비왜곡) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {xy.map((pt, i) => {
          const isActive = active === i
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${(pt.x / W) * 100}%`,
              top:  `${(pt.y / height) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width:  isActive ? 12 : 7,
              height: isActive ? 12 : 7,
              borderRadius: '50%',
              background: isActive ? lineColor : '#fff',
              border: `2px solid ${lineColor}`,
              boxShadow: isActive ? `0 2px 10px ${lineColor}80` : 'none',
              transition: 'all 0.15s',
            }} />
          )
        })}
      </div>

      {/* 타겟 라벨 */}
      {targetClamped != null && targetLabel && (
        <div style={{
          position: 'absolute',
          right: 12,
          top:   `${(yPx(targetClamped) / height) * 100}%`,
          transform: 'translateY(-100%)',
          fontSize: 10, fontWeight: 800, color: '#64748B',
          background: 'rgba(255,255,255,0.92)',
          padding: '2px 6px', borderRadius: 4,
          pointerEvents: 'none',
        }}>
          {targetLabel}
        </div>
      )}

      {/* 툴팁 */}
      {active !== null && (
        <div style={{
          position: 'absolute',
          left: `${(xy[active].x / W) * 100}%`,
          top:  `${(xy[active].y / height) * 100}%`,
          transform: 'translate(-50%, calc(-100% - 16px))',
          background: '#0F172A', color: '#fff',
          padding: '8px 12px', borderRadius: 10,
          whiteSpace: 'nowrap', textAlign: 'center',
          pointerEvents: 'none',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          zIndex: 5,
        }}>
          <div style={{ opacity: 0.7, fontSize: 10, marginBottom: 2, fontWeight: 700 }}>
            {fmtDateLong(points[active].date)}
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.3px' }}>
            {formatValue
              ? formatValue(points[active].value)
              : points[active].value.toLocaleString()}
            {unit}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   RevenueExpenseChart — 매출/지출 바 + 순이익 라인
   ═══════════════════════════════════════════════════════════ */
export interface BarPoint {
  date:    string
  revenue: number
  expense: number
}

interface RxChartProps {
  points:       BarPoint[]
  height?:      number
  emptyMessage: string
}

export function RevenueExpenseChart({
  points, height = 200, emptyMessage,
}: RxChartProps) {
  const [active, setActive] = useState<number | null>(null)

  const hasAny = points.some(p => p.revenue > 0 || p.expense > 0)
  if (!hasAny || points.length === 0) {
    return <ChartEmpty height={height} message={emptyMessage} />
  }

  const ch = height - PAD_T - PAD_B
  const cw = W - PAD_L - PAD_R

  const profits = points.map(p => p.revenue - p.expense)
  const allVals = [...points.flatMap(p => [p.revenue, p.expense]), ...profits, 0]
  let yMin = Math.min(...allVals)
  let yMax = Math.max(...allVals)
  if (yMin === yMax) { yMin -= 1; yMax += 1 }
  const range0 = yMax - yMin
  yMin -= range0 * 0.05
  yMax += range0 * 0.15
  const rangeP = yMax - yMin

  const yPx    = (v: number) => PAD_T + (1 - (v - yMin) / rangeP) * ch
  const slotW  = cw / points.length
  const barGap = 2
  const barW   = Math.max((slotW - 6 - barGap) / 2, 3)
  const zeroY  = yPx(0)

  const bars = points.map((p, i) => {
    const slotCenter = PAD_L + (i + 0.5) * slotW
    const revX  = slotCenter - barGap / 2 - barW
    const expX  = slotCenter + barGap / 2
    return {
      i,
      slotCenter,
      revX, expX,
      revY: yPx(p.revenue),
      expY: yPx(p.expense),
      revH: Math.abs(zeroY - yPx(p.revenue)),
      expH: Math.abs(zeroY - yPx(p.expense)),
      profitY: yPx(p.revenue - p.expense),
    }
  })

  const profitLineD = bars
    .map((b, i) => `${i === 0 ? 'M' : 'L'} ${b.slotCenter} ${b.profitY}`)
    .join(' ')

  const xLabelIdx = points.length <= 5
    ? points.map((_, i) => i)
    : [0, Math.floor((points.length - 1) / 2), points.length - 1]

  const yTicks = [
    yMin + rangeP * 0.2,
    (yMin + yMax) / 2,
    yMax - rangeP * 0.15,
  ]

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        width="100%" height={height}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* 그리드 */}
        {yTicks.map((t, i) => (
          <line key={i}
            x1={PAD_L} x2={W - PAD_R} y1={yPx(t)} y2={yPx(t)}
            stroke="#F1F5F9" strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* 0 기준선 */}
        <line
          x1={PAD_L} x2={W - PAD_R} y1={zeroY} y2={zeroY}
          stroke="#CBD5E1" strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />

        {/* 바 */}
        {bars.map((b, i) => {
          const dimmed = active !== null && active !== i
          return (
            <g key={i}>
              <rect
                x={b.revX} y={Math.min(b.revY, zeroY)}
                width={barW} height={b.revH}
                fill="#3182F6" rx={2}
                opacity={dimmed ? 0.35 : 1}
              />
              <rect
                x={b.expX} y={Math.min(b.expY, zeroY)}
                width={barW} height={b.expH}
                fill="#E53E3E" rx={2}
                opacity={dimmed ? 0.35 : 1}
              />
            </g>
          )
        })}

        {/* 순이익 라인 */}
        <path
          d={profitLineD} fill="none" stroke="#1A1F5E"
          strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />

        {/* 히트 영역 */}
        {points.map((_, i) => (
          <rect key={i}
            x={PAD_L + i * slotW} y={PAD_T}
            width={slotW} height={ch}
            fill="transparent"
            onClick={() => setActive(active === i ? null : i)}
            style={{ cursor: 'pointer' }}
          />
        ))}

        {/* Y축 라벨 */}
        {yTicks.map((t, i) => (
          <text key={i}
            x={PAD_L - 6} y={yPx(t) + 3}
            fontSize={9} fill="#94A3B8" textAnchor="end"
          >
            {formatShort(Math.round(t))}
          </text>
        ))}

        {/* X축 라벨 */}
        {xLabelIdx.map(i => (
          <text key={i}
            x={PAD_L + (i + 0.5) * slotW} y={height - 8}
            fontSize={9} fill="#94A3B8" textAnchor="middle"
          >
            {fmtDayMonth(points[i].date)}
          </text>
        ))}
      </svg>

      {/* 순이익 점 (DOM) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {bars.map((b, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(b.slotCenter / W) * 100}%`,
            top:  `${(b.profitY  / height) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 6, height: 6, borderRadius: '50%',
            background: '#1A1F5E', border: '1.5px solid #fff',
          }} />
        ))}
      </div>

      {/* 범례 */}
      <div style={{
        display: 'flex', gap: 14, marginTop: 8, fontSize: 11,
        color: '#64748B', fontWeight: 700, justifyContent: 'center',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, background: '#3182F6', borderRadius: 1 }} />
          매출
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, background: '#E53E3E', borderRadius: 1 }} />
          지출
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 14, height: 0,
            borderTop: '1.5px dashed #1A1F5E',
          }} />
          순이익
        </span>
      </div>

      {/* 툴팁 */}
      {active !== null && (() => {
        const p = points[active]
        const profit = p.revenue - p.expense
        const top = Math.min(bars[active].revY, bars[active].expY, bars[active].profitY)
        return (
          <div style={{
            position: 'absolute',
            left: `${(bars[active].slotCenter / W) * 100}%`,
            top:  `${(top / height) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 16px))',
            background: '#0F172A', color: '#fff',
            padding: '8px 12px', borderRadius: 10,
            whiteSpace: 'nowrap', textAlign: 'left',
            pointerEvents: 'none',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            zIndex: 5,
          }}>
            <div style={{ opacity: 0.7, fontSize: 10, marginBottom: 4, fontWeight: 700 }}>
              {fmtDateLong(p.date)}
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'auto auto', gap: '3px 14px',
              fontSize: 11, fontWeight: 800,
            }}>
              <span style={{ color: '#90CDF4' }}>매출</span>
              <span style={{ textAlign: 'right' }}>{formatShort(p.revenue)}</span>
              <span style={{ color: '#FEB2B2' }}>지출</span>
              <span style={{ textAlign: 'right' }}>{formatShort(p.expense)}</span>
              <span style={{ color: '#A0AEC0' }}>순이익</span>
              <span style={{
                textAlign: 'right',
                color: profit >= 0 ? '#9AE6B4' : '#FEB2B2',
              }}>
                {profit >= 0 ? '+' : ''}{formatShort(profit)}
              </span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
