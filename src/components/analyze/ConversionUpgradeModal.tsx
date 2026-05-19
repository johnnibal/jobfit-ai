'use client'

import { useCallback, useEffect, useState } from 'react'

import {
 COPY_MONTHLY_PRO_INCLUDES_LONG,
 COPY_MONTHLY_PRO_TAGLINE,
 COPY_PRO_REPORT_INCLUDES,
 COPY_PRO_REPORT_ONELINE,
 LABEL_BUY_PRO_REPORT,
 LABEL_SUBSCRIBE_MONTHLY_PRO,
 LABEL_UNLOCK_PRO_REPORT,
 MONTHLY_PRO_ANALYSES_PER_MONTH,
 PRICE_MONTHLY_PRO_EUR,
 PRICE_PRO_REPORT_EUR,
} from '@/lib/planTypes'
import { trackEvent } from '@/lib/analytics/track'

import type { AppliedProPromo } from '@/components/billing/ProReportPromoBox'
import { ProReportPromoBox } from '@/components/billing/ProReportPromoBox'
import { useBillingSandboxEnvironment } from '@/lib/billing/useBillingSandboxEnvironment'
import { localBillingSandboxActive } from '@/lib/billing/localBillingSandbox'
import { btnPrimary, btnSecondary } from '@/components/ui/theme'

export type ConversionUpgradeVariant = 'conversion' | 'quota_daily' | 'quota_monthly'

export type ConversionUpgradeModalProps = {
 open: boolean
 variant: ConversionUpgradeVariant
 onClose: () => void
 analysisId: string | null
 /** Stripe-linked Monthly Pro — Pro Report SKU hidden as redundant. */
 subscriberMonthlyPro: boolean
 proReportCreditsCount: number
 onApplyProReportCredit: () => void
 onUpgradeMonthly: () => void | Promise<void>
 subscribeMonthlyBusy: boolean
 subscribeMonthlyError: string | null
 /** True when Stripe billing account exists for HttpOnly session (manage subscription in portal). */
 hasStripeBillingHistory: boolean
 onOpenCustomerPortal: () => void | Promise<void>
 portalBusy: boolean
 onLocalDevProReportFallback?: () => void
}

const HEADLINE_CONVERT = 'Pro Report vs Monthly Pro'
const SUB_CONVERT =
 `${COPY_PRO_REPORT_ONELINE}. Or subscribe for ${COPY_MONTHLY_PRO_TAGLINE.toLowerCase()}. Both check out securely with Stripe.`

