import HeroMagnifyingGlassMark from '@/components/HeroMagnifyingGlassMark'
import { heroFitScoreBubble, heroFrame, heroMiniCard, heroMiniCardTitle, heroSkillTag } from '@/components/ui/theme'

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

export default function HeroMatchIllustration() {
  return (
    <div className={heroFrame}>
      <div
        className="relative mx-auto w-full max-w-[720px]"
        role="img"
        aria-label="Illustration of a CV and job description being analyzed for fit score"
      >
        <div className="relative flex flex-col items-center gap-6 sm:grid sm:grid-cols-[220px_minmax(0,1fr)_220px] sm:items-center sm:gap-7">
          <div
            className="hero-connector-segment hero-connector-bridge pointer-events-none absolute top-1/2 hidden h-px -translate-y-1/2 sm:left-[220px] sm:right-[220px] sm:block"
            aria-hidden
          />

          <HeroDocCard title="CV" tags={['Python', 'SQL']} />

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
