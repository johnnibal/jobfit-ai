import { randomUUID, createHmac, timingSafeEqual } from 'crypto'

export const JOBFIT_ANON_COOKIE = 'jobfit_anon'

/** Shared symmetric secret for signed HTTP-only cookies (anon session + billing entitlements). */
export function jobFitUsageSecret(): string {
  const s = process.env.JOBFIT_USAGE_SECRET
  if (s && s.length >= 16) return s
  if (process.env.NODE_ENV !== 'production') return 'jobfit-dev-usage-secret-change-me'
  throw new Error('JOBFIT_USAGE_SECRET must be set (min 16 chars) for anonymous usage cookies.')
}

export function mintAnonymousSessionId(): string {
  return randomUUID()
}

/** Signed opaque cookie value: `<uuid>.<base64url-hmac>` */
export function signAnonymousSessionId(id: string): string {
  const sig = createHmac('sha256', jobFitUsageSecret()).update(id).digest('base64url')
  return `${id}.${sig}`
}

export function verifyAnonymousCookie(raw: string | undefined): string | null {
  if (!raw?.includes('.')) return null
  const lastDot = raw.lastIndexOf('.')
  const id = raw.slice(0, lastDot)
  const sig = raw.slice(lastDot + 1)
  if (!id || !sig || id.length < 32) return null

  const expected = createHmac('sha256', jobFitUsageSecret()).update(id).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  return id
}
