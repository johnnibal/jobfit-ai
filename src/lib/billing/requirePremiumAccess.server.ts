/**
 * Central server-side entitlement gate for premium features (ATS checklist, cover letter, saved reports, etc.).
 *
 * ## Trusted inputs — what we NEVER take from clients
 *
 * - **Stripe `customerId` in JSON/query/localStorage/local state** — an attacker can paste any `cus_*` ID.
 *   Real identity must come from **HttpOnly, server-signed billing cookies** (written only after Stripe
 *   confirms payment / subscription) or from an **authenticated server session** keyed to our own user records.
 *
 * - **Plan / entitlement booleans** (`isPro`, `isPaid`, `hasMonthlyPro`) from the browser are meaningless:
 *   the server reconciles Stripe subscription rows (`BillingAccount`), `ProReportUnlock`, and signed cookies —
 *   never echoes “what the SPA claims.”
 *
 * - The **`Cookie` header may be spoofed**, but attackers still cannot forge a valid HMAC on our premium
 *   cookies without the correct server secrets (`JOBFIT_USAGE_SECRET`, `JOBFIT_ENTITLEMENT_SECRET`).
 *
 * ## Provenance
 *
 * - **Monthly Pro**: signed monthly cookie reveals a Stripe customer candidate; **subscription status comes
 *   from PostgreSQL (`BillingAccount`)**, not from the client.
 * - **Pro Report**: primary anonymous access is **`jobfit_pr_ent`** — HttpOnly cookie signed with
 *   `JOBFIT_ENTITLEMENT_SECRET`; payload binds `purchaseType: "pro_report"` to an exact `analysisId` plus
 *   `issuedAt` / optional `expiresAt`. Legacy **`jobfit_pg`** grants (`JOBFIT_USAGE_SECRET`) remain verified during
 *   migration; both are intersected with `ProReportUnlock` so only paid analyses unlock.
 *
 * There is currently **no dedicated server PDF route**; exports that mirror “full report” content should use
 * the same helper when/if a document API ships.
 *
 * Manual QA checklist (staging):
 * - Free browser (no cookies): premium APIs return 403.
 * - After Pro Report checkout: cookie includes paid `analysisId` only; APIs 403 on a different UUID.
 * - Monthly Pro: premium APIs succeed for any valid `analysisId` while subscription is active in DB.
 */
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedJobFitUserId } from '@/lib/auth/authenticatedUser'
import { verifyMonthlyProStripeCustomer } from '@/lib/monetizationUsage.server'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { buildBillingSessionPayload } from '@/lib/billing/billingSessionPayload.server'
import { logServerError } from '@/lib/logging/safeLog.server'
import {
  JOBFIT_MONTHLY_PRO_COOKIE,
  JOBFIT_PRO_REPORT_GRANTS_COOKIE,
  verifyMonthlyProEntitlementCookie,
  verifyProReportGrantsCookie,
} from '@/lib/billing/signedPremiumCookie'
import {
  JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE,
  proReportEntitlementCoversAnalysis,
} from '@/lib/billing/proReportEntitlementToken.server'

export type PremiumBillingPlanKind = 'free' | 'pro_report' | 'monthly_pro'

export type PremiumAccessDecision = {
  allowed: boolean
  reason?: string
  /** When denied, callers may omit; when assessing anonymous traffic without a matched paid lane. */
  plan?: PremiumBillingPlanKind
}

export type PremiumAccessRouteMode =
  /** Cover letter / ATS / saving a snapshot for one analysis run. */
  | 'per_analysis'
  /** Read or delete one row in `SavedReport` — cookies must match tenant on that row. */
  | 'saved_report_row'
  /** List saved reports (`GET /api/reports`) — Monthly Pro subscriber or any verified Pro grant. */
  | 'reports_library'

export type RequirePremiumAccessArgs = {
  /** Inbound request — aligns with {@link cookies()} in the App Router for this invocation. */
  request: Request
  /** Short label for logs / debugging (e.g. `cover_letter`, `save_report`). */
  feature: string
  analysisId?: string | null
  mode?: PremiumAccessRouteMode
}

function inferMode(
  analysisId: string | null | undefined,
  explicit: PremiumAccessRouteMode | undefined
): PremiumAccessRouteMode {
  if (explicit) return explicit
  const id = typeof analysisId === 'string' ? analysisId.trim() : ''
  if (!id) return 'reports_library'
  return 'per_analysis'
}

type CookieGetter = (name: string) => { value: string } | undefined

/** True if cookie-backed Pro entitlement lists this analysis (new signed token or legacy grants list). */
function proReportCookiesCoverAnalysis(getCookie: CookieGetter, analysisId: string): boolean {
  const entRaw = getCookie(JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE)?.value
  if (proReportEntitlementCoversAnalysis(entRaw, analysisId)) return true
  const aids = verifyProReportGrantsCookie(getCookie(JOBFIT_PRO_REPORT_GRANTS_COOKIE)?.value)
  return !!(aids?.includes(analysisId))
}

