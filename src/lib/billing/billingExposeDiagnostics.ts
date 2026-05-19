/**
 * When true, API responses may include `debugReason` for Stripe / prepaid credit flows (never secrets).
 * Optional on staging only — leave unset/false in production (`NEXT_PUBLIC_APP_ENV=production`).
 */
export function exposeBillingDiagnostics(): boolean {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase()
  if (appEnv === 'production') return false

  if (process.env.NODE_ENV === 'development') return true

  const v = process.env.JOBFIT_BILLING_DIAGNOSTICS?.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
}
