'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AppNav } from '@/components/nav/AppNav'
import { demoGrantProReportCredit, demoSetMonthlyPro, defaultEntitlements, readEntitlements, writeEntitlements } from '@/lib/jobfitStorage'
import { useBillingSandboxEnvironment } from '@/lib/billing/useBillingSandboxEnvironment'

type ReportRow = {
  analysisId: string
  jobTitle: string | null
  companyName: string | null
  fitScore: number | null
  tier: string
  createdAt: string
  statusLabel: string
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
    if (savedReportsNavLocked) return 'Subscribe to Monthly Pro or purchase a Pro Report to sync analyses here.'
    return 'Run an analysis on the analyzer — qualifying sessions autosave to this list.'
  }, [savedReportsNavLocked])

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.14),_transparent_30%)]" />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/70 pb-6">
          <Link href="/" className="text-sm font-semibold tracking-tight text-slate-100 hover:text-cyan-200">
            JobFit AI
          </Link>
          <AppNav
            monthlyProActive={monthlyProActive}
            savedReportsLocked={savedReportsNavLocked}
            onLockedSavedReports={() => {
              window.location.href = '/analyze?saved=1'
            }}
          />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-50">Saved reports</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Access uses secure HttpOnly cookies issued after Stripe checkout confirmation. Monthly Pro keeps your full
            library; one-time Pro Report snapshots appear when the entitlement cookie lists that analysis.
          </p>
        </div>

        {savedReportsNavLocked ? (
          <div className="rounded-[28px] border border-violet-500/25 bg-violet-500/[0.06] p-8 text-center shadow-inner">
            <p className="text-sm font-semibold text-violet-100">Saved Reports are part of Monthly Pro or Pro Report.</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Unlock Monthly Pro for multiple autosaved analyses, or purchase Pro Report to retain that posting&apos;s snapshot.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/analyze?saved=1'
              }}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full border border-violet-400/45 bg-violet-500/15 px-6 py-2.5 text-sm font-semibold text-violet-50 transition hover:bg-violet-500/25"
            >
              View upgrade options
            </button>
          </div>
        ) : null}

        {!savedReportsNavLocked ? (
          <>
            {error ? (
              <div className="mb-6 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {error}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/60 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl">
              {loading ? (
                <p className="p-8 text-sm text-slate-500">Loading your reports…</p>
              ) : reports.length === 0 ? (
                <p className="p-8 text-sm leading-relaxed text-slate-500">{emptyHint}</p>
              ) : (
                <div className="divide-y divide-slate-800/90">
                  <div className="hidden gap-4 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.75fr)_minmax(0,0.55fr)_minmax(0,0.85fr)_auto]">
                    <span>Role / company</span>
                    <span>Fit score</span>
                    <span>Status</span>
                    <span>Saved</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {reports.map((r) => (
                    <div
                      key={r.analysisId}
                      className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.75fr)_minmax(0,0.55fr)_minmax(0,0.85fr)_auto]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-100">
                          {r.jobTitle?.trim() || 'Untitled role'}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">{r.companyName?.trim() || '—'}</div>
                      </div>
                      <div className="text-sm tabular-nums text-cyan-200/95">
                        {typeof r.fitScore === 'number' ? `${r.fitScore}%` : '—'}
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{r.statusLabel}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 md:flex-col md:items-end">
                        <Link
                          href={`/analyze?report=${encodeURIComponent(r.analysisId)}`}
                          className="rounded-full border border-slate-600 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-cyan-400/35"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          disabled={deleteBusyId === r.analysisId}
                          onClick={() => void handleDelete(r.analysisId)}
                          className="rounded-full border border-rose-900/45 bg-rose-950/30 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-950/50 disabled:opacity-45"
                        >
                          {deleteBusyId === r.analysisId ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {billingSandboxVisible ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-700/90 bg-slate-950/40 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Billing sandbox</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEntitlements((prev) => {
                        const next = demoGrantProReportCredit(prev)
                        writeEntitlements(next)
                        return next
                      })
                    }
                    className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-violet-400/35"
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
                    className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400/35"
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
