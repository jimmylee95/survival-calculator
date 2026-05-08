import { formatDays, getDangerLevel } from '@/utils/calculate'

interface ScenarioItem {
  label:    string
  sublabel: string
  days:     number
}

interface Props {
  items: [ScenarioItem, ScenarioItem, ScenarioItem]
}

const DANGER_COLORS: Record<string, string> = {
  critical: '#FC8181',
  warning:  '#F6AD55',
  caution:  '#ECC94B',
  safe:     '#68D391',
  infinite: '#63B3ED',
}

export function ScenarioCard({ items }: Props) {
  return (
    <div style={{
      background:   '#fff',
      borderRadius: 20,
      overflow:     'hidden',
      boxShadow:    '0 2px 16px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        padding:     '16px 20px 12px',
        borderBottom: '1px solid #F1F5F9',
      }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>
          📊 시나리오별 런웨이
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {items.map((item, i) => {
          const level = getDangerLevel(item.days)
          const color = DANGER_COLORS[level]
          const isLast = i === items.length - 1

          return (
            <div
              key={item.label}
              style={{
                padding:      '16px 12px',
                textAlign:    'center',
                borderRight:  i < 2 ? '1px solid #F1F5F9' : 'none',
                background:   isLast && !isFinite(item.days) ? '#F0FFFE' : '#fff',
              }}
            >
              <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 6 }}>
                {item.label}
              </p>
              <p style={{
                fontSize:   20,
                fontWeight: 900,
                color,
                margin:     '0 0 4px',
                lineHeight: 1,
              }}>
                {isFinite(item.days) ? formatDays(item.days) : '∞'}
              </p>
              <p style={{ fontSize: 10, color: '#CBD5E1', margin: 0 }}>
                {item.sublabel}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
