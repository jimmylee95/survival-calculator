import { type DangerLevel } from '@/utils/calculate'

interface Action {
  label: string
  href:  string
}

interface Prescription {
  emoji:   string
  title:   string
  desc:    string
  actions: Action[]
  bg:      string
  border:  string
}

const PRESCRIPTIONS: Record<DangerLevel, Prescription> = {
  critical: {
    emoji:   '🚨',
    title:   '긴급 행동이 필요해요',
    desc:    '30일 안에 자금이 소진될 수 있어요. 지금 당장 움직이세요.',
    bg:      '#FFF5F5',
    border:  '#FED7D7',
    actions: [
      { label: '소진공 긴급 경영안정자금 알아보기', href: '#' },
      { label: '비용 줄이는 즉시 실행 가이드',       href: '#' },
    ],
  },
  warning: {
    emoji:   '⚠️',
    title:   '지금 움직여야 할 때예요',
    desc:    '2개월 이내에 위기가 올 수 있어요. 정책자금을 먼저 확인하세요.',
    bg:      '#FFFAF0',
    border:  '#FEEBC8',
    actions: [
      { label: '정책자금 지원 확인하기', href: '#' },
      { label: '매출 회복 플랜 세우기',  href: '#' },
    ],
  },
  caution: {
    emoji:   '🟡',
    title:   '아직 여유 있지만 준비하세요',
    desc:    '3개월 안에 흑자 전환이 목표예요. 지금이 전략을 바꿀 적기예요.',
    bg:      '#FFFFF0',
    border:  '#FAF089',
    actions: [
      { label: '매출 늘리는 마케팅 방법', href: '#' },
      { label: '고정비 줄이는 협상 팁',   href: '#' },
    ],
  },
  safe: {
    emoji:   '✅',
    title:   '지금은 안전해요. 하지만 방심은 금물!',
    desc:    '런웨이가 충분해요. 지금이 성장에 투자할 타이밍이에요.',
    bg:      '#F0FFF4',
    border:  '#C6F6D5',
    actions: [
      { label: '매출 2배 늘리는 법 보기',  href: '#' },
      { label: '안전한 투자 전략 알아보기', href: '#' },
    ],
  },
  infinite: {
    emoji:   '🎉',
    title:   '흑자 운영 중이에요!',
    desc:    '매출이 지출을 초과하고 있어요. 이제 성장 전략을 세울 때예요.',
    bg:      '#EBF8FF',
    border:  '#BEE3F8',
    actions: [
      { label: '사업 확장 로드맵 세우기', href: '#' },
      { label: '세금 절약 전략 알아보기', href: '#' },
    ],
  },
}

interface Props {
  level: DangerLevel
}

export function PrescriptionCard({ level }: Props) {
  const p = PRESCRIPTIONS[level]

  return (
    <div style={{
      borderRadius: 20,
      background:   p.bg,
      border:       `1.5px solid ${p.border}`,
      padding:      '18px 20px',
      boxShadow:    '0 2px 16px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{p.emoji}</span>
        <p style={{ fontSize: 14, fontWeight: 900, color: '#1A1F5E', margin: 0 }}>
          {p.title}
        </p>
      </div>

      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px', lineHeight: 1.6 }}>
        {p.desc}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {p.actions.map(action => (
          <a
            key={action.label}
            href={action.href}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '12px 14px',
              borderRadius:   12,
              background:     '#fff',
              textDecoration: 'none',
              boxShadow:      '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1F5E' }}>
              {action.label}
            </span>
            <span style={{ fontSize: 16, color: '#94A3B8' }}>›</span>
          </a>
        ))}
      </div>
    </div>
  )
}
