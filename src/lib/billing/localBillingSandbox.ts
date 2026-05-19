/** Synchronous check: localhost dev without deployed/staging hosts. Safe to call from click handlers. */
export function localBillingSandboxActive(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV !== 'development') return false

  const h = window.location.hostname.toLowerCase()

  const isDeployedHost =
    h.includes('railway.app') ||
    h.includes('railway.dev') ||
    h.includes('up.railway.app') ||
    h.endsWith('.vercel.app') ||
    h.endsWith('.jobfit.ai') ||
    process.env.NEXT_PUBLIC_HIDE_BILLING_SANDBOX_UI === '1' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'staging' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'production'

  if (isDeployedHost) return false

  // localhost, 127.0.0.1, or LAN IP while running `next dev`
  return true
}
