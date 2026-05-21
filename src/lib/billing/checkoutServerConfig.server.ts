/** Validates server env required before Stripe Checkout can start (no secret values returned). */

import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'

export type CheckoutProduct = 'pro_report' | 'monthly_pro'

export type CheckoutConfigKey =
  | 'DATABASE_URL'
  | 'STRIPE_SECRET_KEY'
  | 'NEXT_PUBLIC_APP_URL'
  | 'JOBFIT_USAGE_SECRET'
  | 'STRIPE_PRO_REPORT_PRICE_ID'
  | 'STRIPE_MONTHLY_PRO_PRICE_ID'

export type StripeKeyMode = 'live' | 'test' | 'unknown'

export function getStripeKeyMode(): StripeKeyMode {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? ''
  if (key.startsWith('sk_live_')) return 'live'
  if (key.startsWith('sk_test_')) return 'test'
  return 'unknown'
}

export function getCheckoutConfigIssues(product: CheckoutProduct): CheckoutConfigKey[] {
  const missing: CheckoutConfigKey[] = []

  if (!process.env.DATABASE_URL?.trim()) missing.push('DATABASE_URL')
  if (!process.env.STRIPE_SECRET_KEY?.trim()) missing.push('STRIPE_SECRET_KEY')
  if (!process.env.NEXT_PUBLIC_APP_URL?.trim()) missing.push('NEXT_PUBLIC_APP_URL')

  const usageSecret = process.env.JOBFIT_USAGE_SECRET?.trim()
  if (!usageSecret || usageSecret.length < 16) missing.push('JOBFIT_USAGE_SECRET')

  if (product === 'pro_report' && !process.env.STRIPE_PRO_REPORT_PRICE_ID?.trim()) {
    missing.push('STRIPE_PRO_REPORT_PRICE_ID')
  }

  if (product === 'monthly_pro' && !process.env.STRIPE_MONTHLY_PRO_PRICE_ID?.trim()) {
    missing.push('STRIPE_MONTHLY_PRO_PRICE_ID')
  }

  return missing
}

export function checkoutConfigIncompleteResponse(product: CheckoutProduct) {
  const missing = getCheckoutConfigIssues(product)
  if (missing.length === 0) return null

  return {
    status: 503 as const,
    body: {
      error: 'Checkout is not fully configured on the server.',
      code: 'CONFIG_INCOMPLETE' as const,
      missing,
    },
  }
}

export type StripePriceCheck = {
  envKey: 'STRIPE_PRO_REPORT_PRICE_ID' | 'STRIPE_MONTHLY_PRO_PRICE_ID'
  priceIdTail: string
  ok: boolean
  active: boolean | null
  recurring: boolean | null
  error: string | null
}

function priceIdTail(id: string): string {
  const t = id.trim()
  if (t.length <= 8) return t
  return `${t.slice(0, 8)}…`
}

/** Calls Stripe to verify price IDs exist in the same mode/account as STRIPE_SECRET_KEY. */
export async function verifyStripeCheckoutPrices(): Promise<{
  keyMode: StripeKeyMode
  prices: StripePriceCheck[]
}> {
  const keyMode = getStripeKeyMode()
  const stripe = getStripe()
  const checks: Array<{ envKey: StripePriceCheck['envKey']; raw: string | undefined }> = [
    { envKey: 'STRIPE_PRO_REPORT_PRICE_ID', raw: process.env.STRIPE_PRO_REPORT_PRICE_ID },
    { envKey: 'STRIPE_MONTHLY_PRO_PRICE_ID', raw: process.env.STRIPE_MONTHLY_PRO_PRICE_ID },
  ]

  if (!stripe) {
    return {
      keyMode,
      prices: checks.map(({ envKey, raw }) => ({
        envKey,
        priceIdTail: raw?.trim() ? priceIdTail(raw) : '(unset)',
        ok: false,
        active: null,
        recurring: null,
        error: 'STRIPE_SECRET_KEY missing or invalid.',
      })),
    }
  }

  const prices: StripePriceCheck[] = []

  for (const { envKey, raw } of checks) {
    const priceId = raw?.trim() ?? ''
    if (!priceId) {
      prices.push({
        envKey,
        priceIdTail: '(unset)',
        ok: false,
        active: null,
        recurring: null,
        error: `${envKey} is not set.`,
      })
      continue
    }

    if (!priceId.startsWith('price_')) {
      prices.push({
        envKey,
        priceIdTail: priceIdTail(priceId),
        ok: false,
        active: null,
        recurring: null,
        error: 'Must be a Price id (price_…), not a Product id (prod_…).',
      })
      continue
    }

    try {
      const price = await stripe.prices.retrieve(priceId)
      prices.push({
        envKey,
        priceIdTail: priceIdTail(priceId),
        ok: true,
        active: price.active,
        recurring: price.type === 'recurring',
        error: !price.active ? 'Price exists but is inactive in Stripe.' : null,
      })
    } catch (e) {
      const message =
        e instanceof Stripe.errors.StripeError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not retrieve price.'
      prices.push({
        envKey,
        priceIdTail: priceIdTail(priceId),
        ok: false,
        active: null,
        recurring: null,
        error: message,
      })
    }
  }

  return { keyMode, prices }
}
