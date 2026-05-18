'use client'

import Link from 'next/link'
import { badge, navLink } from '@/components/ui/theme'

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
    <nav className="flex flex-wrap items-center gap-5">
      <Link href="/analyze" className={navLink}>
        Analyze
      </Link>
      {savedReportsLocked ? (
        <button
          type="button"
          onClick={() => onLockedSavedReports?.()}
          className={`inline-flex items-center gap-1.5 ${navLink} text-zinc-400`}
        >
          <LockGlyph className="text-zinc-400" />
          Saved Reports
        </button>
      ) : (
        <Link href="/dashboard/reports" className={navLink}>
          Saved Reports
          {monthlyProActive ? (
            <span className={`${badge} ml-1.5`}>Pro</span>
          ) : null}
        </Link>
      )}
      <Link href="/pricing" className={navLink}>
        Pricing
      </Link>
      <Link href="/pro-report" className={navLink}>
        Pro Report
      </Link>
    </nav>
  )
}
