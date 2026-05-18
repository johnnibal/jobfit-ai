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
 COPY_INSIGHTS_EMPTY_PAID_PRO_RUN,
 COPY_FREE_TIER_PRIMARY_LINE,
 COPY_MONTHLY_PRO_INCLUDES_LONG,
 COPY_MONTHLY_PRO_TAGLINE,
 COPY_PRO_REPORT_INCLUDES,
 COPY_PRO_REPORT_ONELINE,
 FREE_VISIBLE_SUGGESTION_COUNT,
 LABEL_BUY_PRO_REPORT,
 LABEL_SUBSCRIBE_MONTHLY_PRO,
 LABEL_UNLOCK_PRO_REPORT,
 PRICE_MONTHLY_PRO_EUR,
 PRICE_PRO_REPORT_EUR,
} from '@/lib/planTypes'
import {
 COVER_LETTER_LANGUAGES,
 COVER_LETTER_TONES,
 type CoverLetterLanguageId,
 type CoverLetterToneId,
} from '@/lib/coverLetterOptions'
import { parseAnalysisSections, stripMatchScorePrefix, isFitAnalysisOutput } from '@/lib/parseAnalysis'
import { buildJobFitReportPdfHtml } from '@/lib/pdf/jobFitReportPdf'
import { useBillingSandboxEnvironment } from '@/lib/billing/useBillingSandboxEnvironment'
import { trackEvent } from '@/lib/analytics/track'
import { btnPrimary, btnSecondary, card, cardPadding, lockedPanel, resultSection, scoreCard, scoreValue } from '@/components/ui/theme'

const SHORT_SUMMARY_MAX_CHARS = 320

/** When demo credits are present but cannot apply without this device’s analysis id. */
const MISSING_ANALYSIS_UNLOCK_MSG = 'Run an analysis first to apply a demo Pro Report credit.'
const PREPAID_PRO_REPORT_BROWSER_HINT =
 'Buy once on this browser. Your next successful analyzer run unlocks that result as full Pro Report automatically.'

function ProReportMonthlyComparison() {
 return (
 <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
 <div className="rounded-2xl border border-zinc-300 bg-zinc-100 p-4">
 <p className="text-sm font-semibold text-zinc-900">
 Pro Report · €{PRICE_PRO_REPORT_EUR} one-time
 </p>
 <p className="mt-2 text-xs leading-relaxed text-zinc-500">{COPY_PRO_REPORT_ONELINE}</p>
 <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{COPY_PRO_REPORT_INCLUDES}</p>
 </div>
 <div className="rounded-2xl border border-zinc-300 bg-blue-50 p-4">
 <p className="text-sm font-semibold text-zinc-900">
 Monthly Pro · €{PRICE_MONTHLY_PRO_EUR}/month
 </p>
 <p className="mt-2 text-[13px] font-medium leading-relaxed text-zinc-700/90">{COPY_MONTHLY_PRO_TAGLINE}</p>
 <p className="mt-2 text-xs leading-relaxed text-zinc-500">{COPY_MONTHLY_PRO_INCLUDES_LONG}</p>
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
 <h3 className="text-sm font-semibold text-zinc-900">{children}</h3>
 )
}

function LockedHint({ label }: { label: string }) {
 return (
 <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
 <LockIcon className="h-3 w-3" />
 {label}
 </span>
 )
}

