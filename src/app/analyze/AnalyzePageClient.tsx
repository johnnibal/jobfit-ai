'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnalysisInsightsPanel } from '@/components/analyze/AnalysisInsightsPanel'
import { AnalysisResultEmailGate } from '@/components/analyze/AnalysisResultEmailGate'
import type { SubscriptionBillingUi } from '@/components/analyze/AnalysisInsightsPanel'
import { ConversionUpgradeModal, type ConversionUpgradeVariant } from '@/components/analyze/ConversionUpgradeModal'
import {
  consumeProReportCreditForAnalysis,
  demoGrantProReportCredit,
  demoSetMonthlyPro,
  defaultEntitlements,
  readEntitlements,
  writeEntitlements,
  type JobFitStoredEntitlements,
} from '@/lib/jobfitStorage'
import { AppNav } from '@/components/nav/AppNav'
import { getAnalysisQuotaCap } from '@/lib/analysisPermissions'
import { LABEL_BUY_PRO_REPORT, LABEL_SUBSCRIBE_MONTHLY_PRO } from '@/lib/planTypes'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { trackEvent } from '@/lib/analytics/track'

const emptyBilling: SubscriptionBillingUi = {
  loading: false,
  fetched: false,
  monthlyProActive: false,
  subscriptionStatus: 'none',
  email: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  lastPaymentFailedAt: null,
  error: null,
}

function isSuccessfulFitAnalysisOutput(text: string): boolean {
  return /Match Score:\s*\d{1,3}\/100/i.test(text)
}

type GatedAnalysisPayload = {
  analysisId: string
  resultText: string
}

type UsageUiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      monthlyProVerified: boolean
      quotaMode: 'daily' | 'monthly'
      used: number
      limit: number
      remaining: number
      canRun: boolean
    }

