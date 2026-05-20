import { type DangerLevel } from '@/utils/calculate'
import { LoginGate } from './LoginGate'

interface Action {
  label: string
  href:  string
}

interface Prescription {
  emoji:    string
  title:    string
  desc:     string
  quote:    string   // 위트있는 한마디
  actions:  Action[]
  bg:       string
  border:   string
}

const BIZ_PRESCRIPTIONS: Record<DangerLevel, Prescription> = {
  critical: {
    emoji:   '🚨',
    title:   '사장님, 지금은 진짜 위험해요',
    desc:    '30일 안에 통장이 텅 빕니다. 지금 당장 움직여야 해요.',
    quote:   '"월세 밀리기 전에 움직이자. 가게는 닫아도 인생은 안 닫힌다."',
    bg:      '#FFF5F5',
    border:  '#FED7D7',
    actions: [
      { label: '💊 긴급 경영안정자금 알아보기', href: '#' },
      { label: '✂️ 지금 당장 줄일 수 있는 비용 가이드', href: '#' },
    ],
  },
  warning: {
    emoji:   '⚠️',
    title:   '아직 늦지 않았어요. 하지만 빨리요.',
    desc:    '2개월이면 위기가 와요. 지금이 방향을 바꿀 마지막 타이밍이에요.',
    quote:   '"장사가 안 되는 게 아니라, 새는 돈을 못 찾고 있는 거다."',
    bg:      '#FFFAF0',
    border:  '#FEEBC8',
    actions: [
      { label: '🔍 정책자금 지원 확인하기', href: '#' },
      { label: '📊 매출 회복 플랜 세우기', href: '#' },
    ],
  },
  caution: {
    emoji:   '🟡',
    title:   '괜찮은 것 같지만... 방심은 금물',
    desc:    '3개월의 여유. 지금이 전략을 바꿀 적기예요.',
    quote:   '"여유 있을 때 준비하는 사장님이, 위기 때 살아남는 사장님이다."',
    bg:      '#FFFFF0',
    border:  '#FAF089',
    actions: [
      { label: '📈 매출 늘리는 마케팅 꿀팁', href: '#' },
      { label: '🤝 고정비 줄이는 협상 비법', href: '#' },
    ],
  },
  safe: {
    emoji:   '✅',
    title:   '사장님, 지금은 안전해요!',
    desc:    '버틸 수 있는 날이 충분해요. 이 여유를 성장에 투자할 때예요.',
    quote:   '"버티는 것에서 끝내지 말고, 이 기회에 한 단계 올라가자."',
    bg:      '#F0FFF4',
    border:  '#C6F6D5',
    actions: [
      { label: '🚀 매출 2배 만드는 법', href: '#' },
      { label: '💰 사장님을 위한 절세 전략', href: '#' },
    ],
  },
  infinite: {
    emoji:   '🎉',
    title:   '흑자 운영 중! 사장님이 이 구역의 고수',
    desc:    '매출이 지출을 뛰어넘고 있어요. 이제 확장을 고민할 때!',
    quote:   '"돈 벌 때 더 벌어야 한다. 지금이 바로 그 때다."',
    bg:      '#EBF8FF',
    border:  '#BEE3F8',
    actions: [
      { label: '🏗️ 2호점 · 사업 확장 로드맵', href: '#' },
      { label: '📋 세금 절약 체크리스트', href: '#' },
    ],
  },
}

