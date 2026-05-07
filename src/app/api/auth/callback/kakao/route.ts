import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    // 카카오 토큰 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
        redirect_uri:  `${origin}/api/auth/callback/kakao`,
        code,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
      }),
    })

    const tokenData = await tokenRes.json()

    // 카카오 사용자 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization:  `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const userData = await userRes.json()

    const kakaoId     = userData.id
    const nickname    = userData.properties?.nickname    || '사용자'
    const profileImage = userData.properties?.profile_image || ''

    // Supabase admin 클라이언트 (service role)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // 이메일 없이 유저 생성 (fake email 패턴)
    const fakeEmail = `kakao_${kakaoId}@survival-calculator.app`

    const { error } = await supabase.auth.admin.createUser({
      email:         fakeEmail,
      password:      `kakao_${kakaoId}_${Date.now()}`,
      email_confirm: true,
      user_metadata: {
        name:       nickname,
        avatar_url: profileImage,
        kakao_id:   kakaoId,
        provider:   'kakao',
      },
    })

    if (error && error.message !== 'User already registered') {
      return NextResponse.redirect(`${origin}/login?error=user_creation_failed`)
    }

    // 로그인 처리
    await supabase.auth.signInWithPassword({
      email:    fakeEmail,
      password: `kakao_${kakaoId}_secret`,
    })

    return NextResponse.redirect(`${origin}/`)
  } catch (err) {
    console.error('카카오 로그인 에러:', err)
    return NextResponse.redirect(`${origin}/login?error=login_failed`)
  }
}
