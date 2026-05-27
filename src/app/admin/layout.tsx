import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '어드민 — 모두의 계산기',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#F5F6F8' }}>
      {children}
    </div>
  )
}
