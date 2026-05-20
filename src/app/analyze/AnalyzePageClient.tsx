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
import { MONTHLY_PRO_ANALYSES_PER_MONTH } from '@/lib/planTypes'
import { LABEL_BUY_PRO_REPORT, LABEL_SUBSCRIBE_MONTHLY_PRO } from '@/lib/planTypes'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { localBillingSandboxActive } from '@/lib/billing/localBillingSandbox'
import { trackEvent } from '@/lib/analytics/track'
import { isFitAnalysisOutput } from '@/lib/parseAnalysis'
import { parseAnalyzeSuccessBody } from '@/lib/analyze/buildAnalysisPreview'
import type { LockedPreviewMetadata } from '@/lib/analyze/analysisResponseTypes'
import { extractTextFromPdfFile } from '@/lib/pdf/extractPdfText'
import {
  alertError,
  alertInfo,
  alertWarning,
  analyzerFormCard,
  analyzerFormHeading,
  analyzerFormHint,
  analyzerFormLabel,
  analyzerFormSubheading,
  analyzerFormSubmit,
  cardPadding,
  formFieldGroup,
  inputSurface,
  analyzerPageContainer,
  brandDot,
  brandMark,
  headerBar,
  pageMain,
  textMuted,
} from '@/components/ui/theme'

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

