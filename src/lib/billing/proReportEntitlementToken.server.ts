/**
 * Anonymous Pro Report access: tamper-evident entitlement stored in HttpOnly cookie.
 *
 * - Signed with {@link JOBFIT_ENTITLEMENT_SECRET} (not forwarded to the browser).
 * - Payload includes `analysisId`, `purchaseType: "pro_report"`, timestamps; optional row-level expiry via `expiresAt`.
 * - JavaScript on the frontend cannot read or modify HttpOnly cookies; invalid/forged tokens are rejected.
 */
import { createHmac, timingSafeEqual } from 'crypto'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { jobFitUsageSecret } from '@/lib/usage/anonymousCookie'

/** HttpOnly entitlement: signed Pro Report rows (narrow path — premium APIs live under `/api`). */
export const JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE = 'jobfit_pr_ent'

export const JOBFIT_ENTITLEMENT_SECRET_ENV = 'JOBFIT_ENTITLEMENT_SECRET'

export const ENTITLEMENT_COOKIE_TTL_SEC = 60 * 60 * 24 * 400

/** Same-site + secure policy; tighter than legacy billing cookies (`path: /api`). */
export function proReportEntitlementCookieAttrs() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api',
    maxAge: ENTITLEMENT_COOKIE_TTL_SEC,
  }
}

let devFallbackWarned = false

const ISSUER = 'jf-pr-ent-v1' as const

export type ProReportEntitlementEntry = {
  analysisId: string
  purchaseType: 'pro_report'
  issuedAt: number
  /** `null` = no expiry on this entitlement (lifetime access to premium for that analysis). */
  expiresAt: number | null
}

type EnvelopePayload = {
  iss: typeof ISSUER
  v: 1
  ents: ProReportEntitlementEntry[]
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

function hmac(secret: string, parts: string[]): string {
  return createHmac('sha256', secret).update(parts.join('|')).digest('base64url')
}

/**
 * Signing must use explicit `JOBFIT_ENTITLEMENT_SECRET` in production so Pro Report entitlement is keyed
 * separately from anon session / legacy grant cookies (`JOBFIT_USAGE_SECRET`).
 */
export function entitlementSecretStrict(): string {
  const s = process.env[JOBFIT_ENTITLEMENT_SECRET_ENV]?.trim()
  if (s && s.length >= 16) return s

  if (process.env.NODE_ENV !== 'production') {
    if (!devFallbackWarned) {
      console.warn(
        `[jobfit] ${JOBFIT_ENTITLEMENT_SECRET_ENV} unset; signing Pro Report entitlement with JOBFIT_USAGE_SECRET (development only).`
      )
      devFallbackWarned = true
    }
    return jobFitUsageSecret()
  }

  throw new Error(
    `${JOBFIT_ENTITLEMENT_SECRET_ENV} must be set (min 16 characters) before issuing Pro Report entitlement cookies.`
  )
}

function normalizeEntries(ents: unknown): ProReportEntitlementEntry[] {
  if (!Array.isArray(ents)) return []
  const seen = new Set<string>()
  const out: ProReportEntitlementEntry[] = []
  for (const x of ents) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const analysisId = typeof o.analysisId === 'string' ? o.analysisId.trim() : ''
    if (!isAnalysisSessionId(analysisId)) continue
    if (o.purchaseType !== 'pro_report') continue
    const issuedAt = typeof o.issuedAt === 'number' ? o.issuedAt : NaN
    if (!Number.isFinite(issuedAt)) continue
    const expiresAtRaw = o.expiresAt
    const expiresAt =
      expiresAtRaw === null || expiresAtRaw === undefined
        ? null
        : typeof expiresAtRaw === 'number' && Number.isFinite(expiresAtRaw)
          ? expiresAtRaw
          : null
    // Malformed expiry object → reject row
    if (expiresAtRaw !== null && expiresAtRaw !== undefined && expiresAt === null) continue

    const entry: ProReportEntitlementEntry = {
      analysisId,
      purchaseType: 'pro_report',
      issuedAt,
      expiresAt,
    }

    const key = analysisId
    if (seen.has(key)) continue
    seen.add(key)
    out.push(entry)
    if (out.length >= 50) break
  }
  return out.sort((a, b) => (a.analysisId < b.analysisId ? -1 : a.analysisId > b.analysisId ? 1 : a.issuedAt - b.issuedAt))
}

function entryIsActive(e: ProReportEntitlementEntry, now: number): boolean {
  if (e.expiresAt === null) return true
  return typeof e.expiresAt === 'number' && e.expiresAt > now
}

/**
 * Parse and verify cookie; returns entries that pass HMAC and shape checks (expiry not yet applied).
 */
export function parseVerifiedProReportEntitlements(raw: string | undefined): ProReportEntitlementEntry[] | null {
  if (!raw?.includes('.')) return null
  const secret = entitlementForVerifyOrNull()
  if (!secret) return null

  const dot = raw.indexOf('.')
  const body = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  if (!body || !sig) return null

  const expected = hmac(secret, [ISSUER, 'ent', body])
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  let parsed: EnvelopePayload
  try {
    const json = Buffer.from(body, 'base64url').toString('utf8')
    parsed = JSON.parse(json) as EnvelopePayload
  } catch {
    return null
  }

  if (parsed?.iss !== ISSUER || parsed.v !== 1) return null
  const ents = normalizeEntries(parsed.ents)
  if (ents.length === 0 && Array.isArray(parsed.ents) && parsed.ents.length > 0) return null
  return ents
}

/** Production requires `JOBFIT_ENTITLEMENT_SECRET`; dev falls back to `JOBFIT_USAGE_SECRET` for parity with signing. */
function entitlementForVerifyOrNull(): string | null {
  const s = process.env[JOBFIT_ENTITLEMENT_SECRET_ENV]?.trim()
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

/** Active `analysisId` values from the signed cookie (signature valid, per-row expiry OK). */
export function listActiveProReportEntitlementAnalysisIds(raw: string | undefined): string[] {
  const ents = parseVerifiedProReportEntitlements(raw)
  if (!ents) return []
  const now = nowSec()
  return ents.filter((e) => entryIsActive(e, now)).map((e) => e.analysisId)
}

export function proReportEntitlementCoversAnalysis(raw: string | undefined, analysisId: string): boolean {
  if (!isAnalysisSessionId(analysisId)) return false
  const ents = parseVerifiedProReportEntitlements(raw)
  if (!ents) return false
  const now = nowSec()
  return ents.some((e) => e.analysisId === analysisId && entryIsActive(e, now))
}

export function appendProReportEntitlementCookie(previousRaw: string | undefined, analysisId: string): string {
  if (!isAnalysisSessionId(analysisId)) throw new Error('Invalid analysis session id.')

  const secret = entitlementSecretStrict()
  const now = nowSec()
  const prev = parseVerifiedProReportEntitlements(previousRaw)
  const base = prev ?? []
  const others = base.filter((e) => e.analysisId !== analysisId)
  const nextEnts = normalizeEntries([
    ...others,
    {
      analysisId,
      purchaseType: 'pro_report' as const,
      issuedAt: now,
      expiresAt: null,
    },
  ])
  const json = JSON.stringify({ iss: ISSUER, v: 1, ents: nextEnts } satisfies EnvelopePayload)
  const body = Buffer.from(json, 'utf8').toString('base64url')
  const sig = hmac(secret, [ISSUER, 'ent', body])
  return `${body}.${sig}`
}
