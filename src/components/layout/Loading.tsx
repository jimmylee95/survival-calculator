/** 페이지 진입 시 잠깐 보이는 로더. useAuth가 3초 안에 응답을 강제하므로 이 화면은 짧게만 노출됨. */
export function Loading() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    }}>
      <div style={{ fontSize: 28 }}>⚡</div>
    </div>
  )
}
