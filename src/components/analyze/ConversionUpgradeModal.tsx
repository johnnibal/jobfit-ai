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
}

const HEADLINE_CONVERT = 'Pro Report vs Monthly Pro'
const SUB_CONVERT =
  `${COPY_PRO_REPORT_ONELINE} — or subscribe for ${COPY_MONTHLY_PRO_TAGLINE.toLowerCase()}. Both check out securely with Stripe.`

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
          if (billingSandboxVisible) {
            scrollToSandbox()
            setProErr(typeof data.error === 'string' ? data.error : 'Billing unavailable — use the sandbox below.')
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
        className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/85 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 backdrop-blur-md sm:items-center sm:pb-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jobfit-conversion-modal-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="relative w-full max-w-lg overflow-y-auto rounded-[28px] border border-slate-700/90 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-[0_0_80px_rgba(34,211,238,0.14)] sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
          <h2 id="jobfit-conversion-modal-title" className="pr-10 text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
            Full reports are included
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Monthly Pro already unlocks CV suggestions, ATS checklist, tailored cover letters, and PDF exports on each
            analysis. You do not need a separate €{PRICE_PRO_REPORT_EUR} Pro Report checkout.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {hasStripeBillingHistory ? (
              <button
                type="button"
                disabled={portalBusy}
                onClick={handlePortalClick}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {portalBusy ? 'Opening portal…' : 'Manage subscription'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-transparent py-2 text-sm font-medium text-slate-500 hover:text-slate-300"
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
        ? `${LABEL_BUY_PRO_REPORT} (${COPY_PRO_REPORT_ONELINE.toLowerCase()}). Or ${LABEL_SUBSCRIBE_MONTHLY_PRO.toLowerCase()} — ${COPY_MONTHLY_PRO_INCLUDES_LONG.toLowerCase()}.`
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/85 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 backdrop-blur-md sm:items-center sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jobfit-conversion-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-[28px] border border-slate-700/90 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-[0_0_80px_rgba(34,211,238,0.14)] sm:max-w-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          aria-label="Close"
        >
          ✕
        </button>

        {eyebrow ? (
          <p className="pr-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/90">{eyebrow}</p>
        ) : null}

        <h2
          id="jobfit-conversion-modal-title"
          className={`${eyebrow ? 'mt-3' : ''} text-xl font-bold tracking-tight text-slate-50 sm:text-2xl`}
        >
          {headlineDefault}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-[15px]">{subtitle}</p>

        {variant === 'quota_monthly' ? (
          <div className="mt-8 flex flex-col gap-3">
            {hasStripeBillingHistory ? (
              <button
                type="button"
                disabled={portalBusy}
                onClick={handlePortalClick}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
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
                  ? 'border-slate-600 bg-slate-950 text-slate-100 hover:border-slate-500'
                  : 'border-transparent bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 text-slate-950 shadow-[0_0_28px_rgba(139,92,246,0.22)] hover:brightness-105'
              }`}
            >
              {subscribeMonthlyBusy ? 'Opening Checkout…' : LABEL_SUBSCRIBE_MONTHLY_PRO}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-transparent py-2 text-sm font-medium text-slate-500 hover:text-slate-300"
            >
              Not now
            </button>
          </div>
        ) : (
          <div className={`mt-8 grid gap-4 ${showProStripeUpsell ? 'sm:grid-cols-2' : ''}`}>
            {showProStripeUpsell ? (
              <div className="flex flex-col rounded-2xl border border-violet-400/25 bg-violet-500/[0.07] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/90">One-time</p>
                <p className="mt-2 text-lg font-semibold text-slate-50">Pro Report · €{PRICE_PRO_REPORT_EUR}</p>
                {appliedPromo ? (
                  <>
                    <p className="mt-1 flex flex-wrap items-baseline gap-2 tabular-nums">
                      <span className="text-lg font-semibold text-slate-500 line-through">
                        €{appliedPromo.originalEur.toFixed(2)}
                      </span>
                      <span className="text-2xl font-bold text-violet-100">€{appliedPromo.discountedEur.toFixed(2)}</span>
                    </p>
                    <p className="mt-2 text-[11px] leading-snug text-emerald-200/85">
                      {appliedPromo.code} · −{appliedPromo.percentOff}% · Stripe shows the discounted total before you pay.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{COPY_PRO_REPORT_ONELINE}</p>
                )}
                <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-500">{COPY_PRO_REPORT_INCLUDES}</p>
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
                  className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-violet-400/45 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-50 transition hover:border-violet-400/70 hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {proButtonLabel}
                </button>
                {sandboxDemoCredits > 0 ? (
                  <p className="mt-2 text-center text-[11px] text-emerald-300/90">Sandbox: demo credits apply instantly.</p>
                ) : null}
                {proErr ? (
                  <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-200/95">{proErr}</p>
                ) : null}
              </div>
            ) : null}

            <div
              className={`flex flex-col rounded-2xl border border-cyan-400/25 bg-slate-950/80 p-5 shadow-inner ${
                !showProStripeUpsell ? 'sm:col-span-2' : ''
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/90">Subscription</p>
              <p className="mt-2 text-lg font-semibold text-slate-50">Monthly Pro · €{PRICE_MONTHLY_PRO_EUR}/month</p>
              <p className="mt-3 text-[13px] font-medium text-slate-300">{COPY_MONTHLY_PRO_TAGLINE}</p>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-500">{COPY_MONTHLY_PRO_INCLUDES_LONG}</p>
              <button
                type="button"
                disabled={subscribeMonthlyBusy}
                onClick={handleUpgradeMonthlyClick}
                className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {subscribeMonthlyBusy ? 'Opening Checkout…' : LABEL_SUBSCRIBE_MONTHLY_PRO}
              </button>
              {subscribeMonthlyError ? (
                <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-200/95">{subscribeMonthlyError}</p>
              ) : null}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-500">
          Secure payment with Stripe. Cancel monthly Pro anytime.
        </p>
      </div>
    </div>
  )
}
