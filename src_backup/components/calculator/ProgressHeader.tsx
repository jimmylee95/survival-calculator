'use client'

import { useRouter } from 'next/navigation'

interface Props {
  step:       number
  totalSteps: number
  title:      string
  accent:     string
}

export function ProgressHeader({ step, totalSteps, title, accent }: Props) {
  const router = useRouter()
  const pct    = (step / totalSteps) * 100

  return (
    <div style={{
      position:     'sticky',
      top:          0,
      zIndex:       20,
      background:   '#fff',
      borderBottom: '1px solid #F1F5F9',
    }}>
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '14px 20px 12px',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background:   'none',
            border:       'none',
            fontSize:     22,
            color:        '#64748B',
            cursor:       'pointer',
            padding:      '0 4px',
            lineHeight:   1,
          }}
        >
          ←
        </button>

        <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E' }}>
          {title}
        </span>

        <span style={{
          fontSize:     13,
          fontWeight:   700,
          color:        accent,
          background:   `${accent}15`,
          borderRadius: 20,
          padding:      '3px 10px',
        }}>
          {step}/{totalSteps}
        </span>
      </div>

      {/* 진행 바 */}
      <div style={{ height: 3, background: '#F1F5F9' }}>
        <div style={{
          height:     '100%',
          width:      `${pct}%`,
          background: accent,
          transition: 'width 0.4s ease',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>
    </div>
  )
}
