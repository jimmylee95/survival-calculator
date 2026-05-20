interface InsightItem {
  icon:  string
  text:  string
  value: string
  sub?:  string
}

interface Props {
  items: InsightItem[]
}

export function InsightCard({ items }: Props) {
  return (
    <div style={{
      background:   '#fff',
      borderRadius: 20,
      padding:      '16px 20px',
      boxShadow:    '0 2px 16px rgba(0,0,0,0.06)',
      display:      'flex',
      flexDirection: 'column',
      gap:          14,
    }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1F5E', margin: 0 }}>
        핵심 진단
      </p>

      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          10,
            padding:      '12px 14px',
            borderRadius: 12,
            background:   '#F8F9FB',
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 2px', lineHeight: 1.5 }}>
              {item.text}{' '}
              <span style={{ fontWeight: 800, color: '#1A1F5E' }}>{item.value}</span>
            </p>
            {item.sub && (
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{item.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
