'use client'

import Link from 'next/link'
import { badge, navBtn } from '@/components/ui/theme'

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

const navItemClass = `${navBtn} w-full justify-center sm:w-auto`

export type AppNavProps = {
  monthlyProActive: boolean
  savedReportsLocked: boolean
  onLockedSavedReports?: () => void
  className?: string
}

export function AppNav({
  monthlyProActive,
  savedReportsLocked,
  onLockedSavedReports,
  className,
}: AppNavProps) {
  return (
    <nav
      className={`grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-2 ${className ?? ''}`}
      aria-label="Primary"
    >
      <Link href="/analyze" className={navItemClass}>
        Analyze
      </Link>
      {savedReportsLocked ? (
        <button
          type="button"
          onClick={() => onLockedSavedReports?.()}
          className={`inline-flex items-center justify-center gap-1.5 ${navItemClass} opacity-60`}
        >
          <LockGlyph className="shrink-0 opacity-60" />
          <span className="sm:hidden">Reports</span>
          <span className="hidden sm:inline">Saved Reports</span>
        </button>
      ) : (
        <Link href="/dashboard/reports" className={navItemClass}>
          <span className="sm:hidden">Reports</span>
          <span className="hidden sm:inline">Saved Reports</span>
          {monthlyProActive ? (
            <span className={`${badge} ml-1.5 hidden sm:inline-flex`}>Pro</span>
          ) : null}
        </Link>
      )}
      <Link href="/pricing" className={navItemClass}>
        Pricing
      </Link>
      <Link href="/pro-report" className={navItemClass}>
        <span className="sm:hidden">Pro</span>
        <span className="hidden sm:inline">Pro Report</span>
      </Link>
    </nav>
  )
}