const FREE_PRESCRIPTIONS: Record<DangerLevel, Prescription> = {
  critical: {
    emoji:   '😱',
    title:   '퇴사는... 다음 생에?',
    desc:    '현재 속도로는 탈출이 어려워요. 지출을 줄이거나 수입원을 만들어야 해요.',
    quote:   '"월급은 내 계좌를 스쳐지나가는 관광객이었다."',
    bg:      '#FFF5F5',
    border:  '#FED7D7',
    actions: [
      { label: '✂️ 소비 습관 리셋 가이드', href: '#' },
      { label: '💡 직장인 부업 아이디어 10선', href: '#' },
    ],
  },
  warning: {
    emoji:   '😤',
    title:   '아직 멀지만, 포기하긴 일러요',
    desc:    '2~5년 후에 가능해요. 부업이나 절약으로 앞당길 수 있어요.',
    quote:   '"야근하면서 퇴사 계획 세우는 건 모순이 아니라 생존 전략이다."',
    bg:      '#FFFAF0',
    border:  '#FEEBC8',
    actions: [
      { label: '📊 저축률 높이는 실전 방법', href: '#' },
      { label: '🔥 퇴사 전 준비해야 할 것들', href: '#' },
    ],
  },
  caution: {
    emoji:   '👀',
    title:   '출구가 보이기 시작했어요!',
    desc:    '1~2년이면 가능! 조금만 더 조이면 확 당겨져요.',
    quote:   '"터널 끝에 빛이 보인다. 그 빛이 퇴직금이길 바란다."',
    bg:      '#FFFFF0',
    border:  '#FAF089',
    actions: [
      { label: '🚀 탈출을 3개월 앞당기는 법', href: '#' },
      { label: '📝 퇴사 타이밍 체크리스트', href: '#' },
    ],
  },
  safe: {
    emoji:   '🎉',
    title:   '곧이에요! 사직서 준비하세요!',
    desc:    '1년 이내에 목표 달성! 퇴사 후 플랜을 세울 때예요.',
    quote:   '"더 이상 월요일이 무섭지 않은 날이 온다."',
    bg:      '#F0FFF4',
    border:  '#C6F6D5',
    actions: [
      { label: '✈️ 퇴사 후 첫 달 생존 가이드', href: '#' },
      { label: '🏗️ 1인 사업 시작하기', href: '#' },
    ],
  },
  infinite: {
    emoji:   '🏆',
    title:   '이미 목표 달성! 자유인이세요!',
    desc:    '더 이상 회사에 묶여있을 이유가 없어요!',
    quote:   '"사직서를 내는 것이 아니라, 자유를 선언하는 것이다."',
    bg:      '#EBF8FF',
    border:  '#BEE3F8',
    actions: [
      { label: '🌟 퇴사 후 행복한 사람들의 이야기', href: '#' },
      { label: '💼 프리랜서로 전환하기', href: '#' },
    ],
  },
}

interface Props {
  level: DangerLevel
  mode?: 'business' | 'freelancer'
  isLoggedIn?: boolean
}

export function PrescriptionCard({ level, mode = 'business', isLoggedIn = true }: Props) {
  const prescriptions = mode === 'freelancer' ? FREE_PRESCRIPTIONS : BIZ_PRESCRIPTIONS
  const p = prescriptions[level]
  const [firstAction, ...lockedActions] = p.actions

  return (
    <div style={{
      borderRadius: 20,
      background:   p.bg,
      border:       `1.5px solid ${p.border}`,
      padding:      '20px 20px',
      boxShadow:    '0 2px 16px rgba(0,0,0,0.04)',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>{p.emoji}</span>
        <p style={{ fontSize: 15, fontWeight: 900, color: '#1A1F5E', margin: 0 }}>
          {p.title}
        </p>
      </div>

      {/* 설명 */}
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px', lineHeight: 1.6 }}>
        {p.desc}
      </p>

      {/* 위트 한마디 */}
      <div style={{
        padding:      '12px 16px',
        borderRadius: 12,
        background:   'rgba(255,255,255,0.6)',
        marginBottom: 16,
        borderLeft:   '3px solid #94A3B8',
      }}>
        <p style={{
          fontSize: 12, color: '#64748B', margin: 0,
          lineHeight: 1.6, fontStyle: 'italic',
        }}>
          {p.quote}
        </p>
      </div>

      {/* 액션 버튼 — 첫번째는 항상 노출, 나머지는 비로그인 시 블러 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {firstAction && <ActionLink action={firstAction} />}

        {lockedActions.length > 0 && (
          <LoginGate
            isLoggedIn={isLoggedIn}
            message="더 많은 조언이 궁금하다면?"
            sub="로그인하면 누렁이의 모든 조언을 받아볼 수 있어요"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lockedActions.map(action => (
                <ActionLink key={action.label} action={action} />
              ))}
            </div>
          </LoginGate>
        )}
      </div>
    </div>
  )
}

function ActionLink({ action }: { action: Action }) {
  return (
    <a
      href={action.href}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '13px 16px',
        borderRadius:   12,
        background:     '#fff',
        textDecoration: 'none',
        boxShadow:      '0 1px 4px rgba(0,0,0,0.06)',
        transition:     'transform 0.1s',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1F5E' }}>
        {action.label}
      </span>
      <span style={{ fontSize: 16, color: '#94A3B8' }}>›</span>
    </a>
  )
}
