'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AppNav } from '@/components/nav/AppNav'
import {
  demoGrantProReportCredit,
  demoSetMonthlyPro,
  defaultEntitlements,
  readEntitlements,
  writeEntitlements,
} from '@/lib/jobfitStorage'
import { useBillingSandboxEnvironment } from '@/lib/billing/useBillingSandboxEnvironment'
import {
  alertError,
  alertWarning,
  brandDot,
  brandMark,
  btnGhost,
  btnPrimary,
  btnPrimaryFull,
  btnSecondary,
  btnSecondaryFull,
  card,
  cardPadding,
  headerBar,
  labelCaps,
  pageContainer,
  pageMain,
  textMuted,
} from '@/components/ui/theme'

type ReportRow = {
  analysisId: string
  jobTitle: string | null
  companyName: string | null
  fitScore: number | null
  tier: string
  createdAt: string
  statusLabel: string
}

function formatSavedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function ReportMobileCard({
  report,
  deleteBusy,
  onDelete,
}: {
  report: ReportRow
  deleteBusy: boolean
  onDelete: () => void
}) {
  const jobTitle = report.jobTitle?.trim() || 'Untitled role'
  const company = report.companyName?.trim() || 'No company listed'
  const fitScore =
    typeof report.fitScore === 'number' ? `${report.fitScore}%` : '—'

  return (
    <article className={`${card} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold leading-snug text-onyx [overflow-wrap:anywhere]">
            {jobTitle}
          </h2>
          <p className={`mt-1 text-xs leading-relaxed ${textMuted} [overflow-wrap:anywhere]`}>{company}</p>
        </div>
        <div className="shrink-0 rounded-[10px] border border-ash/90 bg-ash/10 px-2.5 py-1.5 text-center">
          <p className="text-lg font-semibold tabular-nums leading-none text-brick">{fitScore}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-dim">Fit</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ash/40 pt-4">
        <div>
          <dt className={labelCaps}>Status</dt>
          <dd className="mt-1 text-xs font-semibold uppercase tracking-wide text-onyx">{report.statusLabel}</dd>
        </div>
        <div>
          <dt className={labelCaps}>Saved</dt>
          <dd className={`mt-1 text-xs leading-relaxed ${textMuted}`}>{formatSavedAt(report.createdAt)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={`/analyze?report=${encodeURIComponent(report.analysisId)}`}
          className={btnPrimaryFull}
        >
          Open report
        </Link>
        <button
          type="button"
          disabled={deleteBusy}
          onClick={onDelete}
          className={`${btnGhost} min-h-11 w-full`}
        >
          {deleteBusy ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

function ReportDesktopRow({
  report,
  deleteBusy,
  onDelete,
}: {
  report: ReportRow
  deleteBusy: boolean
  onDelete: () => void
}) {
  return (
    <article className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.75fr)_minmax(0,0.55fr)_minmax(0,0.85fr)_auto] items-center gap-4 px-6 py-5">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-onyx">
          {report.jobTitle?.trim() || 'Untitled role'}
        </div>
        <div className={`mt-1 truncate text-xs ${textMuted}`}>
          {report.companyName?.trim() || 'None'}
        </div>
      </div>
      <div className="text-sm tabular-nums text-onyx">
        {typeof report.fitScore === 'number' ? `${report.fitScore}%` : 'None'}
      </div>
      <div className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>{report.statusLabel}</div>
      <div className={`text-xs ${textMuted}`}>{formatSavedAt(report.createdAt)}</div>
      <div className="flex justify-end gap-2">
        <Link
          href={`/analyze?report=${encodeURIComponent(report.analysisId)}`}
          className={`${btnSecondary} min-h-9 px-4 py-2 text-xs`}
        >
          Open
        </Link>
        <button
          type="button"
          disabled={deleteBusy}
          onClick={onDelete}
          className={`${btnGhost} min-h-9 px-4 py-2 text-xs`}
        >
          {deleteBusy ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

export default function DashboardReportsClient() {
  const [entitlements, setEntitlements] = useState(defaultEntitlements())
  const [billingMonthlyActive, setBillingMonthlyActive] = useState(false)
  const [billingFetched, setBillingFetched] = useState(false)
  const [reportsAccessMode, setReportsAccessMode] = useState<'monthly_pro' | 'pro_only' | 'none' | null>(null)
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null)
  const billingSandboxVisible = useBillingSandboxEnvironment()

  useEffect(() => {
    setEntitlements(readEntitlements())
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const sessionRes = await fetch('/api/billing/session', { credentials: 'include' })
        const session = (await sessionRes.json()) as Record<string, unknown>
        if (cancelled) return
        setBillingFetched(true)
        setBillingMonthlyActive(Boolean(session.monthlyProActive))

        const accessRes = await fetch('/api/reports/access', { credentials: 'include' })
        const accessData = (await accessRes.json()) as { mode?: string }
        if (cancelled) return
        const rawMode = accessData.mode
        const mode =
          rawMode === 'monthly_pro' || rawMode === 'pro_only' || rawMode === 'none' ? rawMode : 'none'
        setReportsAccessMode(mode)

        const demoMonthly = !entitlements.stripeCustomerId && entitlements.monthlyProActive
        const mergedMonthly = Boolean(session.monthlyProActive) || demoMonthly

        if (mode === 'none' && !mergedMonthly) {
          setReports([])
          return
        }

        if (mode === 'none') {
          setReports([])
          return
        }

        const listRes = await fetch('/api/reports', { credentials: 'include' })
        const listData = (await listRes.json()) as { reports?: ReportRow[]; error?: string }
        if (cancelled) return
        if (!listRes.ok) {
          setError(typeof listData.error === 'string' ? listData.error : 'Could not load reports.')
          setReports([])
          return
        }
        setReports(Array.isArray(listData.reports) ? listData.reports : [])
      } catch {
        if (!cancelled) setError('Could not load reports.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [entitlements.stripeCustomerId, entitlements.monthlyProActive])

  const stripeMonthlyActive = billingFetched && billingMonthlyActive
  const demoMonthlyActive = !entitlements.stripeCustomerId && entitlements.monthlyProActive
  const monthlyProActive = stripeMonthlyActive || demoMonthlyActive

  const savedReportsNavLocked = !monthlyProActive && reportsAccessMode === 'none'

  const handleDelete = async (analysisId: string) => {
    if (!window.confirm('Delete this saved report from your library?')) return

    setDeleteBusyId(analysisId)
    setError(null)
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(analysisId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Delete failed.')
      }
      setReports((prev) => prev.filter((r) => r.analysisId !== analysisId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.')
    } finally {
      setDeleteBusyId(null)
    }
  }

  const emptyHint = useMemo(() => {
    if (savedReportsNavLocked) {
      return 'Subscribe to Monthly Pro or purchase a Pro Report to sync analyses here.'
    }
    return 'Run an analysis on the analyzer. Qualifying sessions autosave to this list.'
  }, [savedReportsNavLocked])

  return (
    <main className={pageMain}>
      <div className={`${pageContainer} pb-16 pt-6 sm:pb-20 sm:pt-10`}>
        <header className={headerBar}>
          <Link href="/" className={`${brandMark} shrink-0`}>
            <span className={brandDot} aria-hidden />
            JobFit AI
          </Link>
          <AppNav
            monthlyProActive={monthlyProActive}
            savedReportsLocked={savedReportsNavLocked}
            onLockedSavedReports={() => {
              window.location.href = '/analyze?saved=1'
            }}
          />
        </header>

        <div className="mb-6 mt-6 sm:mb-8 sm:mt-8">
          <h1 className="text-[1.75rem] font-bold leading-tight text-onyx sm:text-[2rem]">Saved reports</h1>
          <p className={`mt-3 max-w-2xl text-sm leading-relaxed sm:text-base ${textMuted}`}>
            <span className="sm:hidden">Your saved CV–job analyses. Tap a report to reopen it in the analyzer.</span>
            <span className="hidden sm:inline">
              Access uses secure HttpOnly cookies issued after Stripe checkout confirmation. Monthly Pro keeps your
              full library; one-time Pro Report snapshots appear when the entitlement cookie lists that analysis.
            </span>
          </p>
        </div>

        {savedReportsNavLocked ? (
          <div className={`${card} ${cardPadding} text-center`}>
            <p className="text-sm font-semibold text-onyx">Saved Reports are part of Monthly Pro or Pro Report.</p>
            <p className={`mt-2 text-sm ${textMuted}`}>
              Unlock Monthly Pro for multiple autosaved analyses, or purchase Pro Report to retain that posting&apos;s
              snapshot.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/analyze?saved=1'
              }}
              className={`${btnPrimaryFull} mt-6 sm:mx-auto sm:max-w-xs`}
            >
              View upgrade options
            </button>
          </div>
        ) : null}

        {!savedReportsNavLocked ? (
          <>
            {error ? <div className={`mb-4 sm:mb-6 ${alertError}`}>{error}</div> : null}

            {loading ? (
              <p className={`${card} ${cardPadding} ${textMuted}`}>Loading your reports…</p>
            ) : reports.length === 0 ? (
              <div className={`${card} ${cardPadding} text-center`}>
                <p className={textMuted}>{emptyHint}</p>
                <Link href="/analyze" className={`${btnPrimary} mt-6 inline-flex px-6`}>
                  Go to analyzer
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {reports.map((r) => (
                    <ReportMobileCard
                      key={r.analysisId}
                      report={r}
                      deleteBusy={deleteBusyId === r.analysisId}
                      onDelete={() => void handleDelete(r.analysisId)}
                    />
                  ))}
                </div>

                <div className={`hidden overflow-hidden md:block ${card}`}>
                  <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.75fr)_minmax(0,0.55fr)_minmax(0,0.85fr)_auto] gap-4 border-b border-ash/60 px-6 py-3">
                    <span className={labelCaps}>Role / company</span>
                    <span className={labelCaps}>Fit score</span>
                    <span className={labelCaps}>Status</span>
                    <span className={labelCaps}>Saved</span>
                    <span className={`${labelCaps} text-right`}>Actions</span>
                  </div>
                  <div className="divide-y divide-ash/60">
                    {reports.map((r) => (
                      <ReportDesktopRow
                        key={r.analysisId}
                        report={r}
                        deleteBusy={deleteBusyId === r.analysisId}
                        onDelete={() => void handleDelete(r.analysisId)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {billingSandboxVisible ? (
              <div className={`mt-6 sm:mt-8 ${alertWarning}`}>
                <p className={labelCaps}>Billing sandbox</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      setEntitlements((prev) => {
                        const next = demoGrantProReportCredit(prev)
                        writeEntitlements(next)
                        return next
                      })
                    }
                    className={`${btnSecondaryFull} sm:w-auto sm:px-4 sm:py-2 sm:text-xs`}
                  >
                    Simulate Pro Report (+1 credit)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEntitlements((prev) => {
                        const next = demoSetMonthlyPro(prev, !prev.monthlyProActive)
                        writeEntitlements(next)
                        return next
                      })
                    }
                    className={`${btnSecondaryFull} sm:w-auto sm:px-4 sm:py-2 sm:text-xs`}
                  >
                    Toggle Monthly Pro demo
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  )
}
