'use client'

import { usePathname } from 'next/navigation'

/**
 * 모바일 앱 형태로 콘텐츠 영역을 430px max로 가운데 고정.
 * /admin 라우트는 풀스크린 데스크탑 대시보드라 래핑하지 않음.
 */
export default function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>
  }

  return (
    <div style={{
      width:         '100%',
      maxWidth:      430,
      margin:        '0 auto',   /* body flex 없이 직접 가운데 정렬 */
      minHeight:     '100dvh',
      position:      'relative',
      overflowX:     'hidden',
      paddingBottom: 80,         /* BottomNav 60px + 여유 */
      boxSizing:     'border-box',
      background:    '#F8F9FB',  /* 앱 콘텐츠 배경 */
    }}>
      {children}
    </div>
  )
}
