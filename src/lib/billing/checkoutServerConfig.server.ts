/** Validates server env required before Stripe Checkout can start (no secret values returned). */

export type CheckoutProduct = 'pro_report' | 'monthly_pro'

export type CheckoutConfigKey =
  | 'DATABASE_URL'
  | 'STRIPE_SECRET_KEY'
  | 'NEXT_PUBLIC_APP_URL'
  | 'JOBFIT_USAGE_SECRET'
  | 'STRIPE_PRO_REPORT_PRICE_ID'
  | 'STRIPE_MONTHLY_PRO_PRICE_ID'

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
