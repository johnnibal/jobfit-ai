'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AtsChecklistPremium } from '@/lib/atsChecklistTypes'
import type { AppliedProPromo } from '@/components/billing/ProReportPromoBox'
import { ProReportPromoBox } from '@/components/billing/ProReportPromoBox'
import {
  buildPermissionContext,
  canExportPDF,
  canGenerateCoverLetter,
  canSeeAllSuggestions,
  canViewFullATS,
  shouldGateAnalysisSections,
  type AnalysisPermissionContext,
} from '@/lib/analysisPermissions'
import {
  PRICE_MONTHLY_PRO_EUR,
  PRICE_PRO_REPORT_EUR,
  FREE_VISIBLE_SUGGESTION_COUNT,
  MONTHLY_PRO_ANALYSES_PER_MONTH,
  UNLOCK_PRO_REPORT_CTA_LABEL,
} from '@/lib/planTypes'
import {
  COVER_LETTER_LANGUAGES,
  COVER_LETTER_TONES,
  type CoverLetterLanguageId,
  type CoverLetterToneId,
} from '@/lib/coverLetterOptions'
import { parseAnalysisSections, stripMatchScorePrefix } from '@/lib/parseAnalysis'
import { buildJobFitReportPdfHtml } from '@/lib/pdf/jobFitReportPdf'
import { useBillingSandboxEnvironment } from '@/lib/billing/useBillingSandboxEnvironment'
import { trackEvent } from '@/lib/analytics/track'

const SHORT_SUMMARY_MAX_CHARS = 320

/** Shown when Pro Report checkout is attempted without a completed analysis session id. */
const MISSING_ANALYSIS_UNLOCK_MSG = 'Run an analysis first to unlock a Pro Report.'

function ProReportMonthlyComparison() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <div className="rounded-2xl border border-violet-400/35 bg-violet-500/[0.07] p-4">
        <p className="text-sm font-semibold text-violet-50">
          Pro Report · €{PRICE_PRO_REPORT_EUR} one-time
        </p>
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-400">
          <li>Unlocks this one application report</li>
          <li>Full suggestions</li>
          <li>ATS checklist</li>
          <li>Cover letter</li>
          <li>PDF export</li>
        </ul>
      </div>
      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/[0.06] p-4">
        <p className="text-sm font-semibold text-cyan-50">
          Monthly Pro · €{PRICE_MONTHLY_PRO_EUR}/month
        </p>
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-400">
          <li>More analyses</li>
          <li>Saved reports</li>
          <li>Best for active job seekers</li>
        </ul>
      </div>
    </div>
  )
}

/** Free tier: ATS checklist lines visible before blur / unlock CTA. */
const FREE_ATS_VISIBLE_COUNT = 5