export function ConversionUpgradeModal({
 open,
 variant,
 onClose,
 analysisId,
 subscriberMonthlyPro,
 proReportCreditsCount,
 onApplyProReportCredit,
 onUpgradeMonthly,
 subscribeMonthlyBusy,
 subscribeMonthlyError,
 hasStripeBillingHistory,
 onOpenCustomerPortal,
 portalBusy,
 onLocalDevProReportFallback,
}: ConversionUpgradeModalProps) {
 const [proBusy, setProBusy] = useState(false)
 const [proErr, setProErr] = useState<string | null>(null)
 const [appliedPromo, setAppliedPromo] = useState<AppliedProPromo | null>(null)
 const billingSandboxVisible = useBillingSandboxEnvironment()
 const sandboxDemoCredits = billingSandboxVisible ? proReportCreditsCount : 0

 useEffect(() => {
 if (!open) setAppliedPromo(null)
 }, [open])

 useEffect(() => {
 if (!open) return
 trackEvent('upgrade_modal_opened', { variant })
 }, [open, variant])

 const scrollToSandbox = useCallback(() => {
 document.getElementById('jobfit-billing-sandbox')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
 }, [])

 const handleProReportCheckout = useCallback(async () => {
 if (analysisId && sandboxDemoCredits > 0) {
 onApplyProReportCredit()
 onClose()
 return
 }
 if (!analysisId && sandboxDemoCredits > 0) return

 if (localBillingSandboxActive() && onLocalDevProReportFallback) {
 trackEvent('stripe_checkout_started', {
 product: analysisId ? 'pro_report' : 'pro_report_credit',
 surface: 'conversion_modal',
 })
 onLocalDevProReportFallback()
 setProErr(null)
 onClose()
 return
 }

 const body: Record<string, unknown> = {}
 if (analysisId) body.analysisId = analysisId
 if (appliedPromo) body.promoCode = appliedPromo.code

 setProErr(null)
 setProBusy(true)
 try {
 trackEvent('stripe_checkout_started', {
 product: analysisId ? 'pro_report' : 'pro_report_credit',
 surface: 'conversion_modal',
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
 if (billingSandboxVisible && onLocalDevProReportFallback) {
 onLocalDevProReportFallback()
 setProErr(null)
 onClose()
 return
 }
 if (billingSandboxVisible) {
 scrollToSandbox()
 setProErr('Local dev: use the Billing sandbox on /analyze (+1 Pro credit) instead of Stripe checkout.')
 } else {
 setProErr(
 typeof data.error === 'string'
 ? data.error
 : 'Checkout is not configured. Add Stripe keys and price IDs in the deployment environment.'
 )
 }
 return
 }
 if (res.status === 409) {
 setProErr(typeof data.error === 'string' ? data.error : 'Already unlocked.')
 return
 }
 if (res.status === 400) {
 setProErr(typeof data.error === 'string' ? data.error : 'Could not apply this promo in checkout.')
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
 setProErr(e instanceof Error ? e.message : 'Something went wrong.')
 } finally {
 setProBusy(false)
 }
 }, [
 analysisId,
 appliedPromo,
 sandboxDemoCredits,
 onApplyProReportCredit,
 onClose,
 scrollToSandbox,
 billingSandboxVisible,
 onLocalDevProReportFallback,
 ])

 const handleUpgradeMonthlyClick = useCallback(() => {
 void onUpgradeMonthly()
 }, [onUpgradeMonthly])

 const handlePortalClick = useCallback(() => {
 void onOpenCustomerPortal()
 }, [onOpenCustomerPortal])

 if (!open) return null

 /** Active subscribers hitting “conversion”: Pro Report SKU is redundant. */
 if (subscriberMonthlyPro && variant !== 'quota_monthly') {
 return (
 <div
 className="fixed inset-0 z-[60] flex items-end justify-center bg-page p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 -md sm:items-center sm:pb-4"
 role="dialog"
 aria-modal="true"
 aria-labelledby="jobfit-conversion-modal-title"
 onMouseDown={(e) => {
 if (e.target === e.currentTarget) onClose()
 }}
 >
 <div className="relative w-full max-w-lg overflow-y-auto rounded-xl border border-ash/70 bg-white">
 <button
 type="button"
 onClick={onClose}
 className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-semibold text-dim transition hover:bg-ash/30 hover:text-onyx"
 aria-label="Close"
 >
 ✕
 </button>
 <h2 id="jobfit-conversion-modal-title" className="pr-10 text-xl font-bold tracking-tight text-onyx sm:text-2xl">
 Full reports are included
 </h2>
 <p className="mt-3 text-sm leading-relaxed text-dim">
 Monthly Pro already unlocks CV suggestions, ATS checklist, tailored cover letters, and PDF exports on each
 analysis. You do not need a separate €{PRICE_PRO_REPORT_EUR} Pro Report checkout.
 </p>
 <div className="mt-6 flex flex-col gap-3">
 {hasStripeBillingHistory ? (
 <button
 type="button"
 disabled={portalBusy}
 onClick={handlePortalClick}
 className={`${btnPrimary} min-h-[48px] w-full px-6 py-3`}
 >
 {portalBusy ? 'Opening portal…' : 'Manage subscription'}
 </button>
 ) : null}
 <button
 type="button"
 onClick={onClose}
 className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-transparent py-2 text-sm font-medium text-dim hover:text-dim"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 )
 }

 const eyebrow =
 variant === 'quota_daily'
 ? "You've used your free analysis for today."
 : variant === 'quota_monthly'
 ? 'Monthly analysis quota reached'
 : null

 const headlineQuotaMonthly = "You've hit your Monthly Pro limit"

 const headlineDefault = variant === 'quota_monthly' ? headlineQuotaMonthly : HEADLINE_CONVERT

 const subtitle =
 variant === 'quota_monthly'
 ? `You've used all included analyses for this UTC calendar month (${MONTHLY_PRO_ANALYSES_PER_MONTH}). Manage billing or try again next month.`
 : variant === 'quota_daily'
 ? `${LABEL_BUY_PRO_REPORT} (${COPY_PRO_REPORT_ONELINE.toLowerCase()}). Or ${LABEL_SUBSCRIBE_MONTHLY_PRO.toLowerCase()} for ${COPY_MONTHLY_PRO_INCLUDES_LONG.toLowerCase()}.`
 : SUB_CONVERT

 const showProStripeUpsell = !subscriberMonthlyPro

 const proButtonLabel =
 proBusy
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
 <div
 className="fixed inset-0 z-[60] flex items-end justify-center bg-page p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 -md sm:items-center sm:pb-4"
 role="dialog"
 aria-modal="true"
 aria-labelledby="jobfit-conversion-modal-title"
 onMouseDown={(e) => {
 if (e.target === e.currentTarget) onClose()
 }}
 >
 <div className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-ash/70 bg-white">
 <button
 type="button"
 onClick={onClose}
 className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-semibold text-dim transition hover:bg-ash/30 hover:text-onyx"
 aria-label="Close"
 >
 ✕
 </button>

 {eyebrow ? (
 <p className="pr-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-onyx/90">{eyebrow}</p>
 ) : null}

 <h2
 id="jobfit-conversion-modal-title"
 className={`${eyebrow ? 'mt-3' : ''} text-xl font-bold tracking-tight text-onyx sm:text-2xl`}
 >
 {headlineDefault}
 </h2>
 <p className="mt-3 text-sm leading-relaxed text-dim sm:text-[15px]">{subtitle}</p>

 {variant === 'quota_monthly' ? (
 <div className="mt-8 flex flex-col gap-3">
 {hasStripeBillingHistory ? (
 <button
 type="button"
 disabled={portalBusy}
 onClick={handlePortalClick}
 className={`${btnPrimary} min-h-[48px] w-full px-6 py-3`}
 >
 {portalBusy ? 'Opening portal…' : 'Manage subscription'}
 </button>
 ) : null}
 <button
 type="button"
 disabled={subscribeMonthlyBusy}
 onClick={handleUpgradeMonthlyClick}
 className={`inline-flex min-h-[48px] w-full items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
 hasStripeBillingHistory
 ? 'border-ash/70 bg-page text-onyx hover:border-onyx/25'
 : `${btnPrimary} border-transparent`
 }`}
 >
 {subscribeMonthlyBusy ? 'Opening Checkout…' : LABEL_SUBSCRIBE_MONTHLY_PRO}
 </button>
 <button
 type="button"
 onClick={onClose}
 className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-transparent py-2 text-sm font-medium text-dim hover:text-dim"
 >
 Not now
 </button>
 </div>
 ) : (
 <div className={`mt-8 grid gap-4 ${showProStripeUpsell ? 'sm:grid-cols-2' : ''}`}>
 {showProStripeUpsell ? (
 <div className="flex flex-col rounded-2xl border border-ash/70 bg-ash/30 p-5">
 <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim/90">One-time</p>
 <p className="mt-2 text-lg font-semibold text-onyx">Pro Report · €{PRICE_PRO_REPORT_EUR}</p>
 {appliedPromo ? (
 <>
 <p className="mt-1 flex flex-wrap items-baseline gap-2 tabular-nums">
 <span className="text-lg font-semibold text-dim line-through">
 €{appliedPromo.originalEur.toFixed(2)}
 </span>
 <span className="text-2xl font-bold text-onyx">€{appliedPromo.discountedEur.toFixed(2)}</span>
 </p>
 <p className="mt-2 text-[11px] leading-snug text-emerald-700">
 {appliedPromo.code} · −{appliedPromo.percentOff}% · Stripe shows the discounted total before you pay.
 </p>
 </>
 ) : (
 <p className="mt-2 text-[13px] leading-relaxed text-dim">{COPY_PRO_REPORT_ONELINE}</p>
 )}
 <p className="mt-2 flex-1 text-xs leading-relaxed text-dim">{COPY_PRO_REPORT_INCLUDES}</p>
 <div className="mt-4">
 <ProReportPromoBox
 key={analysisId ?? 'modal_prepaid_credit'}
 compact
 disabled={proBusy || sandboxDemoCredits > 0}
 onApplied={setAppliedPromo}
 />
 </div>
 <button
 type="button"
 disabled={proBusy}
 onClick={() => void handleProReportCheckout()}
 className={`mt-5 ${btnSecondary} min-h-[48px] w-full rounded-full px-4 py-3 text-sm font-semibold`}
 >
 {proButtonLabel}
 </button>
 {billingSandboxVisible && sandboxDemoCredits > 0 ? (
 <p className="mt-2 text-center text-[11px] text-emerald-700">Sandbox: demo credits apply instantly.</p>
 ) : null}
 {proErr ? (
 <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-800">{proErr}</p>
 ) : null}
 </div>
 ) : null}

 <div
 className={`flex flex-col rounded-2xl border border-ash/70 bg-page p-5 shadow-inner ${
 !showProStripeUpsell ? 'sm:col-span-2' : ''
 }`}
 >
 <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim/90">Subscription</p>
 <p className="mt-2 text-lg font-semibold text-onyx">Monthly Pro · €{PRICE_MONTHLY_PRO_EUR}/month</p>
 <p className="mt-3 text-[13px] font-medium text-dim">{COPY_MONTHLY_PRO_TAGLINE}</p>
 <p className="mt-2 flex-1 text-xs leading-relaxed text-dim">{COPY_MONTHLY_PRO_INCLUDES_LONG}</p>
 <button
 type="button"
 disabled={subscribeMonthlyBusy}
 onClick={handleUpgradeMonthlyClick}
 className={`${btnPrimary} mt-5 min-h-[48px] w-full px-6 py-3`}
 >
 {subscribeMonthlyBusy ? 'Opening Checkout…' : LABEL_SUBSCRIBE_MONTHLY_PRO}
 </button>
 {subscribeMonthlyError && process.env.NODE_ENV !== 'development' ? (
 <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-800">{subscribeMonthlyError}</p>
 ) : null}
 </div>
 </div>
 )}

 <p className="mt-8 text-center text-[11px] leading-relaxed text-dim">
 Secure payment with Stripe. Cancel monthly Pro anytime.
 </p>
 </div>
 </div>
 )
}
