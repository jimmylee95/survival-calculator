export const initKakao = () => {
  if (typeof window !== 'undefined' && !window.Kakao?.isInitialized()) {
    window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY!)
  }
}

export const kakaoLogin = () => {
  return new Promise((resolve, reject) => {
    window.Kakao.Auth.login({
      scope:   'profile_nickname,profile_image',
      success: (authObj: unknown) => resolve(authObj),
      fail:    (err: unknown)     => reject(err),
    })
  })
}