function truncateSummary(text: string, max = SHORT_SUMMARY_MAX_CHARS): string {
  const normalized = text.trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max).trimEnd()}…`
}

function truncatePreview(text: string, maxChars = 140): string {
  const t = text.trim()
  if (!t) return ''
  if (t.length <= maxChars) return t
  return `${t.slice(0, maxChars).trimEnd()}…`
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex items-center gap-2 first:mt-0">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300" />
      <span className="font-semibold text-cyan-200">{children}</span>
    </div>
  )
}

function LockedHint({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-400/35 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">
      {label}
    </span>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
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

function lockedPreviewCardFeature(title: string): string {
  const map: Record<string, string> = {
    'Full CV improvement report': 'preview_cv_report',
    'ATS keyword checklist': 'preview_ats_checklist',
    'Tailored cover letter': 'preview_cover_letter',
    'PDF export': 'preview_pdf_export',
  }
  return map[title] ?? 'preview_other'
}

function UnlockProReportCta({
  analysisId,
  proReportCreditsCount,
  onApplyProReportCredit,
  checkoutSurface = 'insights_panel',
  variant = 'primary',
  fullWidth,
  emphasize,
}: {
  analysisId: string | null
  proReportCreditsCount: number
  onApplyProReportCredit: () => void
  checkoutSurface?: string
  variant?: 'primary' | 'outline'
  fullWidth?: boolean
  /** Larger touch target and text for high-visibility placement. */
  emphasize?: boolean
}) {
  const [stripeBusy, setStripeBusy] = useState(false)
  const [stripeErr, setStripeErr] = useState<string | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<AppliedProPromo | null>(null)
  const billingSandboxVisible = useBillingSandboxEnvironment()

  useEffect(() => {
    setAppliedPromo(null)
  }, [analysisId])

  const scrollToSandbox = () => {
    document.getElementById('jobfit-billing-sandbox')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleClick = async () => {
    if (!analysisId) {
      setStripeErr(MISSING_ANALYSIS_UNLOCK_MSG)
      return
    }
    if (analysisId && proReportCreditsCount > 0) {
      onApplyProReportCredit()
      return
    }

    setStripeErr(null)
    setStripeBusy(true)
    try {
      trackEvent('stripe_checkout_started', { product: 'pro_report', surface: checkoutSurface })
      const res = await fetch('/api/checkout/pro-report', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          ...(appliedPromo ? { promoCode: appliedPromo.code } : {}),
        }),
      })

      const data: { url?: unknown; error?: unknown; fallbackDemo?: unknown } = await res.json()

      if (!res.ok) {
        if (res.status === 503 && data.fallbackDemo) {
          if (billingSandboxVisible) {
            scrollToSandbox()
            setStripeErr(typeof data.error === 'string' ? data.error : 'Billing unavailable — use the sandbox below.')
          } else {
            setStripeErr(
              typeof data.error === 'string'
                ? data.error
                : 'Checkout is not configured. Add Stripe keys and price IDs in the deployment environment.'
            )
          }
          return
        }
        if (res.status === 409) {
          setStripeErr(typeof data.error === 'string' ? data.error : 'Already unlocked.')
          return
        }
        if (res.status === 400) {
          setStripeErr(typeof data.error === 'string' ? data.error : 'Could not apply this promo in checkout.')
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
      setStripeErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setStripeBusy(false)
    }
  }

  const readyHint =
    analysisId && proReportCreditsCount > 0 ? 'Demo: you have a credit — applies instantly.' : null

  const base =
    variant === 'primary'
      ? 'border-transparent bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 text-slate-950 shadow-[0_0_24px_rgba(139,92,246,0.28)] hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(56,189,248,0.35)]'
      : 'border-violet-400/35 bg-violet-500/10 text-violet-100 hover:border-violet-400/55 hover:bg-violet-500/15'

  const sizeClass = emphasize
    ? 'min-h-[52px] px-6 py-3 text-[15px] sm:text-base'
    : 'min-h-[48px] px-5 py-2.5 text-sm'

  const buttonLabel =
    stripeBusy
      ? 'Opening checkout…'
      : analysisId && proReportCreditsCount > 0
        ? 'Apply demo credit'
        : appliedPromo
          ? `Unlock Pro Report · €${appliedPromo.discountedEur.toFixed(2)}`
          : UNLOCK_PRO_REPORT_CTA_LABEL

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {analysisId && proReportCreditsCount === 0 ? (
        <div className="mb-3">
          <ProReportPromoBox key={analysisId} compact disabled={!analysisId || stripeBusy} onApplied={setAppliedPromo} />
          {appliedPromo ? (
            <p className="mt-2 text-center text-[10px] text-slate-500">
              <span className="line-through opacity-70">€{appliedPromo.originalEur.toFixed(2)}</span>{' '}
              <span className="tabular-nums text-emerald-200/90">
                −{appliedPromo.percentOff}% · €{appliedPromo.discountedEur.toFixed(2)} due
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => void handleClick()}
        className={`inline-flex w-full items-center justify-center rounded-full border text-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${sizeClass} ${base}`}
        title={
          !analysisId
            ? MISSING_ANALYSIS_UNLOCK_MSG
            : proReportCreditsCount > 0
              ? 'Apply your Pro Report demo credit.'
              : stripeBusy
                ? 'Starting Stripe Checkout…'
                : appliedPromo
                  ? `Stripe Checkout · discounted total €${appliedPromo.discountedEur.toFixed(2)}`
                  : 'Pay securely with Stripe (€4.99 one-time).'
        }
      >
        {buttonLabel}
      </button>
      {readyHint ? <p className="mt-2 text-center text-[11px] text-emerald-300/90">{readyHint}</p> : null}
      {stripeErr ? (
        <p className="mt-2 text-center text-[12px] leading-relaxed text-amber-200/95">{stripeErr}</p>
      ) : !analysisId ? (
        <p className="mt-2 text-center text-sm leading-snug text-slate-300">{MISSING_ANALYSIS_UNLOCK_MSG}</p>
      ) : null}
    </div>
  )
}

function LockedFeaturePreviewCard({
  title,
  previewLines,
  onActivate,
}: {
  title: string
  previewLines: string[]
  onActivate?: () => void
}) {
  const shell =
    'group relative flex w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-inner transition hover:border-violet-400/25 hover:shadow-[0_0_40px_rgba(139,92,246,0.08)]'

  const inner = (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.06),transparent_45%,rgba(34,211,238,0.05))]" />
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
          <LockedHint label={onActivate ? 'Tap to unlock' : 'Preview'} />
        </div>
        <div className="mt-3 flex flex-1 flex-col gap-2 border-l-2 border-violet-400/35 pl-3">
          {previewLines.map((line, i) => (
            <p key={i} className="text-xs leading-relaxed text-slate-500">
              {line}
            </p>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-slate-950/85 px-3 py-2 text-[11px] leading-relaxed text-slate-600 backdrop-blur-[2px]">
          {onActivate
            ? 'Unlock for ATS checklist, exports, cover letter, and the complete narrative.'
            : 'Full detail unlocks with Pro Report — nothing is wrong with your analysis; we hold the rest until purchase.'}
        </div>
      </div>
    </>
  )

  if (onActivate) {
    return (
      <button
        type="button"
        onClick={onActivate}
        className={`${shell} cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-violet-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}
      >
        {inner}
      </button>
    )
  }

  return <div className={shell}>{inner}</div>
}

export type SubscriptionBillingUi = {
  loading: boolean
  fetched: boolean
  monthlyProActive: boolean
  subscriptionStatus: string
  email: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  lastPaymentFailedAt: string | null
  error: string | null
}

export type AnalysisInsightsPanelProps = {
  result: string | null
  monthlyProActive: boolean
  analysisId: string | null
  fullyUnlockedAnalysisIds: string[]
  proReportCreditsCount: number
  quotaUsed: number
  quotaCap: number
  quotaPeriod: 'day' | 'month'
  quotaRemaining: number
  quotaLoading: boolean
  quotaError: string | null
  billing: SubscriptionBillingUi
  onRefreshBilling: () => void
  onSubscribeMonthly: () => void
  subscribeMonthlyBusy: boolean
  subscribeMonthlyError: string | null
  onOpenCustomerPortal: () => void
  portalBusy: boolean
  portalError: string | null
  onApplyProReportCredit: () => void
  onDemoAddProCredit: () => void
  onDemoToggleMonthlyPro: () => void
  /** Opens conversion modal — omit when Monthly Pro already grants full access. */
  onOpenUpgradeModal?: () => void
  /** Monthly Pro or Pro-report purchasers may open /dashboard/reports. */
  savedReportsDashboardAllowed?: boolean
  /** When set and `result` is null, shown instead of the default “marketing” empty placeholders. */
  emptyStateOverride?: ReactNode
  cvText: string
  jobDescription: string
}