/**
 * Placeholder for NextAuth / Clerk — when non-null, resolve DB ownership for `analysisId` here instead of
 * relying on billing cookies alone.
 */
async function tryAuthenticatedPremiumForAnalysis(analysisId: string): Promise<PremiumAccessDecision | null> {
  const userId = await getAuthenticatedJobFitUserId()
  if (!userId) return null
  void analysisId
  // Future: map `userId` → Stripe customer / saved reports for this analysis (server-side only).
  return null
}

async function checkPerAnalysis(getCookie: CookieGetter, analysisId: string): Promise<PremiumAccessDecision> {
  const auth = await tryAuthenticatedPremiumForAnalysis(analysisId)
  if (auth?.allowed) return auth

  const monthlyCus = verifyMonthlyProEntitlementCookie(getCookie(JOBFIT_MONTHLY_PRO_COOKIE)?.value)
  if (monthlyCus && (await verifyMonthlyProStripeCustomer(monthlyCus))) {
    return { allowed: true, plan: 'monthly_pro' }
  }

  if (!proReportCookiesCoverAnalysis(getCookie, analysisId)) {
    return { allowed: false, reason: 'no_pro_report_cookie_for_analysis', plan: 'free' }
  }

  const unlock = await prisma.proReportUnlock.findUnique({
    where: { analysisId },
    select: { id: true },
  })
  if (!unlock) {
    return { allowed: false, reason: 'pro_unlock_not_found', plan: 'free' }
  }

  return { allowed: true, plan: 'pro_report' }
}

async function checkSavedReportRow(getCookie: CookieGetter, analysisId: string): Promise<PremiumAccessDecision> {
  const auth = await tryAuthenticatedPremiumForAnalysis(analysisId)
  if (auth?.allowed) return auth

  const row = await prisma.savedReport.findUnique({
    where: { analysisId },
    select: { stripeCustomerId: true, tier: true },
  })
  if (!row) {
    return { allowed: false, reason: 'saved_report_row_missing', plan: 'free' }
  }

  const monthlyCus = verifyMonthlyProEntitlementCookie(getCookie(JOBFIT_MONTHLY_PRO_COOKIE)?.value)
  if (monthlyCus && row.stripeCustomerId === monthlyCus && (await verifyMonthlyProStripeCustomer(monthlyCus))) {
    return { allowed: true, plan: 'monthly_pro' }
  }

  if (!proReportCookiesCoverAnalysis(getCookie, analysisId)) {
    return { allowed: false, reason: 'no_pro_report_cookie_for_saved_row', plan: 'free' }
  }
  if (row.tier !== 'pro_report') {
    return { allowed: false, reason: 'saved_row_not_pro_tier', plan: 'free' }
  }
  const unlock = await prisma.proReportUnlock.findUnique({ where: { analysisId }, select: { id: true } })
  if (!unlock) {
    return { allowed: false, reason: 'pro_unlock_not_found_for_saved_row', plan: 'free' }
  }

  return { allowed: true, plan: 'pro_report' }
}

async function checkReportsLibrary(getCookie: CookieGetter): Promise<PremiumAccessDecision> {
  const payload = await buildBillingSessionPayload(getCookie)
  if (payload.monthlyProActive) {
    return { allowed: true, plan: 'monthly_pro' }
  }
  if (payload.proReportGrantedAnalysisIds.length > 0) {
    return { allowed: true, plan: 'pro_report' }
  }
  return { allowed: false, reason: 'no_library_entitlement', plan: 'free' }
}

export async function requirePremiumAccess(params: RequirePremiumAccessArgs): Promise<PremiumAccessDecision> {
  void params.request

  const mode = inferMode(params.analysisId, params.mode)
  const trimmedId = typeof params.analysisId === 'string' ? params.analysisId.trim() : ''

  if (mode !== 'reports_library' && (!trimmedId || !isAnalysisSessionId(trimmedId))) {
    return { allowed: false, reason: 'invalid_analysis_id', plan: 'free' }
  }

  let decision: PremiumAccessDecision
  const jar = await cookies()
  const getCookie = (name: string) => jar.get(name)

  try {
    switch (mode) {
      case 'per_analysis':
        decision = await checkPerAnalysis(getCookie, trimmedId)
        break
      case 'saved_report_row':
        decision = await checkSavedReportRow(getCookie, trimmedId)
        break
      case 'reports_library':
        decision = await checkReportsLibrary(getCookie)
        break
      default:
        decision = { allowed: false, reason: 'unknown_mode', plan: 'free' }
    }
  } catch (e) {
    logServerError(`[requirePremiumAccess] ${params.feature}`, e, {
      mode: String(params.mode ?? mode),
    })
    return { allowed: false, reason: 'entitlement_check_failed', plan: 'free' }
  }

  return decision
}
