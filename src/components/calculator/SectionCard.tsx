interface Props {
  icon:      string
  title:     string
  subtitle?: string
  children:  React.ReactNode
  action?:   React.ReactNode  // 우측 상단 버튼 슬롯 (건너뛰기 등)
}

export function SectionCard({ icon, title, subtitle, children, action }: Props) {
  return (
    <div style={{
      background:   '#fff',
      borderRadius: 20,
      padding:      '20px 20px 20px',
      boxShadow:    '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      {/* 섹션 헤더 */}
      <div style={{
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        marginBottom:   16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1F5E' }}>{title}</span>
          </div>
          {subtitle && (
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {children}
    </div>
  )
}
