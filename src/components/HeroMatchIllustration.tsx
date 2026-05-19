import HeroMagnifyingGlassMark from '@/components/HeroMagnifyingGlassMark'
import { heroFitScoreBubble, heroFrame, heroMiniCard } from '@/components/ui/theme'

export default function HeroMatchIllustration() {
  return (
    <div className={heroFrame}>
      <div
        className="relative mx-auto w-full max-w-[720px]"
        role="img"
        aria-label="Illustration of a CV and job description being analyzed for fit score"
      >
        <div className="relative flex flex-col items-center gap-5 sm:grid sm:grid-cols-[220px_minmax(0,1fr)_220px] sm:items-center sm:gap-6">
          <div
            className="hero-connector-segment hero-connector-bridge pointer-events-none absolute top-1/2 hidden h-px -translate-y-1/2 sm:left-[220px] sm:right-[220px] sm:block"
            aria-hidden
          />

          <div className={`${heroMiniCard} mx-auto sm:mx-0`}>
            <div className="mb-3 h-2 w-10 rounded bg-ash/80" aria-hidden />
            <p className="text-sm font-semibold text-onyx">CV</p>
            <div className="mt-4 space-y-2" aria-hidden>
              <div className="h-2 w-full max-w-[88%] rounded bg-ash/80" />
              <div className="h-1.5 w-full rounded bg-ash/60" />
              <div className="h-1.5 w-[85%] rounded bg-ash/60" />
              <div className="h-1.5 w-[92%] rounded bg-ash/60" />
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-ash/80 bg-white px-2.5 py-0.5 text-xs font-medium text-dim">
                Python
              </span>
              <span className="rounded-full border border-ash/80 bg-white px-2.5 py-0.5 text-xs font-medium text-dim">
                SQL
              </span>
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 justify-center py-1 sm:py-0">
            <HeroMagnifyingGlassMark />
          </div>

          <div className="relative mx-auto mt-6 w-full max-w-[220px] sm:mx-0 sm:mt-0 sm:w-[220px]">
            <div className={`${heroMiniCard} max-w-none sm:max-w-[220px]`}>
              <div className={heroFitScoreBubble}>
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  Fit score
                </p>
                <p className="text-center text-base font-semibold leading-tight tabular-nums">
                  <span className="text-brick">87</span>
                  <span className="text-brick">%</span>
                </p>
              </div>
              <div className="mb-3 h-2 w-10 rounded bg-ash/80" aria-hidden />
              <p className="text-sm font-semibold text-onyx">Job description</p>
              <div className="mt-4 space-y-2" aria-hidden>
                <div className="h-2 w-full max-w-[92%] rounded bg-ash/80" />
                <div className="h-1.5 w-full rounded bg-ash/60" />
                <div className="h-1.5 w-[78%] rounded bg-ash/60" />
                <div className="h-1.5 w-[88%] rounded bg-ash/60" />
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-ash/80 bg-white px-2.5 py-0.5 text-xs font-medium text-dim">
                  NLP
                </span>
                <span className="rounded-full border border-ash/80 bg-white px-2.5 py-0.5 text-xs font-medium text-dim">
                  APIs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