export default function AnalyzePageClient() {
  const searchParams = useSearchParams()
  const autosaveIssuedRef = useRef<Set<string>>(new Set())
  const freeResultViewTrackedRef = useRef<string | null>(null)

  const [cv, setCv] = useState('')
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [gatedAnalysis, setGatedAnalysis] = useState<GatedAnalysisPayload | null>(null)
  const [growthEmailNotice, setGrowthEmailNotice] = useState<string | null>(null)
  const [entitlements, setEntitlements] = useState<JobFitStoredEntitlements>(() => defaultEntitlements())
  const [usageUi, setUsageUi] = useState<UsageUiState>({ status: 'loading' })
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean
    variant: ConversionUpgradeVariant
  }>({ open: false, variant: 'conversion' })
  const [billing, setBilling] = useState<SubscriptionBillingUi>(emptyBilling)
  const [proReportGrantedAnalysisIds, setProReportGrantedAnalysisIds] = useState<string[]>([])
  const [subscribeMonthlyBusy, setSubscribeMonthlyBusy] = useState(false)
  const [subscribeMonthlyError, setSubscribeMonthlyError] = useState<string | null>(null)
  const [portalBusy, setPortalBusy] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const refreshUsage = useCallback(() => {
    setUsageUi({ status: 'loading' })

    fetch('/api/usage/status', { credentials: 'include' })
      .then(async (res) => {
        const data: Record<string, unknown> = await res.json()
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not load usage quota.')
        }

        const quotaMode =
          typeof data.quotaMode === 'string' && data.quotaMode === 'monthly' ? 'monthly' : 'daily'

        setUsageUi({
          status: 'ready',
          monthlyProVerified: Boolean(data.monthlyProVerified),
          quotaMode,
          used: typeof data.used === 'number' ? data.used : 0,
          limit: typeof data.limit === 'number' ? data.limit : 1,
          remaining: typeof data.remaining === 'number' ? data.remaining : 0,
          canRun: Boolean(data.canRun),
        })
      })
      .catch((e: unknown) =>
        setUsageUi({
          status: 'error',
          message: e instanceof Error ? e.message : 'Could not load usage quota.',
        })
      )
  }, [])

  const fetchBillingSession = useCallback(() => {
    setBilling((b) => ({ ...b, loading: true, error: null }))
    fetch('/api/billing/session', { credentials: 'include' })
      .then(async (res) => {
        const data: Record<string, unknown> = await res.json()
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not load billing session.')
        }
        setBilling({
          loading: false,
          fetched: true,
          monthlyProActive: Boolean(data.monthlyProActive),
          subscriptionStatus: typeof data.subscriptionStatus === 'string' ? data.subscriptionStatus : 'none',
          email: typeof data.email === 'string' ? data.email : null,
          currentPeriodEnd: typeof data.currentPeriodEnd === 'string' ? data.currentPeriodEnd : null,
          cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
          lastPaymentFailedAt:
            typeof data.lastPaymentFailedAt === 'string' ? data.lastPaymentFailedAt : null,
          error: null,
        })
        const ids = data.proReportGrantedAnalysisIds
        setProReportGrantedAnalysisIds(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [])
      })
      .catch((e: unknown) => {
        setBilling({
          ...emptyBilling,
          loading: false,
          fetched: true,
          error: e instanceof Error ? e.message : 'Billing session failed.',
        })
        setProReportGrantedAnalysisIds([])
      })
      .finally(() => {
        refreshUsage()
      })
  }, [refreshUsage])

  const openUpgradeModal = useCallback((variant: ConversionUpgradeVariant) => {
    setSubscribeMonthlyError(null)
    setUpgradeModal({ open: true, variant })
  }, [])

  useEffect(() => {
    if (searchParams.get('saved') !== '1') return
    openUpgradeModal('conversion')
    window.history.replaceState({}, '', '/analyze')
  }, [searchParams, openUpgradeModal])

  useEffect(() => {
    setEntitlements(readEntitlements())
  }, [])

  useEffect(() => {
    fetchBillingSession()
  }, [fetchBillingSession])

  /** Stripe Checkout returns here after Pro Report payment — persist signed HttpOnly grants cookie via server. */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const id = params.get('pro')
    if (!id) return

    let cancelled = false
    fetch('/api/billing/claim-pro-report-cookie', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisId: id }),
    })
      .finally(() => {
        if (!cancelled) {
          fetchBillingSession()
          window.history.replaceState({}, '', '/analyze')
        }
      })

    return () => {
      cancelled = true
    }
  }, [fetchBillingSession])

  /** After Monthly Pro Checkout — refresh entitlement cookies server-side snapshot */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('sub') !== '1') return
    fetchBillingSession()
    window.history.replaceState({}, '', '/analyze')
  }, [fetchBillingSession])

  const stripeMonthlyActive = billing.fetched && billing.monthlyProActive
  const demoMonthlyActive = !entitlements.stripeCustomerId && entitlements.monthlyProActive
  const monthlyProActive = stripeMonthlyActive || demoMonthlyActive

  const mergedFullyUnlockedAnalysisIds = useMemo(
    () => [...new Set([...proReportGrantedAnalysisIds, ...entitlements.fullyUnlockedAnalysisIds])],
    [proReportGrantedAnalysisIds, entitlements.fullyUnlockedAnalysisIds]
  )

  const reportsAccessMode = useMemo<'monthly_pro' | 'pro_only' | 'none'>(() => {
    if (monthlyProActive) return 'monthly_pro'
    if (proReportGrantedAnalysisIds.length > 0) return 'pro_only'
    return 'none'
  }, [monthlyProActive, proReportGrantedAnalysisIds])

  const maybeTrackFreeResultView = useCallback(
    (id: string, hadEmailGate: boolean) => {
      if (monthlyProActive) return
      if (mergedFullyUnlockedAnalysisIds.includes(id)) return
      if (freeResultViewTrackedRef.current === id) return
      freeResultViewTrackedRef.current = id
      trackEvent('free_result_viewed', { had_email_gate: hadEmailGate })
    },
    [monthlyProActive, mergedFullyUnlockedAnalysisIds]
  )

  const savedReportsNavLocked = !monthlyProActive && reportsAccessMode === 'none'

  const reportsDashboardAllowed = monthlyProActive || reportsAccessMode === 'pro_only'

  useEffect(() => {
    const reportId = searchParams.get('report')
    if (!reportId || !isAnalysisSessionId(reportId)) return

    let cancelled = false
    fetch(`/api/reports/${encodeURIComponent(reportId)}`, { credentials: 'include' })
      .then(async (r) => {
        const data = (await r.json()) as {
          report?: { cvText: string; jdText: string; resultText: string; analysisId: string }
        }
        if (cancelled || !r.ok || !data.report) return
        setCv(data.report.cvText)
        setJd(data.report.jdText)
        setResult(data.report.resultText)
        setAnalysisId(data.report.analysisId)
        setGatedAnalysis(null)
        setGrowthEmailNotice(null)
        autosaveIssuedRef.current.add(data.report.analysisId)
        window.history.replaceState({}, '', '/analyze')
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [searchParams])

  useEffect(() => {
    if (!result || !analysisId) return
    if (autosaveIssuedRef.current.has(analysisId)) return

    const allow = monthlyProActive || proReportGrantedAnalysisIds.includes(analysisId)
    if (!allow) return

    void (async () => {
      try {
        const saveRes = await fetch('/api/reports', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisId,
            cv,
            jd,
            resultText: result,
          }),
        })
        if (saveRes.ok) autosaveIssuedRef.current.add(analysisId)
      } catch {
        /* ignore autosave failures */
      }
    })()
  }, [result, analysisId, cv, jd, monthlyProActive, proReportGrantedAnalysisIds])

  const quotaDisplay = useMemo(() => {
    const fallbackCap = getAnalysisQuotaCap(monthlyProActive)
    const fallbackPeriod = monthlyProActive ? ('month' as const) : ('day' as const)
    if (usageUi.status === 'ready') {
      return {
        quotaUsed: usageUi.used,
        quotaCap: usageUi.limit,
        quotaPeriod: usageUi.quotaMode === 'monthly' ? ('month' as const) : ('day' as const),
        quotaRemaining: usageUi.remaining,
        quotaLoading: false,
        quotaError: null as string | null,
      }
    }
    if (usageUi.status === 'loading') {
      return {
        quotaUsed: 0,
        quotaCap: fallbackCap,
        quotaPeriod: fallbackPeriod,
        quotaRemaining: 0,
        quotaLoading: true,
        quotaError: null as string | null,
      }
    }
    return {
      quotaUsed: 0,
      quotaCap: fallbackCap,
      quotaPeriod: fallbackPeriod,
      quotaRemaining: 0,
      quotaLoading: false,
      quotaError: usageUi.message,
    }
  }, [monthlyProActive, usageUi])

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const typedarray = new Uint8Array(reader.result as ArrayBuffer)
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise
      let extractedText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = (content.items as any[])
          .map((item) => (typeof item?.str === 'string' ? item.str : ''))
          .join(' ')

        extractedText += pageText + '\n\n'
      }

      setCv(extractedText)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (usageUi.status === 'loading') {
      setResult('Usage quota is still loading — please wait a moment.')
      return
    }

    if (usageUi.status === 'error') {
      setResult(usageUi.message)
      return
    }

    if (!usageUi.canRun) {
      openUpgradeModal(usageUi.quotaMode === 'monthly' ? 'quota_monthly' : 'quota_daily')
      return
    }

    setLoading(true)
    setResult(null)
    setAnalysisId(null)
    setGatedAnalysis(null)
    setGrowthEmailNotice(null)

    try {
      trackEvent('analysis_started')

      const res = await fetch('/api/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv,
          jd,
        }),
      })

      let data: {
        message?: unknown
        error?: unknown
        analysisId?: unknown
        fullReportAccess?: unknown
        code?: unknown
        quota?: { mode?: unknown }
      }
      try {
        data = await res.json()
      } catch {
        trackEvent('analysis_completed', { ok: false })
        setResult('Could not read analyzer response.')
        return
      }

      if (res.status === 429 && data.code === 'QUOTA_EXCEEDED') {
        trackEvent('analysis_completed', { ok: false })
        const mode =
          typeof data.quota?.mode === 'string' && data.quota.mode === 'monthly' ? 'monthly' : 'daily'
        openUpgradeModal(mode === 'monthly' ? 'quota_monthly' : 'quota_daily')
        refreshUsage()
        return
      }

      if (!res.ok) {
        trackEvent('analysis_completed', { ok: false })
        const msg =
          typeof data.message === 'string'
            ? data.message
            : typeof data.error === 'string'
              ? data.error
              : 'Request failed.'
        setResult(msg)
        return
      }

      const msg = data.message
      if (!msg || typeof msg !== 'string') {
        trackEvent('analysis_completed', { ok: false })
        const err = typeof data.error === 'string' ? data.error : 'Unexpected response from analyzer.'
        setResult(err)
        return
      }

      const serverIdRaw = typeof data.analysisId === 'string' ? data.analysisId.trim() : ''
      if (!serverIdRaw || !isAnalysisSessionId(serverIdRaw)) {
        trackEvent('analysis_completed', { ok: false })
        setResult('Analysis completed without a server report id — please retry.')
        return
      }

      const id = serverIdRaw
      trackEvent('analysis_completed', { ok: true })

      const serverFullAccess = data.fullReportAccess === true

      /** Growth email gate is for free previews only — paid tiers should see results immediately */
      const skipGrowthEmailGate =
        monthlyProActive ||
        (usageUi.status === 'ready' && usageUi.monthlyProVerified) ||
        serverFullAccess

      if (isSuccessfulFitAnalysisOutput(msg) && !skipGrowthEmailGate) {
        setGatedAnalysis({ analysisId: id, resultText: msg })
      } else {
        setGatedAnalysis(null)
        setAnalysisId(id)
        setResult(msg)
        if (!skipGrowthEmailGate) {
          maybeTrackFreeResultView(id, false)
        }
      }

      void fetchBillingSession()
    } catch {
      trackEvent('analysis_completed', { ok: false })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyProReportCredit = () => {
    if (!analysisId) return
    setEntitlements((prev) => {
      const next = consumeProReportCreditForAnalysis(prev, analysisId)
      if (!next) return prev
      writeEntitlements(next)
      return next
    })
  }

  const handleDemoAddProCredit = () => {
    setEntitlements((prev) => {
      const next = demoGrantProReportCredit(prev)
      writeEntitlements(next)
      return next
    })
  }

  const handleDemoToggleMonthlyPro = () => {
    setEntitlements((prev) => {
      const next = demoSetMonthlyPro(prev, !prev.monthlyProActive)
      writeEntitlements(next)
      return next
    })
  }

  const handleSubscribeMonthly = async (checkoutSurface: string = 'insights_billing') => {
    trackEvent('stripe_checkout_started', { product: 'monthly_pro', surface: checkoutSurface })
    setSubscribeMonthlyError(null)
    setSubscribeMonthlyBusy(true)
    try {
      const res = await fetch('/api/checkout/monthly-pro', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data: { url?: unknown; error?: unknown; fallbackDemo?: unknown } = await res.json()

      if (!res.ok) {
        if (res.status === 503 && data.fallbackDemo) {
          setSubscribeMonthlyError(
            typeof data.error === 'string'
              ? data.error
              : 'Configure DATABASE_URL, Stripe keys, and STRIPE_MONTHLY_PRO_PRICE_ID.'
          )
          return
        }
        throw new Error(typeof data.error === 'string' ? data.error : 'Checkout failed.')
      }

      if (typeof data.url === 'string' && data.url.startsWith('http')) {
        window.location.href = data.url
        return
      }
      throw new Error('Invalid checkout response.')
    } catch (e) {
      setSubscribeMonthlyError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSubscribeMonthlyBusy(false)
    }
  }

  const handleOpenPortal = async () => {
    setPortalError(null)
    setPortalBusy(true)
    try {
      const res = await fetch('/api/billing/portal-session', {
        method: 'POST',
        credentials: 'include',
      })
      const data: { url?: unknown; error?: unknown } = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Portal failed.')
      }
      if (typeof data.url === 'string' && data.url.startsWith('http')) {
        window.location.href = data.url
        return
      }
      throw new Error('Invalid portal URL.')
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : 'Portal error.')
    } finally {
      setPortalBusy(false)
    }
  }

  const submitDisabled = loading || usageUi.status === 'loading' || usageUi.status === 'error'

  const hasStripeBillingHistory = billing.fetched && billing.subscriptionStatus !== 'none'

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <ConversionUpgradeModal
        open={upgradeModal.open}
        variant={upgradeModal.variant}
        onClose={() => setUpgradeModal((m) => ({ ...m, open: false }))}
        analysisId={analysisId}
        subscriberMonthlyPro={billing.fetched && billing.monthlyProActive}
        proReportCreditsCount={entitlements.proReportCredits.length}
        onApplyProReportCredit={handleApplyProReportCredit}
        onUpgradeMonthly={() => handleSubscribeMonthly('conversion_modal')}
        subscribeMonthlyBusy={subscribeMonthlyBusy}
        subscribeMonthlyError={subscribeMonthlyError}
        hasStripeBillingHistory={hasStripeBillingHistory}
        onOpenCustomerPortal={handleOpenPortal}
        portalBusy={portalBusy}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.18),_transparent_30%)]" />
      <div className="absolute left-10 top-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-12 right-12 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl" />

      <section className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/70 pb-6">
          <Link href="/" className="text-sm font-semibold tracking-tight text-slate-100 hover:text-cyan-200">
            JobFit AI
          </Link>
          <AppNav
            monthlyProActive={monthlyProActive}
            savedReportsLocked={savedReportsNavLocked}
            onLockedSavedReports={() => {
              trackEvent('locked_feature_clicked', { feature: 'saved_reports_nav' })
              openUpgradeModal('conversion')
            }}
          />
        </div>

        <div className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-900/70 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            AI-powered fit scoring
          </div>

          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Analyze your
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
              {' '}
              CV against the role
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Upload your resume, paste the job description, and let JobFit.AI highlight alignment, gaps, and opportunities
            to improve your application.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-8"
          >
            <div className="grid gap-6">
              {usageUi.status === 'ready' && !usageUi.canRun ? (
                <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
                  You have no analyses left this period until quota resets — use{' '}
                  <span className="font-semibold text-amber-50">{LABEL_BUY_PRO_REPORT}</span> for one paid run + full report,
                  or <span className="font-semibold text-amber-50">{LABEL_SUBSCRIBE_MONTHLY_PRO}</span> if you apply often.
                </div>
              ) : null}

              {usageUi.status === 'error' ? (
                <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm leading-relaxed text-rose-100">
                  {usageUi.message}
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Upload CV (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-cyan-400 file:to-violet-500 file:px-5 file:py-3 file:font-semibold file:text-slate-950 hover:file:brightness-110"
                />
                <p className="mt-3 text-sm text-slate-400">
                  Upload a PDF to auto-fill your CV text, then edit it if needed.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  CV Text
                </label>
                <textarea
                  value={cv}
                  onChange={(e) => setCv(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Paste your resume text or upload a PDF..."
                  required
                />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                  Job Description
                </label>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                  placeholder="Paste the job description here..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitDisabled}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-7 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(56,189,248,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? 'Analyzing your fit...'
                  : usageUi.status === 'loading'
                    ? 'Loading quota…'
                    : usageUi.status === 'error'
                      ? 'Quota unavailable'
                      : !usageUi.canRun
                        ? 'Quota reached — upgrade'
                        : 'Analyze Match'}
              </button>
            </div>
          </form>

          <div className="flex min-w-0 flex-col gap-4">
            {growthEmailNotice ? (
              <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm leading-relaxed text-cyan-100/95">
                {growthEmailNotice}
              </div>
            ) : null}
            <AnalysisInsightsPanel
              result={result}
              monthlyProActive={monthlyProActive}
              subscriberMonthlyPro={billing.fetched && billing.monthlyProActive}
              analysisId={analysisId}
              fullyUnlockedAnalysisIds={mergedFullyUnlockedAnalysisIds}
              proReportCreditsCount={entitlements.proReportCredits.length}
              quotaUsed={quotaDisplay.quotaUsed}
              quotaCap={quotaDisplay.quotaCap}
              quotaPeriod={quotaDisplay.quotaPeriod}
              quotaRemaining={quotaDisplay.quotaRemaining}
              quotaLoading={quotaDisplay.quotaLoading}
              quotaError={quotaDisplay.quotaError}
              billing={billing}
              onRefreshBilling={fetchBillingSession}
              onSubscribeMonthly={() => handleSubscribeMonthly('insights_billing')}
              subscribeMonthlyBusy={subscribeMonthlyBusy}
              subscribeMonthlyError={subscribeMonthlyError}
              onOpenCustomerPortal={handleOpenPortal}
              portalBusy={portalBusy}
              portalError={portalError}
              onApplyProReportCredit={handleApplyProReportCredit}
              onDemoAddProCredit={handleDemoAddProCredit}
              onDemoToggleMonthlyPro={handleDemoToggleMonthlyPro}
              onOpenUpgradeModal={
                monthlyProActive ? undefined : () => openUpgradeModal('conversion')
              }
              savedReportsDashboardAllowed={reportsDashboardAllowed}
              emptyStateOverride={
                gatedAnalysis ? (
                  <AnalysisResultEmailGate
                    analysisId={gatedAnalysis.analysisId}
                    onRelease={(opts) => {
                      const g = gatedAnalysis
                      setGrowthEmailNotice(opts.emailSaveNotice)
                      setResult(g.resultText)
                      setAnalysisId(g.analysisId)
                      setGatedAnalysis(null)
                      maybeTrackFreeResultView(g.analysisId, true)
                    }}
                  />
                ) : undefined
              }
              cvText={cv}
              jobDescription={jd}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
