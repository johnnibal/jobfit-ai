'use client'

import { useCallback, useState } from 'react'

import { trackEvent } from '@/lib/analytics/track'
import { useBillingSandboxEnvironment } from '@/lib/billing/useBillingSandboxEnvironment'

/** Shared error handling — billing sandbox hints only appear on localhost (see hook). */
function useStripeCheckoutNavigate() {
  const billingSandboxVisible = useBillingSandboxEnvironment()

  const scrollToSandbox = useCallback(() => {
    document.getElementById('jobfit-billing-sandbox')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  return { billingSandboxVisible, scrollToSandbox }
}

type ProReportCheckoutButtonProps = {
  /** Omit or null → `pro_report_credit` checkout */
  analysisId?: string | null
  className?: string
  /** Applied to `<button>` */
  buttonClassName?: string
  children: React.ReactNode
  /** Analytics sink — no PII */
  analyticsSurface: string
  disabled?: boolean
}

const PRO_REPORT_BTN_DEFAULT =
  'inline-flex w-full min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-center text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(139,92,246,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(56,189,248,0.4)] disabled:cursor-not-allowed disabled:opacity-50'

/** Starts Stripe Checkout for Pro Report (scoped unlock) or prepaid credit SKU. */
export function ProReportCheckoutButton({
  analysisId = null,
  className,
  buttonClassName,
  children,
  analyticsSurface,
  disabled = false,
}: ProReportCheckoutButtonProps) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const { billingSandboxVisible, scrollToSandbox } = useStripeCheckoutNavigate()

  const onClick = async () => {
    if (busy || disabled) return

    const body: Record<string, unknown> = {}
    if (analysisId) body.analysisId = analysisId

    setErr(null)
    setBusy(true)
    try {
      trackEvent('stripe_checkout_started', {
        product: analysisId ? 'pro_report' : 'pro_report_credit',
        surface: analyticsSurface,
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
            setErr(typeof data.error === 'string' ? data.error : 'Billing unavailable — use the sandbox below.')
          } else {
            setErr(
              typeof data.error === 'string'
                ? data.error
                : 'Checkout is not configured. Add Stripe keys and price IDs to the deployment environment.'
            )
          }
          return
        }
        if (res.status === 409) {
          setErr(typeof data.error === 'string' ? data.error : 'Already unlocked.')
          return
        }
        if (res.status === 400) {
          setErr(typeof data.error === 'string' ? data.error : 'Could not start checkout.')
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
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void onClick()}
        className={buttonClassName ?? PRO_REPORT_BTN_DEFAULT}
      >
        {busy ? 'Opening checkout…' : children}
      </button>
      {err ? (
        <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-200/95">{err}</p>
      ) : null}
    </div>
  )
}

type MonthlyProCheckoutButtonProps = {
  className?: string
  buttonClassName?: string
  children: React.ReactNode
  analyticsSurface: string
  disabled?: boolean
}

const MONTHLY_BTN_DEFAULT =
  'inline-flex w-full min-h-[44px] items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 px-6 py-3 text-center text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/55 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50'

export function MonthlyProCheckoutButton({
  className,
  buttonClassName,
  children,
  analyticsSurface,
  disabled = false,
}: MonthlyProCheckoutButtonProps) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const { billingSandboxVisible, scrollToSandbox } = useStripeCheckoutNavigate()

  const onClick = async () => {
    if (busy || disabled) return

    setErr(null)
    setBusy(true)
    try {
      trackEvent('stripe_checkout_started', { product: 'monthly_pro', surface: analyticsSurface })

      const res = await fetch('/api/checkout/monthly-pro', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data: { url?: unknown; error?: unknown; fallbackDemo?: unknown } = await res.json()

      if (!res.ok) {
        if (res.status === 503 && data.fallbackDemo) {
          if (billingSandboxVisible) {
            scrollToSandbox()
            setErr(typeof data.error === 'string' ? data.error : 'Billing unavailable — use the sandbox below.')
          } else {
            setErr(
              typeof data.error === 'string'
                ? data.error
                : 'Configure DATABASE_URL, Stripe keys, and STRIPE_MONTHLY_PRO_PRICE_ID for checkout.'
            )
          }
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
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void onClick()}
        className={buttonClassName ?? MONTHLY_BTN_DEFAULT}
      >
        {busy ? 'Opening checkout…' : children}
      </button>
      {err ? (
        <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-200/95">{err}</p>
      ) : null}
    </div>
  )
}
