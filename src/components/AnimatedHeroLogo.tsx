export default function AnimatedHeroLogo() {
  return (
    <div className="mb-6 w-[280px] sm:w-[360px] md:w-[440px]">
      <svg
        viewBox="0 0 640 420"
        role="img"
        aria-label="Animated JobFit AI logo showing a resume and job description being analyzed by AI"
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="cardGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="lensClip">
            <circle cx="320" cy="190" r="98" />
          </clipPath>
        </defs>

        <rect x="0" y="0" width="640" height="420" rx="32" fill="url(#bgGradient)" />

        <g opacity="0.12">
          <circle cx="110" cy="88" r="56" fill="#38bdf8" />
          <circle cx="538" cy="324" r="72" fill="#8b5cf6" />
        </g>

        <g>
          <rect x="36" y="96" width="170" height="238" rx="20" fill="url(#cardGlow)" stroke="#334155" />
          <text x="60" y="145" fill="#e2e8f0" fontSize="24" fontWeight="700">
            CV
          </text>
          <rect x="60" y="164" width="100" height="10" rx="5" fill="#38bdf8" opacity="0.9" />
          <rect x="60" y="190" width="118" height="8" rx="4" fill="#475569" />
          <rect x="60" y="210" width="92" height="8" rx="4" fill="#475569" />
          <rect x="60" y="230" width="104" height="8" rx="4" fill="#475569" />
          <rect x="56" y="256" width="92" height="26" rx="13" fill="#082f49" stroke="#38bdf8" />
          <text x="102" y="273" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600">
            Python
          </text>
          <rect x="56" y="290" width="70" height="26" rx="13" fill="#082f49" stroke="#38bdf8" />
          <text x="91" y="307" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600">
            SQL
          </text>
        </g>

        <g>
          <rect x="434" y="96" width="170" height="238" rx="20" fill="url(#cardGlow)" stroke="#334155" />
          <text x="458" y="145" fill="#e2e8f0" fontSize="24" fontWeight="700">
            JD
          </text>
          <rect x="458" y="164" width="116" height="10" rx="5" fill="#a78bfa" opacity="0.9" />
          <rect x="458" y="190" width="106" height="8" rx="4" fill="#475569" />
          <rect x="458" y="210" width="92" height="8" rx="4" fill="#475569" />
          <rect x="458" y="230" width="112" height="8" rx="4" fill="#475569" />
          <rect x="454" y="256" width="66" height="26" rx="13" fill="#2e1065" stroke="#a78bfa" />
          <text x="487" y="273" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600">
            NLP
          </text>
          <rect x="454" y="290" width="72" height="26" rx="13" fill="#2e1065" stroke="#a78bfa" />
          <text x="490" y="307" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600">
            APIs
          </text>
        </g>
        <path
          d="M 362 186 C 392 174, 410 184, 434 212"
          fill="none"
          stroke="url(#accentGradient)"
          strokeWidth="4"
          strokeDasharray="8 10"
          strokeLinecap="round"
          opacity="0.9"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-36" dur="2s" repeatCount="indefinite" />
        </path>

        <g filter="url(#softGlow)">
          <circle cx="320" cy="190" r="112" fill="none" stroke="#38bdf8" strokeWidth="14" opacity="0.2" />
        </g>

        <g>
          <circle cx="320" cy="190" r="108" fill="rgba(15, 23, 42, 0.7)" stroke="#e2e8f0" strokeWidth="14" />
          <circle cx="320" cy="190" r="98" fill="rgba(2, 6, 23, 0.92)" stroke="url(#accentGradient)" strokeWidth="2" />

          <g clipPath="url(#lensClip)">
            <rect x="222" y="86" width="196" height="208" fill="rgba(56, 189, 248, 0.03)" />
            <rect x="222" y="96" width="196" height="14" fill="#22d3ee" opacity="0.25">
              <animate attributeName="y" values="96;258;96" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3.2s" repeatCount="indefinite" />
            </rect>
          </g>

          <text x="320" y="182" textAnchor="middle" fill="url(#accentGradient)" fontSize="72" fontWeight="800">
            AI
            <animate attributeName="opacity" values="0.92;1;0.92" dur="2.8s" repeatCount="indefinite" />
          </text>
          <text x="320" y="224" textAnchor="middle" fill="#cbd5e1" fontSize="18" letterSpacing="4">
            MATCHING
          </text>
        </g>

        <path
          d="M397 265 L502 370"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <circle cx="509" cy="377" r="23" fill="#22d3ee" opacity="0.18">
          <animate attributeName="r" values="20;26;20" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.12;0.26;0.12" dur="2.4s" repeatCount="indefinite" />
        </circle>

        <g>
          <circle cx="510" cy="78" r="34" fill="#0f172a" stroke="#22d3ee" />
          <circle cx="510" cy="78" r="40" fill="none" stroke="#22d3ee" opacity="0.35">
            <animate attributeName="r" values="34;42;34" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0.08;0.35" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <text x="510" y="72" textAnchor="middle" fill="#e2e8f0" fontSize="12" letterSpacing="2">
            FIT
          </text>
          <text x="510" y="92" textAnchor="middle" fill="#22d3ee" fontSize="20" fontWeight="700">
            92%
          </text>
        </g>

        <g fill="#93c5fd">
          <circle cx="238" cy="74" r="4">
            <animate attributeName="opacity" values="0.15;1;0.15" dur="1.7s" repeatCount="indefinite" />
          </circle>
          <circle cx="410" cy="64" r="3">
            <animate attributeName="opacity" values="1;0.15;1" dur="1.9s" repeatCount="indefinite" />
          </circle>
          <circle cx="214" cy="312" r="3">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="426" cy="298" r="4">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  )
}
