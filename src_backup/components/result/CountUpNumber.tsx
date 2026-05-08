'use client'

import { useEffect, useState } from 'react'

interface Props {
  target:   number
  duration?: number  // ms
}

export function CountUpNumber({ target, duration = 1500 }: Props) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!isFinite(target)) {
      setCurrent(Infinity)
      return
    }
    if (target === 0) {
      setCurrent(0)
      return
    }

    const start     = Date.now()
    let animFrame: number

    const tick = () => {
      const elapsed  = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease     = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCurrent(Math.round(target * ease))
      if (progress < 1) animFrame = requestAnimationFrame(tick)
    }

    animFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrame)
  }, [target, duration])

  if (!isFinite(current)) return <>∞</>
  return <>{current.toLocaleString('ko-KR')}</>
}
