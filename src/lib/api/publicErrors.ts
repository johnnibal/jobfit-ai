/** User-facing API errors — no env var names, secrets, or internal tokens. */

export const ERR_AI_NOT_CONFIGURED = 'AI analysis service is not configured.'
export const ERR_CHECKOUT_NOT_CONFIGURED = 'Checkout is not configured on the server.'
export const ERR_DATABASE_NOT_CONFIGURED = 'Database is not configured.'
export const ERR_CHECKOUT_UNAVAILABLE = 'Checkout is temporarily unavailable.'

/** Localhost-only hint when DB checkout is unavailable; generic message elsewhere. */
export function checkoutUnavailableNoDatabaseMessage(): string {
  if (process.env.NODE_ENV === 'development') {
    return 'Checkout needs a database on the server. On localhost, use the Billing sandbox (+1 Pro credit) instead.'
  }
  return ERR_CHECKOUT_UNAVAILABLE
}
