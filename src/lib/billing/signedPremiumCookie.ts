import { createHmac, timingSafeEqual } from 'crypto'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { jobFitUsageSecret } from '@/lib/usage/anonymousCookie'

/** HttpOnly entitlement: Monthly Pro (signed Stripe customer bound at checkout confirmation). */
export const JOBFIT_MONTHLY_PRO_COOKIE = 'jobfit_mp'

/** HttpOnly: legacy Pro Report grant list (HMAC via `JOBFIT_USAGE_SECRET`).
 * Prefer `jobfit_pr_ent` minted via `JOBFIT_ENTITLEMENT_SECRET`; this cookie is still verified for older sessions.
 */
export const JOBFIT_PRO_REPORT_GRANTS_COOKIE = 'jobfit_pg'

const COOKIE_ISSUER = 'jf-premium-v1'
const TTL_SEC = 60 * 60 * 24 * 400

/** Match {@link applyAnonymousSessionCookie} defaults. */
export function premiumCookieAttrs() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TTL_SEC,
  }
}

function hmac(secret: string, parts: string[]): string {
  return createHmac('sha256', secret).update(parts.join('|')).digest('base64url')
}

type MonthlyPayload = { iss: typeof COOKIE_ISSUER; v: number; mo: string; exp: number }
type GrantsPayload = { iss: typeof COOKIE_ISSUER; v: number; aids: string[]; exp: number }

function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

/** Mint / refresh Monthly Pro browser entitlement (Stripe customer observed server-side at checkout only). */
export function signMonthlyProEntitlementCookie(stripeCustomerId: string): string {
  const cus = stripeCustomerId.trim()
  if (!cus.startsWith('cus_')) throw new Error('Invalid Stripe customer id.')
  const exp = nowSec() + TTL_SEC
  const json = JSON.stringify({ iss: COOKIE_ISSUER, v: 1, mo: cus, exp } satisfies MonthlyPayload)
  const body = Buffer.from(json, 'utf8').toString('base64url')
  const sig = hmac(jobFitUsageSecret(), [COOKIE_ISSUER, 'mo', body])
  return `${body}.${sig}`
}

export function verifyMonthlyProEntitlementCookie(raw: string | undefined): string | null {
  if (!raw?.includes('.')) return null
  const dot = raw.indexOf('.')
  const body = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  if (!body || !sig) return null
  const expected = hmac(jobFitUsageSecret(), [COOKIE_ISSUER, 'mo', body])
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  let parsed: MonthlyPayload
  try {
    const json = Buffer.from(body, 'base64url').toString('utf8')
    parsed = JSON.parse(json) as MonthlyPayload
  } catch {
    return null
  }

  if (parsed?.iss !== COOKIE_ISSUER || parsed.v !== 1 || typeof parsed.mo !== 'string' || typeof parsed.exp !== 'number') {
    return null
  }
  if (!parsed.mo.startsWith('cus_')) return null
  if (parsed.exp <= nowSec()) return null

  return parsed.mo
}

function normalizeAidList(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const x of ids) {
    if (typeof x !== 'string') continue
    const id = x.trim()
    if (!isAnalysisSessionId(id) || seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= 50) break
  }
  return out
}

/** Append an analysis UUID to the signed grants list (server-only callers). */
export function appendProReportGrantCookie(previousRaw: string | undefined, analysisId: string): string {
  if (!isAnalysisSessionId(analysisId)) throw new Error('Invalid analysis session id.')
  const base = verifyProReportGrantsCookie(previousRaw) ?? []
  const aids = [...new Set([analysisId, ...base])].slice(0, 50)

  const exp = nowSec() + TTL_SEC
  const json = JSON.stringify({ iss: COOKIE_ISSUER, v: 1, aids, exp } satisfies GrantsPayload)
  const b = Buffer.from(json, 'utf8').toString('base64url')
  const sig = hmac(jobFitUsageSecret(), [COOKIE_ISSUER, 'pg', b])
  return `${b}.${sig}`
}

export function verifyProReportGrantsCookie(raw: string | undefined): string[] | null {
  if (!raw?.includes('.')) return null
  const dot = raw.indexOf('.')
  const body = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  if (!body || !sig) return null
  const expected = hmac(jobFitUsageSecret(), [COOKIE_ISSUER, 'pg', body])
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  let parsed: GrantsPayload
  try {
    const json = Buffer.from(body, 'base64url').toString('utf8')
    parsed = JSON.parse(json) as GrantsPayload
  } catch {
    return null
  }

  if (parsed?.iss !== COOKIE_ISSUER || parsed.v !== 1 || typeof parsed.exp !== 'number') return null
  if (parsed.exp <= nowSec()) return null

  return normalizeAidList(parsed.aids)
}
