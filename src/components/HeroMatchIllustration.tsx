'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import HeroMagnifyingGlassMark from '@/components/HeroMagnifyingGlassMark'
import HeroFitScoreBubble from '@/components/HeroFitScoreBubble'
import { heroFrame, heroMiniCard, heroMiniCardTitle, heroSkillTag } from '@/components/ui/theme'

function HeroDocCard({ title, tags }: { title: string; tags: string[] }) {
  return (
    <div className={`${heroMiniCard} mx-auto sm:mx-0`}>
      <div className="border-b border-ash/45 pb-3">
        <div className="mb-2.5 h-1.5 w-9 rounded-sm bg-ash/75" aria-hidden />
        <p className={heroMiniCardTitle}>{title}</p>
      </div>
      <div className="mt-3.5 space-y-2" aria-hidden>
        <div className="h-2 w-full max-w-[88%] rounded bg-ash/80" />
        <div className="h-1.5 w-full rounded bg-ash/60" />
        <div className="h-1.5 w-[85%] rounded bg-ash/60" />
        <div className="h-1.5 w-[92%] rounded bg-ash/60" />
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className={heroSkillTag}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

type BridgeMask = {
  cvBottom: number
  ringTop: number
  ringBottom: number
  jobTop: number
}

function readBridgeMask(
  column: HTMLElement,
  cv: HTMLElement,
  lensBridge: HTMLElement,
  job: HTMLElement,
): BridgeMask | null {
  const columnRect = column.getBoundingClientRect()
  const cvRect = cv.getBoundingClientRect()
  const lensRect = lensBridge.getBoundingClientRect()
  const jobRect = job.getBoundingClientRect()
  const styles = getComputedStyle(lensBridge)
  const optYRaw = styles.getPropertyValue('--hero-logo-opt-y').trim()
  const radiusRaw = styles.getPropertyValue('--hero-lens-outer-ring-radius').trim()

  const optY = optYRaw.endsWith('%') ? parseFloat(optYRaw) / 100 : parseFloat(optYRaw) / lensRect.height
  const radius = parseFloat(radiusRaw)
  const gapExtendTop = parseFloat(styles.getPropertyValue('--hero-lens-gap-extend-top')) || 0
  const stopBeforeTop = parseFloat(styles.getPropertyValue('--hero-lens-gap-stop-before-top')) || 0

  if (Number.isNaN(optY) || Number.isNaN(radius) || columnRect.height <= 0) return null

  const ringCenterY = lensRect.top - columnRect.top + lensRect.height * optY
  return {
    cvBottom: cvRect.bottom - columnRect.top,
    ringTop: ringCenterY - radius + gapExtendTop - stopBeforeTop,
    ringBottom: ringCenterY + radius,
    jobTop: jobRect.top - columnRect.top,
  }
}

function bridgeMaskStyle(mask: BridgeMask) {
  const { cvBottom, ringTop, ringBottom, jobTop } = mask
  const gradient = `linear-gradient(to bottom, transparent 0, transparent ${cvBottom}px, #000 ${cvBottom}px, #000 ${ringTop}px, transparent ${ringTop}px, transparent ${ringBottom}px, #000 ${ringBottom}px, #000 ${jobTop}px, transparent ${jobTop}px, transparent 100%)`
  return { WebkitMaskImage: gradient, maskImage: gradient }
}

export default function HeroMatchIllustration() {
  const columnRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLDivElement>(null)
  const lensBridgeRef = useRef<HTMLDivElement>(null)
  const jobRef = useRef<HTMLDivElement>(null)
  const [bridgeMask, setBridgeMask] = useState<BridgeMask | null>(null)

  useLayoutEffect(() => {
    const column = columnRef.current
    const cv = cvRef.current
    const lensBridge = lensBridgeRef.current
    const job = jobRef.current
    if (!column || !cv || !lensBridge || !job) return

    const update = () => {
      setBridgeMask(readBridgeMask(column, cv, lensBridge, job))
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(column)
    ro.observe(cv)
    ro.observe(lensBridge)
    ro.observe(job)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className={heroFrame}>
      <div
        className="relative mx-auto w-full max-w-[720px]"
        role="img"
        aria-label="Illustration of a CV and job description being analyzed for fit score"
      >
        <div
          ref={columnRef}
          className="relative flex flex-col items-center gap-6 sm:grid sm:grid-cols-[220px_minmax(0,1fr)_220px] sm:items-center sm:gap-7"
        >
          <div
            className="hero-connector-segment hero-connector-bridge pointer-events-none absolute top-1/2 hidden h-px -translate-y-1/2 sm:left-[220px] sm:right-[220px] sm:block"
            aria-hidden
          />

          {bridgeMask != null ? (
            <div
              className="hero-connector-segment-vertical hero-connector-bridge-vertical hero-connector-bridge-vertical--ready pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 sm:hidden"
              style={bridgeMaskStyle(bridgeMask)}
              aria-hidden
            />
          ) : null}

          <div ref={cvRef} className="relative mx-auto w-full max-w-[220px] sm:mx-0">
            <HeroDocCard title="CV" tags={['Python', 'SQL']} />
          </div>

          <div className="relative z-10 flex shrink-0 flex-col items-center py-1 sm:py-0">
            <div ref={lensBridgeRef} className="hero-lens-vertical-bridge relative shrink-0">
              <HeroMagnifyingGlassMark />
            </div>
          </div>

          <div ref={jobRef} className="relative mx-auto w-full max-w-[220px] sm:mx-0 sm:w-[220px]">
            <div className={`${heroMiniCard} max-w-none sm:max-w-[220px]`}>
              <HeroFitScoreBubble />
              <div className="border-b border-ash/45 pb-3">
                <div className="mb-2.5 h-1.5 w-9 rounded-sm bg-ash/75" aria-hidden />
                <p className={heroMiniCardTitle}>Job description</p>
              </div>
              <div className="mt-3.5 space-y-2" aria-hidden>
                <div className="h-2 w-full max-w-[92%] rounded bg-ash/80" />
                <div className="h-1.5 w-full rounded bg-ash/60" />
                <div className="h-1.5 w-[78%] rounded bg-ash/60" />
                <div className="h-1.5 w-[88%] rounded bg-ash/60" />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className={heroSkillTag}>NLP</span>
                <span className={heroSkillTag}>APIs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
