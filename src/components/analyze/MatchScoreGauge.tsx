type MatchScoreGaugeProps = {
  score: number
  headline: string
  description: string
}

const GAUGE_SIZE = 96
const STROKE_WIDTH = 8

export function getMatchScoreHeadline(score: number): string {
  if (score >= 85) return 'Great fit'
  if (score >= 70) return 'Good fit'
  if (score >= 55) return 'Moderate fit'
  return 'Needs improvement'
}

export function getMatchScoreBlurb(score: number): string {
  if (score >= 85) return 'Strong match. A few important keywords and details are missing.'
  if (score >= 70) return 'Solid alignment. Target a few gaps before you apply.'
  if (score >= 55) return 'Partial match. Strengthen keywords and role-specific evidence.'
  return 'Significant gaps. Revise your CV toward this posting before applying.'
}

export function MatchScoreGauge({ score, headline, description }: MatchScoreGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score))
  const radius = (GAUGE_SIZE - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference
  const center = GAUGE_SIZE / 2

  return (
    <div
      className="flex items-center gap-5"
      role="group"
      aria-label={`Match score ${clamped} percent. ${headline}. ${description}`}
    >
      <div
        className="relative shrink-0"
        style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
        aria-hidden
      >
        <svg width={GAUGE_SIZE} height={GAUGE_SIZE} className="-rotate-90" aria-hidden>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#C7D6D5"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#C20114"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[1.35rem] font-bold tabular-nums leading-none text-brick">{clamped}%</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold leading-snug text-onyx">{headline}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-dim">{description}</p>
      </div>
    </div>
  )
}
