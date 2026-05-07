import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    // 1. 카카오 토큰 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
        redirect_uri: `${origin}/api/auth/callback/kakao`,
        code,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
      }),
    })
    const tokenData = await tokenRes.json()
    console.log('Token data:', tokenData)

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${origin}/login?error=token_failed`)
    }

    // 2. 카카오 사용자 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })
    const userData = await userRes.json()
    console.log('User data:', userData)

    const kakaoId = String(userData.id)
    const nickname = userData.properties?.nickname || '사용자'
    const profileImage = userData.properties?.profile_image || ''
    const fakeEmail = `kakao_${kakaoId}@kakao.survival-calc.app`
    const fakePassword = `kakao_pwd_${kakaoId}_abc123!`

    // 3. Supabase Admin으로 유저 생성 또는 로그인
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 유저 없으면 생성
    const { error: createError } = await adminSupabase.auth.admin.createUser({
      email: fakeEmail,
      password: fakePassword,
      email_confirm: true,
      user_metadata: {
        name: nickname,
        avatar_url: profileImage,
        kakao_id: kakaoId,
        provider: 'kakao',
      },
    })

    if (createError && !createError.message.includes('already been registered')) {
      console.error('Create user error:', createError)
    }

    // 4. 로그인 처리 (세션 생성)
    const supabase = await createClient()
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    })

    console.log('SignIn result:', signInData, signInError)

    if (signInError) {
      console.error('SignIn error:', signInError)
      return NextResponse.redirect(`${origin}/login?error=signin_failed`)
    }

    return NextResponse.redirect(`${origin}/`)

  } catch (err) {
    console.error('Kakao callback error:', err)
    return NextResponse.redirect(`${origin}/login?error=unknown`)
  }
}