function PremiumUpgradeRow({
 subscriberMonthlyPro,
 analysisId,
 proReportCreditsCount,
 onApplyProReportCredit,
 onSubscribeMonthly,
 subscribeMonthlyBusy,
 checkoutSurface,
}: {
 subscriberMonthlyPro: boolean
 analysisId: string | null
 proReportCreditsCount: number
 onApplyProReportCredit: () => void
 onSubscribeMonthly: () => void
 subscribeMonthlyBusy: boolean
 checkoutSurface: string
}) {
 if (subscriberMonthlyPro) return null
 return (
 <div className="space-y-2">
 <UnlockProReportCta
 emphasize
 fullWidth
 subscriberMonthlyPro={subscriberMonthlyPro}
 analysisId={analysisId}
 proReportCreditsCount={proReportCreditsCount}
 onApplyProReportCredit={onApplyProReportCredit}
 checkoutSurface={checkoutSurface}
 />
 <button
 type="button"
 disabled={subscribeMonthlyBusy}
 onClick={onSubscribeMonthly}
 className={`${btnSecondary} w-full`}
 >
 {subscribeMonthlyBusy ? 'Opening checkout…' : LABEL_SUBSCRIBE_MONTHLY_PRO}
 </button>
 </div>
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
 subscriberMonthlyPro,
 analysisId,
 proReportCreditsCount,
 onApplyProReportCredit,
 checkoutSurface = 'insights_panel',
 variant = 'primary',
 fullWidth,
 emphasize,
}: {
 /** Active Stripe Monthly Pro billing session — omit Pro Report one-time SKU. */
 subscriberMonthlyPro: boolean
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
 const sandboxDemoCredits = billingSandboxVisible ? proReportCreditsCount : 0

 useEffect(() => {
 setAppliedPromo(null)
 }, [analysisId])

 if (subscriberMonthlyPro) return null

 const scrollToSandbox = () => {
 document.getElementById('jobfit-billing-sandbox')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
 }

 const handleClick = async () => {
 if (!analysisId && sandboxDemoCredits > 0) {
 setStripeErr(MISSING_ANALYSIS_UNLOCK_MSG)
 return
 }
 if (analysisId && sandboxDemoCredits > 0) {
 onApplyProReportCredit()
 return
 }

 const body: Record<string, unknown> = {}
 if (analysisId) body.analysisId = analysisId
 if (appliedPromo) body.promoCode = appliedPromo.code

 setStripeErr(null)
 setStripeBusy(true)
 try {
 trackEvent('stripe_checkout_started', {
 product: analysisId ? 'pro_report' : 'pro_report_credit',
 surface: checkoutSurface,
 })
 const res = await fetch('/api/checkout/pro-report', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 })

 const data: { url?: unknown; error?: unknown; fallbackDemo?: unknown } = await res.json()

 if (!res.ok) {
 if (res.status === 503 && data.fallbackDemo) {
 if (billingSandboxVisible) {
 scrollToSandbox()
 setStripeErr(typeof data.error === 'string' ? data.error : 'Billing unavailable. Use the sandbox below.')
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
 billingSandboxVisible && analysisId && sandboxDemoCredits > 0
 ? 'Sandbox: demo credit applies instantly.'
 : null

 const base =
 variant === 'primary'
 ? btnPrimary.replace('inline-flex', 'inline-flex w-full')
 : btnSecondary.replace('inline-flex', 'inline-flex w-full')

 const sizeClass = emphasize
 ? 'min-h-[52px] px-6 py-3 text-[15px] sm:text-base'
 : 'min-h-[48px] px-5 py-2.5 text-sm'

 const buttonLabel =
 stripeBusy
 ? 'Opening checkout…'
 : sandboxDemoCredits > 0 && analysisId
 ? 'Apply demo credit'
 : appliedPromo
 ? analysisId
 ? `Unlock Pro Report · €${appliedPromo.discountedEur.toFixed(2)}`
 : `Buy Pro Report · €${appliedPromo.discountedEur.toFixed(2)}`
 : analysisId
 ? LABEL_UNLOCK_PRO_REPORT
 : LABEL_BUY_PRO_REPORT

 return (
 <div className={fullWidth ? 'w-full' : ''}>
 {sandboxDemoCredits === 0 ? (
 <div className="mb-3">
 <ProReportPromoBox
 key={analysisId ?? 'prepaid_credit'}
 compact
 disabled={stripeBusy}
 onApplied={setAppliedPromo}
 />
 {appliedPromo ? (
 <p className="mt-2 text-center text-[10px] text-zinc-500">
 <span className="line-through opacity-70">€{appliedPromo.originalEur.toFixed(2)}</span>{' '}
 <span className="tabular-nums text-emerald-700">
 −{appliedPromo.percentOff}% · €{appliedPromo.discountedEur.toFixed(2)} due
 </span>
 </p>
 ) : null}
 </div>
 ) : null}
 <button
 type="button"
 disabled={stripeBusy}
 onClick={() => void handleClick()}
 className={`inline-flex w-full items-center justify-center rounded-lg text-center font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${sizeClass} ${base}`}
 title={
 sandboxDemoCredits > 0 && !analysisId
 ? MISSING_ANALYSIS_UNLOCK_MSG
 : analysisId && sandboxDemoCredits > 0
 ? 'Apply sandbox demo credit (local-only).'
 : !analysisId
 ? `Prepaid credit: ${PREPAID_PRO_REPORT_BROWSER_HINT}`
 : stripeBusy
 ? 'Starting Stripe Checkout…'
 : appliedPromo
 ? `Stripe Checkout · discounted €${appliedPromo.discountedEur.toFixed(2)}`
 : 'Pay securely with Stripe (€4.99 one-time).'
 }
 >
 {buttonLabel}
 </button>
 {readyHint ? <p className="mt-2 text-center text-[11px] text-emerald-700">{readyHint}</p> : null}
 {stripeErr ? (
 <p className="mt-2 text-center text-[12px] leading-relaxed text-amber-800">{stripeErr}</p>
 ) : !analysisId ? (
 <p className="mt-2 text-center text-sm leading-snug text-zinc-700">{PREPAID_PRO_REPORT_BROWSER_HINT}</p>
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
 'group relative flex w-full flex-col rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-300'

 const inner = (
 <>
 <div className="relative flex flex-1 flex-col">
 <div className="flex items-start justify-between gap-2">
 <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
 <LockedHint label={onActivate ? 'Locked' : 'Preview'} />
 </div>
 <ul className="mt-3 space-y-1.5">
 {previewLines.map((line, i) => (
 <li key={i} className="text-xs leading-relaxed text-zinc-500">
 {line}
 </li>
 ))}
 </ul>
 {onActivate ? (
 <p className="mt-3 text-xs text-zinc-500">Unlock with Pro Report or Monthly Pro.</p>
 ) : null}
 </div>
 </>
 )

 if (onActivate) {
 return (
 <button
 type="button"
 onClick={onActivate}
 className={`${shell} cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2`}
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
 /** Stripe subscription verified on this billing session — hide Pro Report one-time CTAs only (not demo entitlements). */
 subscriberMonthlyPro: boolean
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
 subscriberMonthlyPro,
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

 const gatedFree = useMemo(() => shouldGateAnalysisSections(permissionCtx), [permissionCtx])

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
 const stripped = stripMatchScorePrefix(result ?? '').trim()
 /** Free tier keeps a teaser; monthly / Pro purchasers see full plain-text fallback when headings are missing */
 if (!gatedFree && stripped.length > 0) return stripped
 const fallbackLine = stripped
 .split('\n')
 .find((l) => l.trim().length > 0)
 return fallbackLine?.trim() ?? ''
 }, [sections, result, gatedFree])

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
 summary: verdictSummary.trim() || 'None',
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
 ? `Plus ${impExtra} more improvement idea${impExtra === 1 ? '' : 's'} + interview framing, included in full report.`
 : 'Deep narrative verdict, skill gaps, and interview-ready framing, included in full report.',
 'Strong matches and structured sections stay blurred until you unlock.',
 ]

 const coverLines = [
 'Opening hook aligned to this employer’s priorities.',
 'Three concise proof paragraphs tied to JD themes.',
 'Professional tone matching your CV facts, with no invented wins.',
 ]

 const pdfLines = [
 'One polished document: score, ATS map, gaps, and suggestions.',
 'Save or share with mentors (optional branding later).',
 'Uses your current analysis, instant after unlock.',
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

 const hasMainContent = Boolean(result || emptyStateOverride)
 const insightCard = 'rounded-xl border border-zinc-200 bg-white p-4 shadow-sm'

 const sidebarPanel = (
 <div className="flex flex-col gap-3">
 <div className={insightCard}>
 <div className="flex flex-wrap items-start justify-between gap-2">
 <h2 className="text-base font-semibold text-zinc-900">Insights</h2>
 <div className="flex flex-wrap items-center gap-2">
 <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-700">
 {permissionBadge}
 </span>
 {billingSandboxVisible && proReportCreditsCount > 0 ? (
 <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-medium text-zinc-700">
 Credits · {proReportCreditsCount}
 </span>
 ) : null}
 </div>
 </div>
 {!result ? (
 <p className="mt-2 text-xs leading-relaxed text-zinc-600">
 <span className="font-medium text-zinc-800">Free</span>: {COPY_FREE_TIER_PRIMARY_LINE}.{' '}
 <span className="font-medium text-zinc-800">Pro Report</span> (€{PRICE_PRO_REPORT_EUR}) ·{' '}
 <span className="font-medium text-zinc-800">Monthly Pro</span> (€{PRICE_MONTHLY_PRO_EUR}/mo).
 </p>
 ) : null}
 </div>

 <div className={insightCard}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <span className="text-sm font-semibold text-zinc-900">
 {quotaPeriod === 'month' ? 'Usage this month' : 'Usage today'}
 </span>
 <span className="tabular-nums text-sm text-zinc-700">
 {quotaLoading ? (
 '…'
 ) : (
 <>
 <span className="font-semibold text-indigo-700">{quotaRemaining}</span>
 <span className="text-zinc-500"> left · </span>
 {Math.min(quotaUsed, quotaCap)} / {quotaCap}
 </>
 )}
 </span>
 </div>
 {quotaError ? (
 <p className="mt-2 text-xs leading-relaxed text-amber-800">{quotaError}</p>
 ) : (
 <p className="mt-2 text-xs leading-relaxed text-zinc-500">
 {quotaPeriod === 'month'
 ? `${quotaCap} analyses per UTC month on Monthly Pro.`
 : `Free tier: ${COPY_FREE_TIER_PRIMARY_LINE}.`}
 </p>
 )}
 </div>

 <div className={insightCard}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <span className="text-sm font-semibold text-zinc-900">Plan status</span>
 <button
 type="button"
 onClick={onRefreshBilling}
 className="text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:underline disabled:opacity-40"
 disabled={billing.loading}
 >
 Refresh
 </button>
 </div>
 {!monthlyProActive && !result ? (
 <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3">
 <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Compare upgrades</p>
 <ProReportMonthlyComparison />
 <UnlockProReportCta
 emphasize
 fullWidth
 checkoutSurface="insights_billing_compare"
 subscriberMonthlyPro={subscriberMonthlyPro}
 analysisId={analysisId}
 proReportCreditsCount={proReportCreditsCount}
 onApplyProReportCredit={onApplyProReportCredit}
 />
 </div>
 ) : null}
 {billing.error ? <p className="mt-2 text-xs leading-relaxed text-amber-800">{billing.error}</p> : null}
 {billing.loading ? <p className="mt-2 text-xs text-zinc-500">Loading…</p> : null}
 {!billing.loading && billing.fetched ? (
 <div className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-600">
 <p>
 Monthly Pro:{' '}
 <span className={billing.monthlyProActive ? 'font-medium text-indigo-700' : 'font-medium text-zinc-500'}>
 {billing.monthlyProActive ? 'Active' : 'Not active'}
 </span>
 {billing.subscriptionStatus && billing.subscriptionStatus !== 'none' ? (
 <span className="text-zinc-500"> · {billing.subscriptionStatus}</span>
 ) : null}
 </p>
 {billing.email ? <p className="text-zinc-500">Billing: {billing.email}</p> : null}
 {billing.lastPaymentFailedAt ? (
 <p className="text-rose-700">Payment failed. Update billing in the portal.</p>
 ) : null}
 {billing.cancelAtPeriodEnd && billing.currentPeriodEnd ? (
 <p className="text-amber-800">
 Ends {new Date(billing.currentPeriodEnd).toLocaleDateString()}.
 </p>
 ) : null}
 </div>
 ) : null}
 <div className="mt-3 flex flex-wrap gap-2">
 {!billing.monthlyProActive ? (
 <button
 type="button"
 disabled={subscribeMonthlyBusy}
 onClick={onSubscribeMonthly}
 className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
 >
 {subscribeMonthlyBusy ? 'Opening…' : LABEL_SUBSCRIBE_MONTHLY_PRO}
 </button>
 ) : null}
 {billing.subscriptionStatus !== 'none' ? (
 <button
 type="button"
 disabled={portalBusy}
 onClick={onOpenCustomerPortal}
 className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
 >
 {portalBusy ? 'Opening…' : 'Manage subscription'}
 </button>
 ) : null}
 </div>
 {subscribeMonthlyError ? (
 <p className="mt-2 text-[11px] leading-relaxed text-amber-800">{subscribeMonthlyError}</p>
 ) : null}
 {portalError ? <p className="mt-2 text-[11px] leading-relaxed text-amber-800">{portalError}</p> : null}
 </div>

 {result && gatedFree && !subscriberMonthlyPro ? (
 <div className={insightCard}>
 <p className="text-sm font-semibold text-zinc-900">Unlock full report</p>
 <p className="mt-1 text-xs leading-relaxed text-zinc-600">
 {COPY_PRO_REPORT_ONELINE}. €{PRICE_PRO_REPORT_EUR} one-time.
 </p>
 <div className="mt-3">
 <PremiumUpgradeRow
 subscriberMonthlyPro={subscriberMonthlyPro}
 analysisId={analysisId}
 proReportCreditsCount={proReportCreditsCount}
 onApplyProReportCredit={onApplyProReportCredit}
 onSubscribeMonthly={onSubscribeMonthly}
 subscribeMonthlyBusy={subscribeMonthlyBusy}
 checkoutSurface="insights_sidebar_unlock"
 />
 </div>
 </div>
 ) : null}

 {result && gatedFree ? (
 <div className={insightCard}>
 <p className="text-sm font-semibold text-zinc-900">Premium features</p>
 <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-600">
 <li>Full CV improvement report</li>
 <li>Structured ATS checklist</li>
 <li>Tailored cover letter</li>
 <li>PDF export</li>
 </ul>
 {showConversionUpsell && onOpenUpgradeModal ? (
 <button
 type="button"
 onClick={() => onOpenUpgradeModal()}
 className="mt-3 flex w-full min-h-[36px] items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
 >
 <LockIcon className="text-zinc-600" />
 Compare upgrade options
 </button>
 ) : null}
 </div>
 ) : null}

 {!result && !subscriberMonthlyPro ? (
 <div className={insightCard}>
 <p className="text-sm font-semibold text-zinc-900">{COPY_INSIGHTS_EMPTY_PAID_PRO_RUN}</p>
 <p className="mt-1 text-xs leading-relaxed text-zinc-600">{COPY_PRO_REPORT_INCLUDES}</p>
 <div className="mt-3">
 <UnlockProReportCta
 emphasize
 fullWidth
 subscriberMonthlyPro={subscriberMonthlyPro}
 checkoutSurface="insights_empty_prepaid_card"
 analysisId={analysisId}
 proReportCreditsCount={proReportCreditsCount}
 onApplyProReportCredit={onApplyProReportCredit}
 />
 </div>
 </div>
 ) : null}

 {!result && !emptyStateOverride ? (
 <div className={insightCard}>
 <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">After you analyze</p>
 <ul className="mt-2 space-y-2 text-xs leading-relaxed text-zinc-600">
 <li>Fit score and summary</li>
 <li>CV improvement suggestions</li>
 <li>ATS keyword checklist preview</li>
 </ul>
 </div>
 ) : null}

 <div className={insightCard}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <span className="text-sm font-semibold text-zinc-900">Saved reports</span>
 {!savedReportsDashboardAllowed ? (
 <LockedHint label="Upgrade" />
 ) : (
 <LockedHint label="Library" />
 )}
 </div>
 <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
 {savedReportsDashboardAllowed
 ? 'Reopen past analyses from your library.'
 : 'Included with Monthly Pro or Pro Report.'}
 </p>
 {savedReportsDashboardAllowed ? (
 <Link
 href="/dashboard/reports"
 className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100"
 >
 Open saved reports
 </Link>
 ) : (
 <button
 type="button"
 onClick={() => bumpUpgradeFromLocked('saved_reports_dashboard')}
 className="mt-3 flex w-full min-h-[40px] items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
 >
 <LockIcon className="text-zinc-600" />
 Unlock saved reports
 </button>
 )}
 </div>

 {billingSandboxVisible ? (
 <div id="jobfit-billing-sandbox" className={`${insightCard} border-dashed`}>
 <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Billing sandbox</p>
 <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">Local-only demo tools.</p>
 <div className="mt-3 flex flex-wrap gap-2">
 <button
 type="button"
 onClick={onDemoAddProCredit}
 className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
 >
 +1 Pro credit
 </button>
 <button
 type="button"
 onClick={onDemoToggleMonthlyPro}
 className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
 >
 Toggle Monthly Pro
 </button>
 </div>
 </div>
 ) : null}
 </div>
 )

 const resultPanel = emptyStateOverride ? (
 <div className="min-w-0">{emptyStateOverride}</div>
 ) : result ? (
 !isFitAnalysisOutput(result) ? (
 <div className={`${card} ${cardPadding} min-w-0`}>
 <h2 className="text-lg font-semibold text-zinc-900">Analysis status</h2>
 <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{result}</p>
 </div>
 ) : (
 <div className={`${card} ${cardPadding} min-w-0 space-y-6`}>
 <div>
 <h2 className="text-lg font-semibold text-zinc-900">Fit report</h2>
 <p className="mt-1 text-sm text-zinc-500">
 {gatedFree
 ? 'Essentials below. Upgrade for the full checklist, cover letter, and PDF export.'
 : 'Full report for this analysis session.'}
 </p>
 </div>

 {matchScore !== null ? (
 <div className={scoreCard}>
 <div>
 <p className="text-sm font-medium text-zinc-900">Match score</p>
 <p className="mt-0.5 text-xs text-zinc-500">CV compared to this job posting</p>
 </div>
 <p className={scoreValue}>
 {matchScore}
 <span className="text-xl font-medium text-zinc-500">%</span>
 </p>
 </div>
 ) : null}

 {gatedFree && !subscriberMonthlyPro ? (
 <div className="rounded-lg border border-zinc-200 bg-white p-4">
 <p className="text-sm font-medium text-zinc-900">Unlock the full report</p>
 <p className="mt-1 text-xs leading-relaxed text-zinc-600">
 {COPY_PRO_REPORT_INCLUDES}
 </p>
 <div className="mt-4">
 <PremiumUpgradeRow
 subscriberMonthlyPro={subscriberMonthlyPro}
 analysisId={analysisId}
 proReportCreditsCount={proReportCreditsCount}
 onApplyProReportCredit={onApplyProReportCredit}
 onSubscribeMonthly={onSubscribeMonthly}
 subscribeMonthlyBusy={subscribeMonthlyBusy}
 checkoutSurface="insights_overview_banner"
 />
 </div>
 </div>
 ) : null}

 {/* Summary */}
 <div className={resultSection}>
 <SectionHeading>Summary</SectionHeading>
 {showConversionUpsell ? (
 <button
 type="button"
 onClick={() => bumpUpgradeFromLocked('summary_narrative')}
 className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left outline-none transition hover:border-zinc-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-zinc-400"
 >
 <p className="text-sm leading-7 text-zinc-700">{truncateSummary(verdictSummary)}</p>
 <p className="mt-2 text-xs leading-relaxed text-zinc-700/85">
 <p className="mt-2 text-xs text-zinc-500">Unlock with Pro Report or Monthly Pro.</p>
 </p>
 </button>
 ) : (
 <>
 <p className="mt-2 text-sm leading-relaxed text-zinc-700">
 {gatedFree ? truncateSummary(verdictSummary) : verdictSummary || 'None'}
 </p>
 {gatedFree ? (
 <p className="mt-2 text-xs text-zinc-500">
 Abbreviated on Free. Full narrative is inside the unlocked report.
 </p>
 ) : null}
 </>
 )}
 </div>

 {/* Top suggestions (free shows 3 only) */}
 <div className={resultSection}>
 <SectionHeading>{gatedFree ? 'Top suggestions' : 'CV improvement suggestions'}</SectionHeading>
 {!canSeeAllSuggestions(permissionCtx) ? (
 <p className="mt-2 text-xs text-zinc-500">
 Three strongest edits on Free. Pro unlocks the complete prioritized list for this role.
 </p>
 ) : null}
 <ul className="mt-3 list-none space-y-2">
 {visibleSuggestions.map((line, idx) => (
 <li key={idx} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800">
 <span className="font-medium text-zinc-600">{idx + 1}.</span> {line}
 </li>
 ))}
 {!visibleSuggestions.length ? (
 <li className="text-sm text-zinc-500">No structured bullets parsed yet.</li>
 ) : null}
 </ul>
 {gatedFree ? (
 <div className="mt-4">
 <PremiumUpgradeRow
 subscriberMonthlyPro={subscriberMonthlyPro}
 analysisId={analysisId}
 proReportCreditsCount={proReportCreditsCount}
 onApplyProReportCredit={onApplyProReportCredit}
 onSubscribeMonthly={onSubscribeMonthly}
 subscribeMonthlyBusy={subscribeMonthlyBusy}
 checkoutSurface="insights_after_suggestions"
 />
 </div>
 ) : null}
 </div>

 {/* ATS */}
 <div className={resultSection}>
 <SectionHeading>ATS keyword checklist</SectionHeading>
 {gatedFree ? (
 <>
 <p className="mt-2 text-xs leading-relaxed text-zinc-500">
 Mirrors terminology from your posting (German or English). Use keywords only where your CV already has
 honest evidence. Avoid stuffing.
 </p>
 <ul className="mt-3 list-none space-y-2">
 {(sections?.atsBullets ?? []).slice(0, FREE_ATS_VISIBLE_COUNT).map((line, idx) => (
 <li key={idx} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800">
 {line}
 </li>
 ))}
 {!(sections?.atsBullets ?? []).slice(0, FREE_ATS_VISIBLE_COUNT).length ? (
 <li className="text-sm text-zinc-500">
 No checklist lines parsed yet. Rerun analysis after pasting a concrete posting.
 </li>
 ) : null}
 </ul>
 <div className={`mt-3 ${lockedPanel}`}>
 <LockIcon className="mx-auto text-zinc-500" />
 <p className="mt-2 text-sm font-medium text-zinc-800">
 {Math.max(0, (sections?.atsBullets ?? []).length - FREE_ATS_VISIBLE_COUNT) > 0
 ? `${Math.max(0, (sections?.atsBullets ?? []).length - FREE_ATS_VISIBLE_COUNT)} more checklist items`
 : 'Full checklist'}{' '}
 locked
 </p>
 <p className="mt-1 text-xs text-zinc-500">
 Required vs optional keywords, placement hints, and integrity warnings.
 </p>
 </div>
 <div className="mt-4">
 <PremiumUpgradeRow
 subscriberMonthlyPro={subscriberMonthlyPro}
 analysisId={analysisId}
 proReportCreditsCount={proReportCreditsCount}
 onApplyProReportCredit={onApplyProReportCredit}
 onSubscribeMonthly={onSubscribeMonthly}
 subscribeMonthlyBusy={subscribeMonthlyBusy}
 checkoutSurface="insights_ats_unlock"
 />
 </div>
 {showConversionUpsell && onOpenUpgradeModal ? (
 <button
 type="button"
 onClick={() => bumpUpgradeFromLocked('ats_full_checklist')}
 className={`${btnSecondary} mt-2 w-full`}
 >
 Compare all plans
 </button>
 ) : null}
 </>
 ) : (
 <>
 <p className="mt-2 text-xs leading-relaxed text-zinc-500">
 Sorted by what the posting stresses vs what your CV can substantiate. Add terms naturally in bullets that
 already reflect that work. Never paste keyword blocks.
 </p>
 {atsPremiumLoading ? (
 <p className="mt-3 text-sm text-zinc-500">Building structured ATS checklist…</p>
 ) : null}
 {atsPremiumErr ? (
 <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
 <p className="text-xs leading-relaxed text-amber-900">{atsPremiumErr}</p>
 <p className="mt-2 text-[11px] text-zinc-500">
 Showing baseline checklist lines parsed from your analysis below.
 </p>
 </div>
 ) : null}
 {!atsPremiumLoading && atsPremium ? (
 <div className="mt-4 space-y-5">
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
 Required keywords found in CV
 </h4>
 <ul className="mt-2 list-none space-y-2">
 {atsPremium.requiredFoundInCv.length ? (
 atsPremium.requiredFoundInCv.map((item, idx) => (
 <li
 key={`f-${idx}`}
 className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
 >
 <span className="font-medium text-emerald-800">{item.phrase}</span>
 {item.cvEvidenceNote ? (
 <span className="mt-1 block text-xs leading-relaxed text-emerald-700">
 {item.cvEvidenceNote}
 </span>
 ) : null}
 </li>
 ))
 ) : (
 <li className="text-sm text-zinc-500">None</li>
 )}
 </ul>
 </div>
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-800">
 Required keywords missing from CV
 </h4>
 <ul className="mt-2 list-none space-y-2">
 {atsPremium.requiredMissingFromCv.length ? (
 atsPremium.requiredMissingFromCv.map((item, idx) => (
 <li
 key={`m-${idx}`}
 className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
 >
 <span className="font-medium text-amber-900">{item.phrase}</span>
 {item.cvEvidenceNote ? (
 <span className="mt-1 block text-xs leading-relaxed text-amber-800">
 {item.cvEvidenceNote}
 </span>
 ) : null}
 </li>
 ))
 ) : (
 <li className="text-sm text-zinc-500">None</li>
 )}
 </ul>
 </div>
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
 Nice-to-have keywords
 </h4>
 <ul className="mt-2 list-none space-y-2">
 {atsPremium.niceToHave.length ? (
 atsPremium.niceToHave.map((item, idx) => (
 <li key={`n-${idx}`} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800">
 <span className="font-medium text-zinc-900">{item.phrase}</span>
 {item.cvEvidenceNote ? (
 <span className="mt-1 block text-xs leading-relaxed text-zinc-600">{item.cvEvidenceNote}</span>
 ) : null}
 </li>
 ))
 ) : (
 <li className="text-sm text-zinc-500">None</li>
 )}
 </ul>
 </div>
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-800/90">
 Natural places for honest additions
 </h4>
 <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
 Only if you truly have adjacent experience. Weave into existing bullets or summaries; don&apos;t append keyword lists.
 </p>
 <ul className="mt-2 list-none space-y-2">
 {atsPremium.suggestedPlacements.length ? (
 atsPremium.suggestedPlacements.map((item, idx) => (
 <li key={`p-${idx}`} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
 <span className="font-medium text-zinc-800">{item.keyword}</span>
 <span className="mt-1 block text-xs leading-relaxed text-zinc-800/75">{item.suggestion}</span>
 </li>
 ))
 ) : (
 <li className="text-sm text-zinc-500">None</li>
 )}
 </ul>
 </div>
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-800">
 Do not force these keywords
 </h4>
 <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
 Posting asks for evidence your CV does not show. Interviews will verify.
 </p>
 <ul className="mt-2 list-none space-y-2">
 {atsPremium.authenticityWarnings.length ? (
 atsPremium.authenticityWarnings.map((item, idx) => (
 <li key={`w-${idx}`} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
 <span className="font-medium text-rose-800">{item.keyword}</span>
 <span className="mt-1 block text-xs leading-relaxed text-rose-700">{item.warning}</span>
 </li>
 ))
 ) : (
 <li className="text-sm text-zinc-500">No extra warnings.</li>
 )}
 </ul>
 </div>
 </div>
 ) : null}
 {!atsPremiumLoading && atsPremiumHandled && !atsPremium ? (
 <ul className="mt-3 list-none space-y-2">
 {sections?.atsBullets.length ? (
 sections.atsBullets.map((line, idx) => (
 <li key={idx} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800">
 • {line}
 </li>
 ))
 ) : (
 <li className="text-sm text-zinc-500">No ATS lines parsed.</li>
 )}
 </ul>
 ) : null}
 </>
 )}
 </div>

 {gatedFree ? (
 <div className={resultSection}>
 <SectionHeading>Premium features</SectionHeading>
 <p className="mt-2 text-xs text-zinc-500">
 Included with Pro Report or Monthly Pro. Tap a card to see upgrade options.
 </p>
 <div className="mt-4 grid gap-3">
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
 <div className="mt-4">
 <PremiumUpgradeRow
 subscriberMonthlyPro={subscriberMonthlyPro}
 analysisId={analysisId}
 proReportCreditsCount={proReportCreditsCount}
 onApplyProReportCredit={onApplyProReportCredit}
 onSubscribeMonthly={onSubscribeMonthly}
 subscribeMonthlyBusy={subscribeMonthlyBusy}
 checkoutSurface="insights_locked_cards_cta"
 />
 </div>
 </div>
 ) : (
 <>
 <div className={resultSection}>
 <SectionHeading>Strong matches</SectionHeading>
 <ul className="mt-3 list-none space-y-2">
 {sections?.strongMatchBullets.length ? (
 sections.strongMatchBullets.map((line, idx) => (
 <li key={idx} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-700">
 {line}
 </li>
 ))
 ) : (
 <li className="text-sm text-zinc-500">None</li>
 )}
 </ul>
 </div>

 <div className={resultSection}>
 <SectionHeading>Recruiter red flags</SectionHeading>
 <p className="mt-1 text-xs text-zinc-500">Gaps, mismatches, and credibility risks from this posting.</p>
 <ul className="mt-3 list-none space-y-2">
 {sections?.gapBullets.length ? (
 sections.gapBullets.map((line, idx) => (
 <li key={idx} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-800">
 {line}
 </li>
 ))
 ) : (
 <li className="text-sm text-zinc-500">None</li>
 )}
 </ul>
 </div>

 <div className={resultSection}>
 <SectionHeading>Interview readiness</SectionHeading>
 <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
 {sections?.interviewReadinessLines.join('\n') || 'None'}
 </p>
 </div>

 <div className={resultSection}>
 <SectionHeading>Reality check</SectionHeading>
 <p className="mt-2 text-sm leading-7 text-zinc-700">
 {sections?.realityCheckParagraphs.join('\n\n') || 'None'}
 </p>
 </div>

 <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <div className="text-sm font-semibold text-zinc-900">Tailored cover letter</div>
 <p className="mt-1 text-xs leading-relaxed text-zinc-500">
 Generated from your CV, job posting, and analysis. Honest wording only. Included in PDF exports.
 Adjust language and tone, then edit freely before sending.
 </p>
 </div>
 <LockedHint label="Included" />
 </div>

 <div className="grid gap-3 sm:grid-cols-2">
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600">
 Language
 <select
 value={coverLanguage}
 onChange={(e) => setCoverLanguage(e.target.value as CoverLetterLanguageId)}
 className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-300"
 >
 {COVER_LETTER_LANGUAGES.map((opt) => (
 <option key={opt.id} value={opt.id}>
 {opt.label}
 </option>
 ))}
 </select>
 </label>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600">
 Tone
 <select
 value={coverTone}
 onChange={(e) => setCoverTone(e.target.value as CoverLetterToneId)}
 className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-300"
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
 <p className="text-[11px] leading-relaxed text-amber-800">
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
 className="rounded-full border border-zinc-300 bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-45"
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
 className="rounded-full border border-zinc-300 bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-45"
 >
 Regenerate
 </button>
 <button
 type="button"
 disabled={!coverLetterText.trim()}
 onClick={() => void handleCopyCoverLetter()}
 className="rounded-full border border-zinc-300 bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-45"
 >
 {coverCopied ? 'Copied!' : 'Copy'}
 </button>
 </div>

 {coverGenError ? (
 <p className="text-[11px] leading-relaxed text-amber-800">{coverGenError}</p>
 ) : null}

 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600">
 Letter (editable)
 <textarea
 value={coverLetterText}
 onChange={(e) => setCoverLetterText(e.target.value)}
 rows={14}
 placeholder="Choose language and tone, then generate, or paste your own draft."
 className="mt-1.5 w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
 />
 </label>
 </div>
 </>
 )}

 {/* PDF export — premium; free tier opens upgrade modal */}
 <div className="border-t border-zinc-200/80 pt-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="min-w-0">
 <div className="inline-flex items-center gap-2">
 <span className="text-sm font-semibold text-zinc-900">Export PDF report</span>
 {!canExportPDF(permissionCtx) ? (
 <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
 Pro
 </span>
 ) : null}
 </div>
 <p className="mt-1 text-xs leading-relaxed text-zinc-500">
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
 className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 min-[420px]:min-w-[200px] ${
 canExportPDF(permissionCtx)
 ? 'bg-indigo-600 text-white hover:bg-indigo-700'
 : 'cursor-pointer border border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50'
 }`}
 >
 {!canExportPDF(permissionCtx) ? <LockIcon className="text-zinc-600" /> : null}
 Export PDF
 </button>
 </div>
 {gatedFree && !canExportPDF(permissionCtx) ? (
 <div className="mt-5 max-w-lg">
 <p className="mb-3 text-xs leading-relaxed text-zinc-500">
 Export unlocks with Pro Report (this job) or Monthly Pro. Use the button below for secure Stripe
 Checkout.
 </p>
 <PremiumUpgradeRow
 subscriberMonthlyPro={subscriberMonthlyPro}
 analysisId={analysisId}
 proReportCreditsCount={proReportCreditsCount}
 onApplyProReportCredit={onApplyProReportCredit}
 onSubscribeMonthly={onSubscribeMonthly}
 subscribeMonthlyBusy={subscribeMonthlyBusy}
 checkoutSurface="insights_pdf_pro_report"
 />
 </div>
 ) : null}
 </div>
 </div>
 )
 ) : null

 if (hasMainContent) {
 return (
 <div className="contents">
 <div className="order-3 min-w-0 lg:order-none lg:col-start-2">{resultPanel}</div>
 <div className="order-2 lg:order-none lg:col-start-3 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:overscroll-contain">
 {sidebarPanel}
 </div>
 </div>
 )
 }

 return sidebarPanel
}
