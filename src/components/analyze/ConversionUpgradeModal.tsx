'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'

import {
  COPY_MONTHLY_PRO_INCLUDES_LONG,
  COPY_MONTHLY_PRO_TAGLINE,
  COPY_PRO_REPORT_INCLUDES,
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
import {
  badgeRecommended,
  btnGhost,
  btnPrimaryFull,
  btnSecondaryFull,
  card,
  iconAccent,
  labelCaps,
  pricingPlanCard,
  pricingPlanCardFeatured,
  pricingPlanFeature,
  pricingPlanPriceValue,
  pricingPlanTitle,
} from '@/components/ui/theme'

export type ConversionUpgradeVariant = 'conversion' | 'quota_daily' | 'quota_monthly'

export type ConversionUpgradeModalProps = {
  open: boolean
  variant: ConversionUpgradeVariant
  onClose: () => void
  analysisId: string | null
  subscriberMonthlyPro: boolean
  proReportCreditsCount: number
  onApplyProReportCredit: () => void
  onUpgradeMonthly: () => void | Promise<void>
  subscribeMonthlyBusy: boolean
  subscribeMonthlyError: string | null
  hasStripeBillingHistory: boolean
  onOpenCustomerPortal: () => void | Promise<void>
  portalBusy: boolean
  onLocalDevProReportFallback?: () => void
}

const MODAL_OVERLAY =
  'fixed inset-0 z-[60] flex items-end justify-center bg-onyx/45 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center sm:p-4'

const MODAL_PANEL = `${card} relative flex max-h-[min(92vh,780px)] w-full max-w-3xl flex-col overflow-hidden`

function CheckIcon() {
  return (
    <svg className={`mt-0.5 h-4 w-4 shrink-0 ${iconAccent}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function PlanFeature({ children }: { children: ReactNode }) {
  return (
    <li className={`flex gap-2.5 ${pricingPlanFeature}`}>
      <CheckIcon />
      <span>{children}</span>
    </li>
  )
}

function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-dim transition hover:bg-ash/20 hover:text-onyx sm:right-4 sm:top-4"
      aria-label="Close"
    >
      <span aria-hidden className="text-lg leading-none">
        ×
      </span>
    </button>
  )
}

function ModalShell({
  titleId,
  eyebrow,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  titleId: string
  eyebrow?: string | null
  title: string
  subtitle: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div
      className={MODAL_OVERLAY}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={MODAL_PANEL}>
        <header className="relative shrink-0 border-b border-ash/80 px-5 pb-5 pt-5 sm:px-8 sm:pb-6 sm:pt-6">
          <ModalCloseButton onClose={onClose} />
          {eyebrow ? (
            <p className="pr-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-brick">{eyebrow}</p>
          ) : null}
          <h2
            id={titleId}
            className={`pr-10 text-xl font-bold tracking-tight text-onyx sm:text-2xl ${eyebrow ? 'mt-2' : ''}`}
          >
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dim sm:text-[15px]">{subtitle}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">{children}</div>

        {footer ? (
          <footer className="shrink-0 border-t border-ash/80 px-5 py-4 text-center text-xs leading-relaxed text-dim sm:px-8">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}

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

  const stripeFooter = 'Secure payment with Stripe. Cancel Monthly Pro anytime.'

  if (subscriberMonthlyPro && variant !== 'quota_monthly') {
    return (
      <ModalShell
        titleId="jobfit-conversion-modal-title"
        title="Full reports are included"
        subtitle="Monthly Pro already unlocks CV suggestions, ATS checklist, tailored cover letters, and PDF exports. You do not need a separate Pro Report checkout."
        onClose={onClose}
        footer={stripeFooter}
      >
        <div className="flex flex-col gap-3">
          {hasStripeBillingHistory ? (
            <button type="button" disabled={portalBusy} onClick={handlePortalClick} className={btnPrimaryFull}>
              {portalBusy ? 'Opening portal…' : 'Manage subscription'}
            </button>
          ) : null}
          <button type="button" onClick={onClose} className={btnGhost}>
            Close
          </button>
        </div>
      </ModalShell>
    )
  }

  const eyebrow =
    variant === 'quota_daily'
      ? "You've used your free analysis for today"
      : variant === 'quota_monthly'
        ? 'Monthly quota reached'
        : null

  const title =
    variant === 'quota_monthly'
      ? "You've hit your Monthly Pro limit"
      : 'Choose how to continue'

  const subtitle =
    variant === 'quota_monthly'
      ? `You have used all ${MONTHLY_PRO_ANALYSES_PER_MONTH} analyses for this UTC calendar month. Manage billing or try again next month.`
      : variant === 'quota_daily'
        ? 'Upgrade for a full report on this application, or subscribe if you apply to many roles each month.'
        : 'Compare one-time Pro Report with Monthly Pro. Checkout is secure through Stripe.'

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

  const proReportFeatures = COPY_PRO_REPORT_INCLUDES.split(',').map((s) => s.trim())

  const monthlyFeatures = COPY_MONTHLY_PRO_INCLUDES_LONG.split(',').map((s) => s.trim())

  return (
    <ModalShell
      titleId="jobfit-conversion-modal-title"
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={stripeFooter}
    >
      {variant === 'quota_monthly' ? (
        <div className="mx-auto flex max-w-md flex-col gap-3">
          {hasStripeBillingHistory ? (
            <button type="button" disabled={portalBusy} onClick={handlePortalClick} className={btnPrimaryFull}>
              {portalBusy ? 'Opening portal…' : 'Manage subscription'}
            </button>
          ) : null}
          <button
            type="button"
            disabled={subscribeMonthlyBusy}
            onClick={handleUpgradeMonthlyClick}
            className={hasStripeBillingHistory ? btnSecondaryFull : btnPrimaryFull}
          >
            {subscribeMonthlyBusy ? 'Opening checkout…' : LABEL_SUBSCRIBE_MONTHLY_PRO}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Not now
          </button>
          {subscribeMonthlyError && process.env.NODE_ENV !== 'development' ? (
            <p className="text-center text-xs leading-relaxed text-amber-800">{subscribeMonthlyError}</p>
          ) : null}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 ${showProStripeUpsell ? 'md:grid-cols-2 md:items-stretch' : 'mx-auto max-w-md'}`}
        >
          {showProStripeUpsell ? (
            <article className={`${pricingPlanCard} !p-5 sm:!p-6`}>
              <p className={labelCaps}>One-time</p>
              <h3 className={`${pricingPlanTitle} mt-2`}>Pro Report</h3>
              {appliedPromo ? (
                <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums">
                  <span className="text-lg font-semibold text-dim line-through">
                    €{appliedPromo.originalEur.toFixed(2)}
                  </span>
                  <span className={pricingPlanPriceValue}>€{appliedPromo.discountedEur.toFixed(2)}</span>
                </p>
              ) : (
                <p className={`${pricingPlanPriceValue} mt-3`}>€{PRICE_PRO_REPORT_EUR}</p>
              )}
              <p className="mt-1 text-xs text-dim">One paid analysis + full report for one application</p>

              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {proReportFeatures.map((feature) => (
                  <PlanFeature key={feature}>{feature}</PlanFeature>
                ))}
              </ul>

              <div className="mt-5 rounded-[14px] border border-ash/80 bg-ash/10 p-3">
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
                className={`${btnSecondaryFull} mt-4`}
              >
                {proButtonLabel}
              </button>

              {appliedPromo ? (
                <p className="mt-2 text-center text-[11px] leading-snug text-emerald-700">
                  {appliedPromo.code} · −{appliedPromo.percentOff}% applied at checkout
                </p>
              ) : null}
              {billingSandboxVisible && sandboxDemoCredits > 0 ? (
                <p className="mt-2 text-center text-[11px] text-emerald-700">Sandbox: demo credits apply instantly.</p>
              ) : null}
              {proErr ? (
                <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-800">{proErr}</p>
              ) : null}
            </article>
          ) : null}

          <article
            className={`${showProStripeUpsell ? pricingPlanCardFeatured : pricingPlanCard} relative !p-5 sm:!p-6`}
          >
            {showProStripeUpsell ? (
              <span className={`${badgeRecommended} absolute -top-2.5 left-4`}>Best value</span>
            ) : null}
            <p className={`${labelCaps} ${showProStripeUpsell ? 'pt-1' : ''}`}>Subscription</p>
            <h3 className={`${pricingPlanTitle} mt-2`}>Monthly Pro</h3>
            <p className={`${pricingPlanPriceValue} mt-3`}>
              €{PRICE_MONTHLY_PRO_EUR}
              <span className="text-base font-medium text-dim">/mo</span>
            </p>
            <p className="mt-1 text-xs text-dim">{COPY_MONTHLY_PRO_TAGLINE}</p>

            <ul className="mt-4 flex flex-1 flex-col gap-2">
              {monthlyFeatures.map((feature) => (
                <PlanFeature key={feature}>{feature}</PlanFeature>
              ))}
            </ul>

            <button
              type="button"
              disabled={subscribeMonthlyBusy}
              onClick={handleUpgradeMonthlyClick}
              className={`${btnPrimaryFull} mt-5`}
            >
              {subscribeMonthlyBusy ? 'Opening checkout…' : LABEL_SUBSCRIBE_MONTHLY_PRO}
            </button>
            {subscribeMonthlyError && process.env.NODE_ENV !== 'development' ? (
              <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-800">{subscribeMonthlyError}</p>
            ) : null}
          </article>
        </div>
      )}
    </ModalShell>
  )
}
