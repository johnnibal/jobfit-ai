export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import {
  getCheckoutConfigIssues,
  verifyStripeCheckoutPrices,
  type CheckoutConfigKey,
} from '@/lib/billing/checkoutServerConfig.server'

/** Safe ops check — missing env names + Stripe price verification (no secrets). */
export async function GET() {
  const proReport = getCheckoutConfigIssues('pro_report')
  const monthlyPro = getCheckoutConfigIssues('monthly_pro')
  const allMissing = [...new Set<CheckoutConfigKey>([...proReport, ...monthlyPro])]

  const stripe = await verifyStripeCheckoutPrices()
  const stripePricesOk = stripe.prices.every((p) => p.ok && p.active !== false && !p.error)

  return NextResponse.json({
    ok: allMissing.length === 0 && stripePricesOk,
    env: {
      proReport: { ok: proReport.length === 0, missing: proReport },
      monthlyPro: { ok: monthlyPro.length === 0, missing: monthlyPro },
      missing: allMissing,
    },
    stripe: {
      keyMode: stripe.keyMode,
      hint:
        stripe.keyMode === 'live'
          ? 'Production uses live keys — price IDs must be created in Stripe Live mode.'
          : stripe.keyMode === 'test'
            ? 'Server uses test keys — price IDs must be from Stripe Test mode.'
            : 'STRIPE_SECRET_KEY should start with sk_live_ or sk_test_.',
      prices: stripe.prices,
    },
  })
}
