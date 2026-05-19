'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const LAYER_SIZE = 1024

/** Layered logo assets: glass (static) → wave reveal → AI fade-in. */
export default function HeroMagnifyingGlassMark() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const boxClass =
    'relative size-[120px] shrink-0 sm:size-[144px] md:size-[164px] [--hero-logo-opt-x:39%] [--hero-logo-opt-y:37%]'
  const imgClass = 'hero-logo-img absolute inset-0 h-full w-full object-contain'

  if (reducedMotion) {
    return (
      <div className={boxClass}>
        <div className="absolute inset-0 rounded-full bg-[#F4F7F6]" aria-hidden />
        <Image
          src="/hero-logo-glass.png"
          alt=""
          width={LAYER_SIZE}
          height={LAYER_SIZE}
          className={imgClass}
          aria-hidden
          priority
        />
        <Image
          src="/hero-logo-wave.png"
          alt=""
          width={LAYER_SIZE}
          height={LAYER_SIZE}
          className={imgClass}
          aria-hidden
        />
        <Image
          src="/hero-logo-ai.png"
          alt=""
          width={LAYER_SIZE}
          height={LAYER_SIZE}
          className={imgClass}
          aria-hidden
        />
      </div>
    )
  }

  return (
    <div className={`${boxClass} hero-logo-stage`}>
      <div className="absolute inset-0 rounded-full bg-[#F4F7F6]" aria-hidden />
      <Image
        src="/hero-logo-glass.png"
        alt=""
        width={LAYER_SIZE}
        height={LAYER_SIZE}
        className={imgClass}
        aria-hidden
        priority
      />
      <div className="hero-logo-wave-layer absolute inset-0">
        <Image
          src="/hero-logo-wave.png"
          alt=""
          width={LAYER_SIZE}
          height={LAYER_SIZE}
          className="hero-logo-img h-full w-full object-contain"
          aria-hidden
        />
      </div>
      <div className="hero-logo-ai-layer absolute inset-0">
        <Image
          src="/hero-logo-ai.png"
          alt=""
          width={LAYER_SIZE}
          height={LAYER_SIZE}
          className="hero-logo-img h-full w-full object-contain"
          aria-hidden
        />
      </div>
    </div>
  )
}
