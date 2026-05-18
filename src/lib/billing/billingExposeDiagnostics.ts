/**
 * When true, API responses may include `debugReason` for Stripe / prepaid credit flows (never secrets).
 * Enable on staging with JOBFIT_BILLING_DIAGNOSTICS=true (Railway NODE_ENV is usually production).
 */
export function exposeBillingDiagnostics(): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const v = process.env.JOBFIT_BILLING_DIAGNOSTICS?.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
}