type GatedAnalysisPayload = {
  analysisId: string
  resultText: string
  lockedPreview: LockedPreviewMetadata | null
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
  const shouldScrollToResultsRef = useRef(false)
  const gatedAnalysisRef = useRef<GatedAnalysisPayload | null>(null)

  const [cv, setCv] = useState('')
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [serverLockedPreview, setServerLockedPreview] = useState<LockedPreviewMetadata | null>(null)
  const [resultIsPreview, setResultIsPreview] = useState(false)
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
  const [cvUploadBusy, setCvUploadBusy] = useState(false)
  const [cvUploadError, setCvUploadError] = useState<string | null>(null)

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

  useEffect(() => {
    gatedAnalysisRef.current = gatedAnalysis
  }, [gatedAnalysis])

  useEffect(() => {
    if (!shouldScrollToResultsRef.current || loading) return
    if (!result && !gatedAnalysis) return
    requestAnimationFrame(() => {
      if (!shouldScrollToResultsRef.current) return
      shouldScrollToResultsRef.current = false
      const targetId = gatedAnalysis ? 'jobfit-email-gate' : 'jobfit-analysis-results'
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [loading, result, gatedAnalysis])

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

  /** After Pro unlock or Monthly Pro, fetch full report text stored server-side. */
  useEffect(() => {
    if (!analysisId || !resultIsPreview) return

    const entitled =
      monthlyProActive ||
      (usageUi.status === 'ready' && usageUi.monthlyProVerified) ||
      mergedFullyUnlockedAnalysisIds.includes(analysisId) ||
      proReportGrantedAnalysisIds.includes(analysisId)

    if (!entitled) return

    let cancelled = false
    void fetch(`/api/analyze/result?analysisId=${encodeURIComponent(analysisId)}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = (await res.json()) as Record<string, unknown>
        if (cancelled || !res.ok) return
        const parsed = parseAnalyzeSuccessBody(data)
        if (!parsed?.fullReportAccess) return
        setResult(parsed.displayMessage)
        setServerLockedPreview(null)
        setResultIsPreview(false)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [
    analysisId,
    resultIsPreview,
    monthlyProActive,
    usageUi,
    mergedFullyUnlockedAnalysisIds,
    proReportGrantedAnalysisIds,
  ])

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

  const releaseGatedAnalysis = useCallback(
    (opts: { emailSaveNotice: string | null }) => {
      const g = gatedAnalysisRef.current
      if (!g) return
      setGrowthEmailNotice(opts.emailSaveNotice)
      setResult(g.resultText)
      setAnalysisId(g.analysisId)
      setServerLockedPreview(g.lockedPreview)
      setGatedAnalysis(null)
      setResultIsPreview(true)
      shouldScrollToResultsRef.current = true
      maybeTrackFreeResultView(g.analysisId, true)
    },
    [maybeTrackFreeResultView]
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
        setServerLockedPreview(null)
        setResultIsPreview(false)
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
      const demoMonthly = monthlyProActive && !usageUi.monthlyProVerified
      return {
        quotaUsed: demoMonthly ? 0 : usageUi.used,
        quotaCap: demoMonthly ? MONTHLY_PRO_ANALYSES_PER_MONTH : usageUi.limit,
        quotaPeriod:
          demoMonthly || usageUi.quotaMode === 'monthly' ? ('month' as const) : ('day' as const),
        quotaRemaining: demoMonthly ? MONTHLY_PRO_ANALYSES_PER_MONTH : usageUi.remaining,
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
    e.target.value = ''
    if (!file) return

    setCvUploadError(null)
    setCvUploadBusy(true)
    try {
      const extractedText = await extractTextFromPdfFile(file)
      setCv(extractedText)
    } catch (err) {
      setCvUploadError(err instanceof Error ? err.message : 'Could not read this PDF.')
    } finally {
      setCvUploadBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (usageUi.status === 'loading') {
      setResult('Usage quota is still loading. Please wait a moment.')
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
    setServerLockedPreview(null)
    setResultIsPreview(false)
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

      const parsed = parseAnalyzeSuccessBody(data as Record<string, unknown>)
      if (!parsed) {
        trackEvent('analysis_completed', { ok: false })
        const err = typeof data.error === 'string' ? data.error : 'Unexpected response from analyzer.'
        setResult(err)
        return
      }

      const { analysisId: id, displayMessage: msg, fullReportAccess: serverFullAccess, lockedPreview } =
        parsed
      trackEvent('analysis_completed', { ok: true })

      setServerLockedPreview(lockedPreview)
      setResultIsPreview(!serverFullAccess)

      /** Growth email gate is for free previews only — paid tiers and local dev skip it */
      const skipGrowthEmailGate =
        process.env.NODE_ENV === 'development' ||
        monthlyProActive ||
        (usageUi.status === 'ready' && usageUi.monthlyProVerified) ||
        serverFullAccess

      if (isFitAnalysisOutput(msg) && !skipGrowthEmailGate) {
        setGatedAnalysis({ analysisId: id, resultText: msg, lockedPreview })
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

  const handleDemoEnableMonthlyPro = useCallback(() => {
    setEntitlements((prev) => {
      const next = demoSetMonthlyPro(prev, true)
      writeEntitlements(next)
      return next
    })
    refreshUsage()
  }, [refreshUsage])

  const handleLocalDevProReportFallback = useCallback(() => {
    setEntitlements((prev) => {
      let next = demoGrantProReportCredit(prev)
      if (analysisId) {
        const applied = consumeProReportCreditForAnalysis(next, analysisId)
        if (applied) next = applied
      }
      writeEntitlements(next)
      return next
    })
  }, [analysisId])

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

    if (localBillingSandboxActive()) {
      handleDemoEnableMonthlyPro()
      return
    }

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
          if (process.env.NODE_ENV === 'development') {
            handleDemoEnableMonthlyPro()
            return
          }
          setSubscribeMonthlyError(
            typeof data.error === 'string'
              ? data.error
              : 'Checkout is temporarily unavailable.'
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

  const showApplicationInputs = !result && !gatedAnalysis
  const showEmailGate = Boolean(gatedAnalysis) && !result
  const inputsColumnVisible = showApplicationInputs || showEmailGate

  const handleNewAnalysis = () => {
    setResult(null)
    setAnalysisId(null)
    setServerLockedPreview(null)
    setResultIsPreview(false)
    setGatedAnalysis(null)
    setGrowthEmailNotice(null)
    requestAnimationFrame(() => {
      document.getElementById('jobfit-application-inputs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <main className={pageMain}>
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
        onLocalDevProReportFallback={handleLocalDevProReportFallback}
      />

      <section className={analyzerPageContainer}>
        <header className={headerBar}>
          <Link href="/" className={`${brandMark} shrink-0`}>
            <span className={brandDot} aria-hidden />
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
        </header>

        <div className="mb-10 mt-8 max-w-3xl sm:mt-10">
          <h1 className="text-[1.75rem] font-bold leading-tight text-onyx sm:text-[2rem]">
            Analyze your CV against the role
          </h1>
          <p className={`mt-3 max-w-2xl text-base leading-relaxed ${textMuted}`}>
            Paste your CV and the job posting. JobFit AI scores fit, highlights gaps, and suggests concrete edits.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_352px] lg:items-start">
          {showApplicationInputs ? (
          <form
            id="jobfit-application-inputs"
            onSubmit={handleSubmit}
            className={`${analyzerFormCard} ${cardPadding} order-1 scroll-mt-24 lg:col-start-1 lg:row-start-1 lg:self-start`}
          >
            <div className={formFieldGroup}>
              <div className="border-b border-ash/40 pb-4">
                <h2 className={analyzerFormHeading}>Application inputs</h2>
                <p className={analyzerFormSubheading}>Required for each analysis run.</p>
              </div>

              {usageUi.status === 'ready' && !usageUi.canRun ? (
                <div className={alertWarning}>
                  You have no analyses left this period until quota resets. Use{' '}
                  <span className="font-semibold">{LABEL_BUY_PRO_REPORT}</span> for one paid run + full report, or{' '}
                  <span className="font-semibold">{LABEL_SUBSCRIBE_MONTHLY_PRO}</span> if you apply often.
                </div>
              ) : null}

              {usageUi.status === 'error' ? (
                <div className={alertError}>{usageUi.message}</div>
              ) : null}

              <div>
                <label htmlFor="cv-pdf-upload" className={analyzerFormLabel}>
                  CV file (PDF)
                </label>
                <p className={`mt-1 ${analyzerFormHint}`}>Optional. Upload to extract text into the field below.</p>
                <input
                  id="cv-pdf-upload"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={cvUploadBusy}
                  onChange={(e) => void handlePdfUpload(e)}
                  className="mt-2 block w-full text-sm text-dim file:mr-3 file:rounded-md file:border file:border-onyx/15 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-onyx hover:file:bg-ash/20 disabled:opacity-50"
                />
                {cvUploadBusy ? (
                  <p className={`mt-2 ${analyzerFormHint}`}>Extracting text from PDF…</p>
                ) : null}
                {cvUploadError ? <p className="mt-2 text-sm text-brick">{cvUploadError}</p> : null}
              </div>

              <div>
                <label htmlFor="cv-text" className={analyzerFormLabel}>
                  CV text
                </label>
                <p className={`mt-1 ${analyzerFormHint}`}>Paste or edit your resume. Include roles, skills, and dates.</p>
                <textarea
                  id="cv-text"
                  value={cv}
                  onChange={(e) => setCv(e.target.value)}
                  rows={9}
                  className={`mt-2 ${inputSurface}`}
                  placeholder="Paste your resume text here…"
                  required
                />
              </div>

              <div>
                <label htmlFor="job-description" className={analyzerFormLabel}>
                  Job description
                </label>
                <p className={`mt-1 ${analyzerFormHint}`}>Paste the full posting you are applying to.</p>
                <textarea
                  id="job-description"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={9}
                  className={`mt-2 ${inputSurface}`}
                  placeholder="Paste the job description here…"
                  required
                />
              </div>

              <button type="submit" disabled={submitDisabled} className={analyzerFormSubmit}>
                {loading
                  ? 'Analyzing…'
                  : usageUi.status === 'loading'
                    ? 'Loading quota…'
                    : usageUi.status === 'error'
                      ? 'Quota unavailable'
                      : !usageUi.canRun
                        ? 'Quota reached'
                        : 'Run analysis'}
              </button>
            </div>
          </form>
          ) : null}

          {showEmailGate && gatedAnalysis ? (
            <div
              id="jobfit-email-gate"
              className={`${analyzerFormCard} ${cardPadding} order-1 scroll-mt-24 lg:col-start-1 lg:row-start-1 lg:self-start`}
            >
              <AnalysisResultEmailGate
                analysisId={gatedAnalysis.analysisId}
                onRelease={releaseGatedAnalysis}
              />
            </div>
          ) : null}

          {growthEmailNotice && !(result || gatedAnalysis) ? (
            <div className={`order-3 lg:col-span-2 ${alertInfo}`}>{growthEmailNotice}</div>
          ) : null}

          <AnalysisInsightsPanel
              result={result}
              inputsColumnVisible={inputsColumnVisible}
              onNewAnalysis={result ? handleNewAnalysis : undefined}
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
              onDemoEnableMonthlyPro={handleDemoEnableMonthlyPro}
              subscribeMonthlyBusy={subscribeMonthlyBusy}
              subscribeMonthlyError={subscribeMonthlyError}
              onOpenCustomerPortal={handleOpenPortal}
              portalBusy={portalBusy}
              portalError={portalError}
              onApplyProReportCredit={handleApplyProReportCredit}
              onDemoAddProCredit={handleDemoAddProCredit}
              onDemoToggleMonthlyPro={handleDemoToggleMonthlyPro}
              onLocalDevProReportFallback={handleLocalDevProReportFallback}
              onOpenUpgradeModal={
                monthlyProActive ? undefined : () => openUpgradeModal('conversion')
              }
              savedReportsDashboardAllowed={reportsDashboardAllowed}
              cvText={cv}
              jobDescription={jd}
              serverLockedPreview={serverLockedPreview}
            />
        </div>
      </section>
    </main>
  )
}
