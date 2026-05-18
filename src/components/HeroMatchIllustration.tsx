/** Premium light hero: CV + JD converging on AI match with fit score. Illustration-only subtle motion. */
export default function HeroMatchIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="overflow-hidden rounded-2xl border border-indigo-100/80 bg-white shadow-sm ring-1 ring-indigo-50">
        <svg
          viewBox="0 0 640 380"
          role="img"
          aria-label="Illustration of a CV and job description being analyzed for fit score"
          className="h-auto w-full"
        >
          <defs>
            <linearGradient id="heroScanBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <clipPath id="heroHubClip">
              <circle cx="320" cy="178" r="72" />
            </clipPath>
          </defs>

          {/* Canvas */}
          <rect width="640" height="380" fill="#fafafa" />
          <rect x="0.5" y="0.5" width="639" height="379" rx="16" fill="none" stroke="#e4e4e7" />

          {/* CV card */}
          <g>
            <rect x="40" y="72" width="156" height="220" rx="14" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="40" y="72" width="156" height="36" rx="14" fill="#eef2ff" />
            <rect x="40" y="94" width="156" height="14" fill="#eef2ff" />
            <text x="58" y="98" fill="#4338ca" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif">
              CV
            </text>
            <rect x="58" y="124" width="88" height="7" rx="3.5" fill="#6366f1" opacity="0.85" />
            <rect x="58" y="142" width="108" height="6" rx="3" fill="#e4e4e7" />
            <rect x="58" y="156" width="92" height="6" rx="3" fill="#e4e4e7" />
            <rect x="58" y="170" width="100" height="6" rx="3" fill="#e4e4e7" />
            <rect x="54" y="192" width="72" height="22" rx="11" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1">
              <animate attributeName="opacity" values="1;0.72;1" dur="3s" repeatCount="indefinite" />
            </rect>
            <text x="90" y="207" textAnchor="middle" fill="#4338ca" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
              Python
            </text>
            <rect x="54" y="222" width="56" height="22" rx="11" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1" />
            <text x="82" y="237" textAnchor="middle" fill="#71717a" fontSize="11" fontWeight="500" fontFamily="system-ui, sans-serif">
              SQL
            </text>
          </g>

          {/* JD card */}
          <g>
            <rect x="444" y="72" width="156" height="220" rx="14" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="444" y="72" width="156" height="36" rx="14" fill="#f4f4f5" />
            <rect x="444" y="94" width="156" height="14" fill="#f4f4f5" />
            <text x="462" y="98" fill="#52525b" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif">
              Job description
            </text>
            <rect x="462" y="124" width="96" height="7" rx="3.5" fill="#818cf8" opacity="0.75" />
            <rect x="462" y="142" width="112" height="6" rx="3" fill="#e4e4e7" />
            <rect x="462" y="156" width="88" height="6" rx="3" fill="#e4e4e7" />
            <rect x="462" y="170" width="104" height="6" rx="3" fill="#e4e4e7" />
            <rect x="458" y="192" width="64" height="22" rx="11" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1">
              <animate attributeName="opacity" values="0.72;1;0.72" dur="3s" repeatCount="indefinite" />
            </rect>
            <text x="490" y="207" textAnchor="middle" fill="#4338ca" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
              NLP
            </text>
            <rect x="458" y="222" width="70" height="22" rx="11" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1" />
            <text x="493" y="237" textAnchor="middle" fill="#71717a" fontSize="11" fontWeight="500" fontFamily="system-ui, sans-serif">
              APIs
            </text>
          </g>

          {/* Connectors */}
          <path
            d="M 196 178 L 268 178"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="6 8"
            strokeLinecap="round"
            opacity="0.55"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2.4s" repeatCount="indefinite" />
          </path>
          <path
            d="M 372 178 L 444 178"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="6 8"
            strokeLinecap="round"
            opacity="0.55"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2.4s" repeatCount="indefinite" />
          </path>

          {/* Match hub */}
          <circle cx="320" cy="178" r="84" fill="none" stroke="#e0e7ff" strokeWidth="1.5" />
          <circle cx="320" cy="178" r="76" fill="#ffffff" stroke="#c7d2fe" strokeWidth="2" />
          <g clipPath="url(#heroHubClip)">
            <rect x="248" y="106" width="144" height="144" fill="#eef2ff" opacity="0.35" />
            <rect x="248" y="106" width="144" height="18" fill="url(#heroScanBeam)">
              <animate attributeName="y" values="106;250;106" dur="3.6s" repeatCount="indefinite" />
            </rect>
          </g>
          <circle cx="320" cy="178" r="52" fill="#ffffff" stroke="#6366f1" strokeWidth="2" />
          <text x="320" y="172" textAnchor="middle" fill="#4338ca" fontSize="11" fontWeight="600" letterSpacing="2" fontFamily="system-ui, sans-serif">
            MATCH
          </text>
          <text x="320" y="196" textAnchor="middle" fill="#6366f1" fontSize="22" fontWeight="700" fontFamily="system-ui, sans-serif">
            AI
            <animate attributeName="opacity" values="0.88;1;0.88" dur="2.8s" repeatCount="indefinite" />
          </text>

          {/* Fit score badge */}
          <g>
            <rect x="502" y="36" width="108" height="52" rx="12" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1.5" />
            <text x="556" y="58" textAnchor="middle" fill="#71717a" fontSize="10" fontWeight="600" letterSpacing="1.5" fontFamily="system-ui, sans-serif">
              FIT SCORE
            </text>
            <text x="556" y="78" textAnchor="middle" fill="#4338ca" fontSize="20" fontWeight="700" fontFamily="system-ui, sans-serif">
              87%
            </text>
            <circle cx="502" cy="64" r="6" fill="#6366f1" opacity="0.2">
              <animate attributeName="r" values="5;9;5" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.08;0.25" dur="2.6s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Keyword overlap chips */}
          <g fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="500">
            <rect x="268" y="312" width="104" height="24" rx="12" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1" />
            <text x="320" y="328" textAnchor="middle" fill="#4338ca">
              3 skills matched
            </text>
          </g>
        </svg>
      </div>
    </div>
  )
}
