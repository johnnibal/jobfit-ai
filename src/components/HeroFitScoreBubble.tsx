import { heroFitScoreBubble } from '@/components/ui/theme'

const TARGET_SCORE = 87

export default function HeroFitScoreBubble() {
  return (
    <div className={heroFitScoreBubble}>
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
        Fit score
      </p>
      <p
        className="text-center text-base font-semibold leading-tight tabular-nums"
        aria-label={`Fit score ${TARGET_SCORE} percent`}
      >
        <span className="text-brick" aria-hidden>
          {TARGET_SCORE}
        </span>
        <span className="text-brick" aria-hidden>
          %
        </span>
      </p>
    </div>
  )
}
