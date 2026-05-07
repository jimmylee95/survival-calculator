import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistSans = localFont({
  src:      './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight:   '100 900',
})
const geistMono = localFont({
  src:      './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight:   '100 900',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://survival-calculator.vercel.app'

export const metadata: Metadata = {
  title:       '생존 계산기 — 자영업자/직장인 런웨이 계산',
  description: '지금 잔고로 몇 일을 버틸 수 있는지 30초 만에 계산해보세요. 자영업자 · 소상공인 · 직장인 퇴사 런웨이 계산기.',
  keywords:    ['런웨이', '자영업자', '소상공인', '직장인', '퇴사', '생존', '계산기', '손익분기'],
  authors:     [{ name: '생존 계산기' }],
  openGraph: {
    type:        'website',
    url:          BASE_URL,
    title:       '생존 계산기 — 자영업자/직장인 런웨이 계산',
    description: '지금 잔고로 몇 일을 버틸 수 있는지 30초 만에 계산해보세요',
    siteName:    '생존 계산기',
    images: [
      {
        url:    `${BASE_URL}/og-image.png`,
        width:  1200,
        height: 630,
        alt:    '생존 계산기 — 런웨이 계산',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       '생존 계산기 — 자영업자/직장인 런웨이 계산',
    description: '지금 잔고로 몇 일을 버틸 수 있는지 30초 만에 계산해보세요',
    images:      [`${BASE_URL}/og-image.png`],
  },
  metadataBase: new URL(BASE_URL),
  robots: {
    index:  true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor:   '#1A1F5E',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* 카카오 JavaScript SDK */}
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
