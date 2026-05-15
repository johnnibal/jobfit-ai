'use client'

import Link from 'next/link'

function LockGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M7 11V8a5 5 0 0110 0v3" />
    </svg>
  )
}

export type AppNavProps = {
  monthlyProActive: boolean
  savedReportsLocked: boolean
  onLockedSavedReports?: () => void
}

export function AppNav({ monthlyProActive, savedReportsLocked, onLockedSavedReports }: AppNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-5 text-sm font-medium">
      <Link href="/analyze" className="text-slate-300 transition hover:text-cyan-200">
        Analyze
      </Link>
      {savedReportsLocked ? (
        <button
          type="button"
          onClick={() => onLockedSavedReports?.()}
          className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-violet-200"
        >
          <LockGlyph className="text-violet-400/90" />
          Saved Reports
        </button>
      ) : (
        <Link href="/dashboard/reports" className="text-slate-300 transition hover:text-violet-200">
          Saved Reports
          {monthlyProActive ? (
            <span className="ml-1.5 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-100">
              Pro
            </span>
          ) : null}
        </Link>
      )}
      <Link href="/pricing" className="text-slate-400 transition hover:text-slate-200">
        Pricing
      </Link>
    </nav>
  )
}
