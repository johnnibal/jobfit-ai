/**
 * Signed HttpOnly cookie binding browser → unconsumed {@link prisma ProReportPendingCredit} row.
 * Uses the same signing material as {@link JOBFIT_ENTITLEMENT_SECRET}.
 */
import { createHmac, timingSafeEqual } from 'crypto'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { entitlementSecretStrict } from '@/lib/billing/proReportEntitlementToken.server'
import { jobFitUsageSecret } from '@/lib/usage/anonymousCookie'

export const JOBFIT_PRO_REPORT_PENDING_CREDIT_COOKIE = 'jobfit_pr_pc'

const ISS = 'jf-pr-pc-v1'

export function proReportPendingCreditCookieAttrs(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: 60 * 60 * 24 * 120,
  }
}

type Payload = { iss: typeof ISS; v: 1; creditId: string; issuedAtSec: number }

function entitlementVerifySecretOrNull(): string | null {
  const s = process.env.JOBFIT_ENTITLEMENT_SECRET?.trim()
  if (s && s.length >= 16) return s
  if (process.env.NODE_ENV !== 'production') {
    try {
      return jobFitUsageSecret()
    } catch {
      return null
    }
  }
  return null
}

function hmac(secret: string, body: string): string {
  return createHmac('sha256', secret).update(`${ISS}|pc|${body}`).digest('base64url')
}

export function mintProReportPendingCreditCookieValue(creditId: string): string {
  if (!creditId?.trim()) throw new Error('Missing credit row id.')
  const secret = entitlementSecretStrict()
  const issuedAtSec = Math.floor(Date.now() / 1000)
  const json = JSON.stringify({ iss: ISS, v: 1, creditId: creditId.trim(), issuedAtSec } satisfies Payload)
  const body = Buffer.from(json, 'utf8').toString('base64url')
  return `${body}.${hmac(secret, body)}`
}

/** Internal Prisma `ProReportPendingCredit` id after HMAC verification. */
export function parseVerifiedProReportPendingCreditId(raw: string | undefined): string | null {
  if (!raw?.includes('.')) return null
  const secret = entitlementVerifySecretOrNull()
  if (!secret) return null

  const dot = raw.indexOf('.')
  const body = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  const expected = hmac(secret, body)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  let parsed: Payload
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Payload
  } catch {
    return null
  }

  if (parsed?.iss !== ISS || parsed.v !== 1 || typeof parsed.creditId !== 'string' || !parsed.creditId.trim()) {
    return null
  }
  return parsed.creditId.trim()
}
