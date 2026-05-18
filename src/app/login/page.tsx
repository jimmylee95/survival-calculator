import KakaoLoginButton from '@/components/auth/KakaoLoginButton'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#FAFAFA',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '0 24px',
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     390,
        background:   '#fff',
        borderRadius: 24,
        padding:      '48px 32px',
        boxShadow:    '0 4px 24px rgba(0,0,0,0.08)',
        textAlign:    'center',
      }}>
        {/* 로고 */}
        <div style={{ fontSize: 48, marginBottom: 16 }}>🫧</div>
        <h1 style={{
          fontSize:     24,
          fontWeight:   900,
          color:        '#1A1F5E',
          marginBottom: 8,
        }}>
          누렁이의 해방 계산기
        </h1>
        <p style={{
          fontSize:     14,
          color:        '#718096',
          marginBottom: 40,
          lineHeight:   1.6,
        }}>
          내 돈이 얼마나 버텨줄지<br />
          30초 만에 확인해보세요
        </p>

        {/* 카카오 로그인 버튼 */}
        <KakaoLoginButton />

        {/* 구분선 */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        12,
          margin:     '20px 0',
          color:      '#CBD5E0',
          fontSize:   13,
        }}>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          <span>또는</span>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        </div>

        {/* 로그인 없이 계산 */}
        <Link
          href="/calculator"
          style={{
            display:        'block',
            width:          '100%',
            height:         52,
            lineHeight:     '52px',
            background:     '#F7F7F7',
            borderRadius:   12,
            fontSize:       15,
            fontWeight:     600,
            color:          '#4A5568',
            textDecoration: 'none',
            textAlign:      'center',
          }}
        >
          로그인 없이 계산하기
        </Link>

        <p style={{
          fontSize:   11,
          color:      '#A0AEC0',
          marginTop:  24,
          lineHeight: 1.6,
        }}>
          로그인 시 히스토리 저장 및<br />
          결과 공유 기능을 이용할 수 있어요
        </p>
      </div>
    </div>
  )
}