export function AnalysisInsightsPanel({
  result,
  monthlyProActive,
  analysisId,
  fullyUnlockedAnalysisIds,
  proReportCreditsCount,
  quotaUsed,
  quotaCap,
  quotaPeriod,
  quotaRemaining,
  quotaLoading,
  quotaError,
  billing,
  onRefreshBilling,
  onSubscribeMonthly,
  subscribeMonthlyBusy,
  subscribeMonthlyError,
  onOpenCustomerPortal,
  portalBusy,
  portalError,
  onApplyProReportCredit,
  onDemoAddProCredit,
  onDemoToggleMonthlyPro,
  onOpenUpgradeModal,
  savedReportsDashboardAllowed = false,
  emptyStateOverride,
  cvText,
  jobDescription,
}: AnalysisInsightsPanelProps) {
  const [coverLetterText, setCoverLetterText] = useState('')
  const [coverLanguage, setCoverLanguage] = useState<CoverLetterLanguageId>('en')
  const [coverTone, setCoverTone] = useState<CoverLetterToneId>('natural')
  const [coverGenLoading, setCoverGenLoading] = useState(false)
  const [coverGenError, setCoverGenError] = useState<string | null>(null)
  const [coverCopied, setCoverCopied] = useState(false)

  const [atsPremium, setAtsPremium] = useState<AtsChecklistPremium | null>(null)
  const [atsPremiumLoading, setAtsPremiumLoading] = useState(false)
  const [atsPremiumErr, setAtsPremiumErr] = useState<string | null>(null)
  const [atsPremiumHandled, setAtsPremiumHandled] = useState(false)

  const billingSandboxVisible = useBillingSandboxEnvironment()

  const permissionCtx: AnalysisPermissionContext = useMemo(
    () =>
      buildPermissionContext({
        monthlyProActive,
        analysisId,
        fullyUnlockedAnalysisIds,
      }),
    [monthlyProActive, analysisId, fullyUnlockedAnalysisIds]
  )

  const sections = useMemo(() => (result ? parseAnalysisSections(result) : null), [result])

  useEffect(() => {
    setCoverLetterText('')
    setCoverGenError(null)
    setCoverCopied(false)
  }, [analysisId])

  const matchScore = useMemo(() => {
    if (!result) return null
    const match = result.match(/Match Score:\s*(\d{1,3})\/100/i)
    if (!match) return null
    const score = Number(match[1])
    return Number.isNaN(score) ? null : Math.min(100, Math.max(0, score))
  }, [result])

  const verdictSummary = useMemo(() => {
    if (!sections) return ''
    const joined = sections.verdictParagraphs.join(' ').trim()
    if (joined) return joined
    const fallback = stripMatchScorePrefix(result ?? '')
      .split('\n')
      .find((l) => l.trim().length > 0)
    return fallback?.trim() ?? ''
  }, [sections, result])

  const gatedFree = shouldGateAnalysisSections(permissionCtx)

  const showConversionUpsell = Boolean(onOpenUpgradeModal && gatedFree && result)

  const bumpUpgradeFromLocked = useCallback(
    (featureId: string) => {
      trackEvent('locked_feature_clicked', { feature: featureId })
      onOpenUpgradeModal?.()
    },
    [onOpenUpgradeModal]
  )

  const visibleSuggestions = useMemo(() => {
    if (!sections) return []
    if (!gatedFree) return sections.resumeImprovementBullets
    return sections.resumeImprovementBullets.slice(0, FREE_VISIBLE_SUGGESTION_COUNT)
  }, [sections, gatedFree])

  const lockedImprovementExtra = useMemo(() => {
    if (!sections || !gatedFree) return 0
    return Math.max(0, sections.resumeImprovementBullets.length - FREE_VISIBLE_SUGGESTION_COUNT)
  }, [sections, gatedFree])

  const coverInputsOk =
    cvText.trim().length >= 50 &&
    /[a-zA-Z]/.test(cvText) &&
    jobDescription.trim().length >= 50 &&
    /[a-zA-Z]/.test(jobDescription)

  useEffect(() => {
    if (gatedFree || !analysisId || !result || !coverInputsOk || !canViewFullATS(permissionCtx)) {
      setAtsPremium(null)
      setAtsPremiumLoading(false)
      setAtsPremiumErr(null)
      setAtsPremiumHandled(false)
      return
    }

    let cancelled = false
    setAtsPremiumHandled(false)
    ;(async () => {
      setAtsPremiumLoading(true)
      setAtsPremiumErr(null)
      try {
        const res = await fetch('/api/ats-checklist', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisId,
            cv: cvText,
            jd: jobDescription,
            analysisResult: result,
          }),
        })

        const data: { checklist?: AtsChecklistPremium; error?: unknown } = await res.json()

        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'ATS checklist request failed.')
        }

        if (!cancelled) {
          setAtsPremium(data.checklist ?? null)
        }
      } catch (e) {
        if (!cancelled) {
          setAtsPremiumErr(e instanceof Error ? e.message : 'ATS checklist failed.')
          setAtsPremium(null)
        }
      } finally {
        if (!cancelled) {
          setAtsPremiumLoading(false)
          setAtsPremiumHandled(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    gatedFree,
    analysisId,
    result,
    cvText,
    jobDescription,
    permissionCtx,
    coverInputsOk,
  ])

  async function runCoverLetterGeneration() {
    if (!canGenerateCoverLetter(permissionCtx) || !analysisId || !result) return
    if (!coverInputsOk) {
      setCoverGenError('CV and job description must each be at least 50 characters with letters.')
      return
    }

    setCoverGenLoading(true)
    setCoverGenError(null)
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          cv: cvText,
          jd: jobDescription,
          analysisResult: result,
          language: coverLanguage,
          tone: coverTone,
        }),
      })

      const data: { letter?: unknown; error?: unknown } = await res.json()

      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Cover letter request failed.')
      }

      const letter = typeof data.letter === 'string' ? data.letter : ''
      setCoverLetterText(letter)
      trackEvent('cover_letter_generated', {
        language: coverLanguage,
        tone: coverTone,
      })
    } catch (e) {
      setCoverGenError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setCoverGenLoading(false)
    }
  }

  async function handleCopyCoverLetter() {
    const t = coverLetterText.trim()
    if (!t) return
    try {
      await navigator.clipboard.writeText(t)
      setCoverCopied(true)
      window.setTimeout(() => setCoverCopied(false), 2000)
    } catch {
      setCoverGenError('Could not copy to clipboard.')
    }
  }

  const handlePrint = () => {
    if (!canExportPDF(permissionCtx) || !result || !sections) return

    trackEvent('pdf_exported')

    const html = buildJobFitReportPdfHtml({
      matchScore,
      summary: verdictSummary.trim() || '—',
      matchingSkills: sections.strongMatchBullets,
      missingSkills: sections.gapBullets,
      suggestions: sections.resumeImprovementBullets,
      atsKeywords: sections.atsBullets,
      coverLetter: coverLetterText.trim() || null,
      generatedAt: new Date(),
    })

    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) return

    w.document.open()
    w.document.write(html)
    w.document.close()

    const triggerPrint = () => {
      try {
        w.focus()
        w.print()
      } finally {
        w.close()
      }
    }

    setTimeout(triggerPrint, 150)
  }

  const permissionBadge =
    permissionCtx.plan === 'monthly_pro'
      ? 'Monthly Pro'
      : permissionCtx.plan === 'pro_report'
        ? 'Pro Report'
        : 'Free'

  const lockedCardPreviews = useMemo(() => {
    const strong0 = sections?.strongMatchBullets[0] ?? ''
    const impExtra = lockedImprovementExtra

    const fullReportLines = [
      strong0
        ? `Strength signal: ${truncatePreview(strong0)}`
        : 'Side-by-side CV ↔ posting alignment with prioritized edits.',
      impExtra > 0
        ? `Plus ${impExtra} more improvement idea${impExtra === 1 ? '' : 's'} + interview framing — included in full report.`
        : 'Deep narrative verdict, skill gaps, and interview-ready framing — included in full report.',
      'Strong matches and structured sections stay blurred until you unlock.',
    ]

    const coverLines = [
      'Opening hook aligned to this employer’s priorities.',
      'Three concise proof paragraphs tied to JD themes.',
      'Professional tone matching your CV facts — no invented wins.',
    ]

    const pdfLines = [
      'One polished document: score, ATS map, gaps, and suggestions.',
      'Save or share with mentors — optional branding later.',
      'Uses your current analysis — instant after unlock.',
    ]

    const ats0 = sections?.atsBullets[0] ?? ''
    const ats1 = sections?.atsBullets[1] ?? ''

    const atsLines = [
      ats0
        ? `From your posting: ${truncatePreview(ats0)}`
        : 'Mirror the posting’s terminology with honest evidence in your CV.',
      ats1
        ? `Also: ${truncatePreview(ats1)}`
        : 'Required vs nice-to-have keywords plus where to weave them naturally.',
      'Full structured checklist (including integrity warnings) unlocks with Pro Report.',
    ]

    return [
      { title: 'Full CV improvement report', lines: fullReportLines },
      { title: 'ATS keyword checklist', lines: atsLines },
      { title: 'Tailored cover letter', lines: coverLines },
      { title: 'PDF export', lines: pdfLines },
    ]
  }, [sections, lockedImprovementExtra])

  return (
    <aside className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-100">Insights</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
            {permissionBadge}
          </span>
          {proReportCreditsCount > 0 ? (
            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-100">
              Pro credits · {proReportCreditsCount}
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        You always keep your score and an honest preview on Free.{' '}
        <span className="text-slate-300">Pro Report (€{PRICE_PRO_REPORT_EUR})</span> unlocks the full breakdown for one
        application. <span className="text-slate-300">Monthly Pro (€{PRICE_MONTHLY_PRO_EUR}/mo)</span> adds{' '}
        {MONTHLY_PRO_ANALYSES_PER_MONTH} analyses per UTC month, saved reports, and subscriber tooling via Stripe.
      </p>

      {result && gatedFree ? (
        <div className="mt-5">
          <UnlockProReportCta
            emphasize
            fullWidth
            checkoutSurface="insights_after_explanation"
            analysisId={analysisId}
            proReportCreditsCount={proReportCreditsCount}
            onApplyProReportCredit={onApplyProReportCredit}
          />
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-slate-200">Billing profile</span>
          <button
            type="button"
            onClick={onRefreshBilling}
            className="text-xs font-medium text-cyan-400 hover:underline disabled:opacity-40"
            disabled={billing.loading}
          >
            Refresh status
          </button>
        </div>
        {!monthlyProActive ? (
          <div className="mt-4 space-y-4 border-t border-slate-800/80 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compare upgrades</p>
            <ProReportMonthlyComparison />
            <UnlockProReportCta
              emphasize
              fullWidth
              checkoutSurface="insights_billing_compare"
              analysisId={analysisId}
              proReportCreditsCount={proReportCreditsCount}
              onApplyProReportCredit={onApplyProReportCredit}
            />
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Or subscribe for ongoing use
            </p>
          </div>
        ) : null}
        {billing.error ? <p className="mt-2 text-xs leading-relaxed text-amber-200/95">{billing.error}</p> : null}
        {billing.loading ? <p className="mt-2 text-xs text-slate-500">Loading subscription state…</p> : null}
        {!billing.loading && billing.fetched ? (
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">
            {billing.subscriptionStatus !== 'none' ? (
              <p className="text-slate-500">Stripe billing linked to this browser (HttpOnly cookie).</p>
            ) : (
              <p className="text-slate-500">Monthly Pro attaches a Stripe profile and sets a secure billing cookie.</p>
            )}
            {billing.email ? <p className="text-slate-400">Billing email: {billing.email}</p> : null}
            <p>
              Monthly Pro access:{' '}
              <span className={billing.monthlyProActive ? 'font-semibold text-emerald-300' : 'font-semibold text-slate-500'}>
                {billing.monthlyProActive ? 'Yes — active subscription' : 'No — canceled, unpaid, or not subscribed'}
              </span>
              {billing.subscriptionStatus && billing.subscriptionStatus !== 'none' ? (
                <span className="text-slate-600"> · Stripe status: {billing.subscriptionStatus}</span>
              ) : null}
            </p>
            {billing.lastPaymentFailedAt ? (
              <p className="text-rose-300/95">
                Payment failed on {new Date(billing.lastPaymentFailedAt).toLocaleString()} — update billing in the portal.
              </p>
            ) : null}
            {billing.cancelAtPeriodEnd && billing.currentPeriodEnd ? (
              <p className="text-amber-200/95">
                Subscription ends after {new Date(billing.currentPeriodEnd).toLocaleDateString()} (cancel at period end).
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={subscribeMonthlyBusy}
            onClick={onSubscribeMonthly}
            className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {subscribeMonthlyBusy ? 'Opening Checkout…' : `Subscribe Monthly Pro · €${PRICE_MONTHLY_PRO_EUR}/mo`}
          </button>
          {billing.subscriptionStatus !== 'none' ? (
            <button
              type="button"
              disabled={portalBusy}
              onClick={onOpenCustomerPortal}
              className="rounded-full border border-slate-600 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {portalBusy ? 'Opening portal…' : 'Manage subscription'}
            </button>
          ) : null}
        </div>
        {subscribeMonthlyError ? (
          <p className="mt-2 text-[11px] leading-relaxed text-amber-200/95">{subscribeMonthlyError}</p>
        ) : null}
        {portalError ? <p className="mt-2 text-[11px] leading-relaxed text-amber-200/95">{portalError}</p> : null}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-slate-200">
            {quotaPeriod === 'month' ? 'Analyses this month (UTC)' : 'Free analyses today (UTC)'}
          </span>
          <span className="tabular-nums text-cyan-200">
            {quotaLoading ? (
              '…'
            ) : (
              <>
                <span className="font-semibold text-emerald-200/95">{quotaRemaining}</span>
                <span className="text-slate-500"> left · </span>
                {Math.min(quotaUsed, quotaCap)} / {quotaCap}
              </>
            )}
          </span>
        </div>
        {quotaError ? (
          <p className="mt-2 text-xs leading-relaxed text-amber-200/95">{quotaError}</p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {quotaPeriod === 'month'
              ? `Monthly Pro includes ${quotaCap} analyses per UTC calendar month — enforced on the server so refreshing won't bypass it.`
              : `Free tier includes ${quotaCap} analysis per UTC day — enforced on the server (HTTP-only session cookie). Buying Pro Report unlocks full detail for that run only; it does not add extra analyses.`}
          </p>
        )}
      </div>

      {!result ? (
        emptyStateOverride ? (
          <div className="mt-6">{emptyStateOverride}</div>
        ) : (
          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Fit score</div>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Quantitative alignment from CV ↔ posting overlap (LLM-assisted).
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Suggestions</div>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Three actionable tweaks on Free — full list with Pro Report.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">ATS & exports</div>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Keyword checklist and PDF unlock after purchase — previews stay visible so you know what you get.
              </p>
            </div>
          </div>
        )
      ) : null}

      {result ? (
        <div className="mt-6 space-y-6 rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-5">
          {/* Score + upgrade strip */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-cyan-300">Your fit overview</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {gatedFree
                  ? 'Free shows essentials. Locked sections below are previews — your analysis ran successfully.'
                  : 'Full report unlocked for this session.'}
              </p>
            </div>
            {matchScore !== null ? (
              <div className="relative flex h-[5.25rem] w-[5.25rem] shrink-0 items-center justify-center rounded-full border border-cyan-400 bg-slate-900 shadow-[0_0_25px_rgba(34,211,238,0.18)]">
                <div className="absolute inset-[-6px] rounded-full border border-cyan-400/30">
                  <div className="h-full w-full animate-pulse rounded-full border border-cyan-400/20" />
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">FIT</div>
                  <div className="text-xl font-bold text-cyan-300">{matchScore}%</div>
                </div>
              </div>
            ) : null}
          </div>

          {gatedFree ? (
            <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/10 via-slate-900/60 to-cyan-500/5 p-4 sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-violet-100">See everything recruiters scrutinize next</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    One-time Pro Report for this posting — full CV report, ATS checklist, cover letter, and PDF export for
                    €{PRICE_PRO_REPORT_EUR}.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                    <Link
                      href="/pro-report"
                      className="text-xs font-medium text-violet-400/90 underline-offset-4 hover:text-violet-300 hover:underline"
                    >
                      What is Pro Report? →
                    </Link>
                    <Link
                      href="/pricing"
                      className="text-xs font-medium text-cyan-400/90 underline-offset-4 hover:text-cyan-300 hover:underline"
                    >
                      Compare plans →
                    </Link>
                  </div>
                </div>
                <UnlockProReportCta
                  emphasize
                  fullWidth
                  analysisId={analysisId}
                  proReportCreditsCount={proReportCreditsCount}
                  onApplyProReportCredit={onApplyProReportCredit}
                  checkoutSurface="insights_overview_banner"
                />
              </div>
            </div>
          ) : null}

          {/* Summary */}
          <div>
            <SectionHeading>Summary</SectionHeading>
            {showConversionUpsell ? (
              <button
                type="button"
                onClick={() => bumpUpgradeFromLocked('summary_narrative')}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left outline-none ring-violet-400/25 transition hover:border-violet-400/35 hover:bg-slate-900/70 focus-visible:ring-2"
              >
                <p className="text-sm leading-7 text-slate-300">{truncateSummary(verdictSummary)}</p>
                <p className="mt-2 text-xs leading-relaxed text-violet-200/85">
                  Tap to unlock the full narrative for this posting →
                </p>
              </button>
            ) : (
              <>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {gatedFree ? truncateSummary(verdictSummary) : verdictSummary || '—'}
                </p>
                {gatedFree ? (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Abbreviated on Free — full narrative is inside the unlocked report.
                  </p>
                ) : null}
              </>
            )}
          </div>

          {/* Top suggestions (free shows 3 only) */}
          <div>
            <SectionHeading>{gatedFree ? 'Your first 3 suggestions' : 'CV improvement suggestions'}</SectionHeading>
            {!canSeeAllSuggestions(permissionCtx) ? (
              <p className="mt-2 text-xs text-slate-500">
                Three strongest edits on Free — Pro unlocks the complete prioritized list for this role.
              </p>
            ) : null}
            <ul className="mt-3 list-none space-y-2">
              {visibleSuggestions.map((line, idx) => (
                <li key={idx} className="rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2 text-sm text-slate-200">
                  <span className="font-semibold text-cyan-200/90">{idx + 1}.</span> {line}
                </li>
              ))}
              {!visibleSuggestions.length ? (
                <li className="text-sm text-slate-500">No structured bullets parsed yet.</li>
              ) : null}
            </ul>
            {gatedFree ? (
              <div className="mt-5">
                <UnlockProReportCta
                  emphasize
                  fullWidth
                  analysisId={analysisId}
                  proReportCreditsCount={proReportCreditsCount}
                  onApplyProReportCredit={onApplyProReportCredit}
                  checkoutSurface="insights_after_suggestions"
                />
              </div>
            ) : null}
          </div>

          {/* ATS — free preview (5 lines) vs premium structured checklist */}
          <div>
            <SectionHeading>ATS keyword checklist</SectionHeading>
            {gatedFree ? (
              <>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Mirrors terminology from your posting (German or English). Use keywords only where your CV already has
                  honest evidence — avoid stuffing.
                </p>
                <ul className="mt-3 list-none space-y-2">
                  {(sections?.atsBullets ?? []).slice(0, FREE_ATS_VISIBLE_COUNT).map((line, idx) => (
                    <li key={idx} className="rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2 text-sm text-slate-200">
                      • {line}
                    </li>
                  ))}
                  {!(sections?.atsBullets ?? []).slice(0, FREE_ATS_VISIBLE_COUNT).length ? (
                    <li className="text-sm text-slate-500">
                      No checklist lines parsed yet — rerun analysis after pasting a concrete posting.
                    </li>
                  ) : null}
                </ul>
                <div className="relative mt-3 overflow-hidden rounded-xl border border-violet-500/25 bg-slate-950/50">
                  <div aria-hidden className="pointer-events-none select-none space-y-2 px-3 py-3 blur-[8px] opacity-[0.28]">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-10 rounded-lg bg-slate-600/90" />
                    ))}
                  </div>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-slate-950/35 via-slate-950/82 to-slate-950/95 px-4 text-center backdrop-blur-[3px]">
                    <LockIcon className="text-violet-300/90" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/95">
                      {Math.max(0, (sections?.atsBullets ?? []).length - FREE_ATS_VISIBLE_COUNT) > 0
                        ? `${Math.max(0, (sections?.atsBullets ?? []).length - FREE_ATS_VISIBLE_COUNT)} more lines`
                        : 'Full checklist'}
                      {' · locked'}
                    </span>
                    <span className="max-w-[14rem] text-[10px] leading-snug text-slate-500">
                      Required vs optional keywords, placement hints, integrity warnings.
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <UnlockProReportCta
                    emphasize
                    fullWidth
                    analysisId={analysisId}
                    proReportCreditsCount={proReportCreditsCount}
                    onApplyProReportCredit={onApplyProReportCredit}
                    checkoutSurface="insights_ats_unlock"
                  />
                  {showConversionUpsell && onOpenUpgradeModal ? (
                    <button
                      type="button"
                      onClick={() => bumpUpgradeFromLocked('ats_full_checklist')}
                      className="flex w-full min-h-[40px] items-center justify-center gap-2 rounded-full border border-slate-600 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-violet-400/35 hover:text-violet-100"
                    >
                      <LockIcon className="text-violet-300/90" />
                      See upgrade options
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Sorted by what the posting stresses vs what your CV can substantiate. Add terms naturally in bullets that
                  already reflect that work — never paste keyword blocks.
                </p>
                {atsPremiumLoading ? (
                  <p className="mt-3 text-sm text-slate-500">Building structured ATS checklist…</p>
                ) : null}
                {atsPremiumErr ? (
                  <div className="mt-3 rounded-xl border border-amber-900/45 bg-amber-950/25 px-3 py-2">
                    <p className="text-xs leading-relaxed text-amber-100/95">{atsPremiumErr}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Showing baseline checklist lines parsed from your analysis below.
                    </p>
                  </div>
                ) : null}
                {!atsPremiumLoading && atsPremium ? (
                  <div className="mt-4 space-y-5">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-300/95">
                        Required keywords found in CV
                      </h4>
                      <ul className="mt-2 list-none space-y-2">
                        {atsPremium.requiredFoundInCv.length ? (
                          atsPremium.requiredFoundInCv.map((item, idx) => (
                            <li
                              key={`f-${idx}`}
                              className="rounded-xl border border-emerald-900/45 bg-emerald-950/25 px-3 py-2 text-sm text-emerald-50/95"
                            >
                              <span className="font-medium text-emerald-100">{item.phrase}</span>
                              {item.cvEvidenceNote ? (
                                <span className="mt-1 block text-xs leading-relaxed text-emerald-200/75">
                                  {item.cvEvidenceNote}
                                </span>
                              ) : null}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-500">—</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300/95">
                        Required keywords missing from CV
                      </h4>
                      <ul className="mt-2 list-none space-y-2">
                        {atsPremium.requiredMissingFromCv.length ? (
                          atsPremium.requiredMissingFromCv.map((item, idx) => (
                            <li
                              key={`m-${idx}`}
                              className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-50/95"
                            >
                              <span className="font-medium text-amber-100">{item.phrase}</span>
                              {item.cvEvidenceNote ? (
                                <span className="mt-1 block text-xs leading-relaxed text-amber-200/75">
                                  {item.cvEvidenceNote}
                                </span>
                              ) : null}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-500">—</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Nice-to-have keywords
                      </h4>
                      <ul className="mt-2 list-none space-y-2">
                        {atsPremium.niceToHave.length ? (
                          atsPremium.niceToHave.map((item, idx) => (
                            <li key={`n-${idx}`} className="rounded-xl border border-slate-800 bg-slate-900/45 px-3 py-2 text-sm text-slate-200">
                              <span className="font-medium text-slate-100">{item.phrase}</span>
                              {item.cvEvidenceNote ? (
                                <span className="mt-1 block text-xs leading-relaxed text-slate-400">{item.cvEvidenceNote}</span>
                              ) : null}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-500">—</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90">
                        Natural places for honest additions
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Only if you truly have adjacent experience — weave into existing bullets or summaries, don&apos;t append keyword lists.
                      </p>
                      <ul className="mt-2 list-none space-y-2">
                        {atsPremium.suggestedPlacements.length ? (
                          atsPremium.suggestedPlacements.map((item, idx) => (
                            <li key={`p-${idx}`} className="rounded-xl border border-cyan-900/35 bg-cyan-950/15 px-3 py-2 text-sm text-cyan-50/95">
                              <span className="font-medium text-cyan-100">{item.keyword}</span>
                              <span className="mt-1 block text-xs leading-relaxed text-cyan-100/75">{item.suggestion}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-500">—</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-300/95">
                        Do not force these keywords
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Posting asks for evidence your CV does not show — interviews will verify.
                      </p>
                      <ul className="mt-2 list-none space-y-2">
                        {atsPremium.authenticityWarnings.length ? (
                          atsPremium.authenticityWarnings.map((item, idx) => (
                            <li key={`w-${idx}`} className="rounded-xl border border-rose-900/45 bg-rose-950/25 px-3 py-2 text-sm text-rose-50/95">
                              <span className="font-medium text-rose-100">{item.keyword}</span>
                              <span className="mt-1 block text-xs leading-relaxed text-rose-100/80">{item.warning}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-500">No extra warnings.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : null}
                {!atsPremiumLoading && atsPremiumHandled && !atsPremium ? (
                  <ul className="mt-3 list-none space-y-2">
                    {sections?.atsBullets.length ? (
                      sections.atsBullets.map((line, idx) => (
                        <li key={idx} className="rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2 text-sm text-slate-200">
                          • {line}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-500">No ATS lines parsed.</li>
                    )}
                  </ul>
                ) : null}
              </>
            )}
          </div>

          {gatedFree ? (
            <>
              <div>
                <SectionHeading>Included with Pro Report</SectionHeading>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Free analysis is complete — these items stay locked until you unlock with{' '}
                  <span className="text-slate-300">{UNLOCK_PRO_REPORT_CTA_LABEL}</span> (Stripe).
                  {billingSandboxVisible ? (
                    <span> Optional demo tools are at the bottom of this panel when testing locally.</span>
                  ) : null}
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-1">
                  {lockedCardPreviews.map((card) => (
                    <LockedFeaturePreviewCard
                      key={card.title}
                      title={card.title}
                      previewLines={card.lines}
                      onActivate={
                        showConversionUpsell ? () => bumpUpgradeFromLocked(lockedPreviewCardFeature(card.title)) : undefined
                      }
                    />
                  ))}
                </div>
                <div className="mt-6">
                  <UnlockProReportCta
                    emphasize
                    analysisId={analysisId}
                    proReportCreditsCount={proReportCreditsCount}
                    onApplyProReportCredit={onApplyProReportCredit}
                    checkoutSurface="insights_locked_cards_cta"
                    fullWidth
                  />
                </div>

              </div>

              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.07] p-5">
                <p className="text-center text-sm font-semibold text-violet-100">Ready for the full picture?</p>
                <p className="mt-2 text-center text-xs leading-relaxed text-slate-400">
                  Same analysis — we are not re-running AI until you choose. Unlock adds detail you already earned.
                </p>
                <div className="mx-auto mt-4 max-w-md">
                  <UnlockProReportCta
                    emphasize
                    analysisId={analysisId}
                    proReportCreditsCount={proReportCreditsCount}
                    onApplyProReportCredit={onApplyProReportCredit}
                    checkoutSurface="insights_footer_cta"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <SectionHeading>Strong matches</SectionHeading>
                <ul className="mt-3 list-none space-y-2">
                  {sections?.strongMatchBullets.length ? (
                    sections.strongMatchBullets.map((line, idx) => (
                      <li key={idx} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm leading-relaxed text-slate-300">
                        • {line}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">—</li>
                  )}
                </ul>
              </div>

              <div>
                <SectionHeading>Recruiter red flags</SectionHeading>
                <p className="mt-1 text-xs text-slate-500">Gaps, mismatches, and credibility risks from this posting.</p>
                <ul className="mt-3 list-none space-y-2">
                  {sections?.gapBullets.length ? (
                    sections.gapBullets.map((line, idx) => (
                      <li key={idx} className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-sm leading-relaxed text-amber-100/95">
                        • {line}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">—</li>
                  )}
                </ul>
              </div>

              <div>
                <SectionHeading>Interview readiness</SectionHeading>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {sections?.interviewReadinessLines.join('\n') || '—'}
                </p>
              </div>

              <div>
                <SectionHeading>Reality check</SectionHeading>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {sections?.realityCheckParagraphs.join('\n\n') || '—'}
                </p>
              </div>

              <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Tailored cover letter</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Generated from your CV, job posting, and analysis — honest wording only. Included in PDF exports.
                      Adjust language and tone, then edit freely before sending.
                    </p>
                  </div>
                  <LockedHint label="Included" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Language
                    <select
                      value={coverLanguage}
                      onChange={(e) => setCoverLanguage(e.target.value as CoverLetterLanguageId)}
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-100 outline-none focus:border-violet-400/50"
                    >
                      {COVER_LETTER_LANGUAGES.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tone
                    <select
                      value={coverTone}
                      onChange={(e) => setCoverTone(e.target.value as CoverLetterToneId)}
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-100 outline-none focus:border-violet-400/50"
                    >
                      {COVER_LETTER_TONES.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {!coverInputsOk ? (
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    CV and job description in the main form must stay filled (50+ characters each) for generation.
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      coverGenLoading ||
                      !canGenerateCoverLetter(permissionCtx) ||
                      !coverInputsOk ||
                      !analysisId
                    }
                    onClick={() => void runCoverLetterGeneration()}
                    className="rounded-full border border-violet-400/35 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-50 transition hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {coverGenLoading ? 'Generating…' : 'Generate cover letter'}
                  </button>
                  <button
                    type="button"
                    disabled={
                      coverGenLoading ||
                      !canGenerateCoverLetter(permissionCtx) ||
                      !coverInputsOk ||
                      !analysisId
                    }
                    onClick={() => void runCoverLetterGeneration()}
                    className="rounded-full border border-slate-600 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    disabled={!coverLetterText.trim()}
                    onClick={() => void handleCopyCoverLetter()}
                    className="rounded-full border border-slate-600 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/35 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {coverCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {coverGenError ? (
                  <p className="text-[11px] leading-relaxed text-amber-200/95">{coverGenError}</p>
                ) : null}

                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Letter (editable)
                  <textarea
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    rows={14}
                    placeholder="Choose language and tone, then generate — or paste your own draft."
                    className="mt-1.5 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-400/45"
                  />
                </label>
              </div>
            </>
          )}

          {/* PDF export — premium; free tier opens upgrade modal */}
          <div className="border-t border-slate-800/80 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-100">Export PDF report</span>
                  {!canExportPDF(permissionCtx) ? (
                    <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Pro
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {canExportPDF(permissionCtx)
                    ? 'Professional layout with score, summary, skills, suggestions, ATS checklist, and cover letter when generated.'
                    : 'Unlock Pro Report for this posting or Monthly Pro to download your report.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!canExportPDF(permissionCtx)) bumpUpgradeFromLocked('pdf_export')
                  else handlePrint()
                }}
                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 min-[420px]:min-w-[200px] ${
                  canExportPDF(permissionCtx)
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 text-slate-950 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(56,189,248,0.35)]'
                    : 'cursor-pointer border border-slate-600 bg-slate-900 text-slate-200 hover:border-violet-400/35 hover:bg-slate-800'
                }`}
              >
                {!canExportPDF(permissionCtx) ? <LockIcon className="text-slate-400" /> : null}
                Export PDF
              </button>
            </div>
            {gatedFree && !canExportPDF(permissionCtx) ? (
              <div className="mt-5 max-w-lg">
                <p className="mb-3 text-xs leading-relaxed text-slate-500">
                  Export unlocks with Pro Report (this job) or Monthly Pro. Use the button below for secure Stripe
                  Checkout.
                </p>
                <UnlockProReportCta
                  emphasize
                  fullWidth
                  analysisId={analysisId}
                  proReportCreditsCount={proReportCreditsCount}
                  onApplyProReportCredit={onApplyProReportCredit}
                  checkoutSurface="insights_pdf_pro_report"
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-100">Saved reports</div>
          {!savedReportsDashboardAllowed ? (
            <LockedHint label="Upgrade" />
          ) : (
            <LockedHint label="Library" />
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {savedReportsDashboardAllowed
            ? 'Autosaved analyses appear under Saved Reports — reopen CV, posting, and AI output anytime on this browser.'
            : 'Monthly Pro keeps multiple postings in sync (Stripe customer id). Pro Report retains each unlock you purchased.'}
        </p>
        {savedReportsDashboardAllowed ? (
          <Link
            href="/dashboard/reports"
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-violet-400/35 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-50 transition hover:bg-violet-500/18 sm:w-auto"
          >
            Open saved reports
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => bumpUpgradeFromLocked('saved_reports_dashboard')}
            className="mt-4 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-violet-400/35 hover:bg-slate-800 sm:w-auto"
          >
            <LockIcon className="text-violet-300/90" />
            Unlock saved reports
          </button>
        )}
      </div>

      {billingSandboxVisible ? (
        <div id="jobfit-billing-sandbox" className="mt-8 scroll-mt-28 rounded-2xl border border-dashed border-slate-700/90 bg-slate-950/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Billing sandbox · local device only
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Local-only shortcuts. With a saved Stripe customer id, Monthly Pro demo toggle is ignored — subscription status
            comes from Stripe webhooks instead. Pricing:{' '}
            <Link href="/pricing" className="text-cyan-500/90 underline-offset-2 hover:underline">
              /pricing
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onDemoAddProCredit}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-violet-400/35"
            >
              Simulate Pro Report purchase (+1 credit)
            </button>
            <button
              type="button"
              onClick={onDemoToggleMonthlyPro}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400/35"
            >
              Toggle Monthly Pro demo
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
