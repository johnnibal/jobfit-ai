import {
  JOBFIT_PRO_REPORT_PENDING_CREDIT_COOKIE,
  mintProReportPendingCreditCookieValue,
  proReportPendingCreditCookieAttrs,
} from '@/lib/billing/proReportCreditCookie.server'
import type { NextResponse } from 'next/server'
import {
  appendProReportEntitlementCookie,
  JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE,
  proReportEntitlementCookieAttrs,
} from '@/lib/billing/proReportEntitlementToken.server'
import {
  JOBFIT_MONTHLY_PRO_COOKIE,
  premiumCookieAttrs,
  signMonthlyProEntitlementCookie,
} from '@/lib/billing/signedPremiumCookie'

export function attachMonthlyProBillingCookie(res: NextResponse, stripeCustomerId: string): void {
  res.cookies.set(JOBFIT_MONTHLY_PRO_COOKIE, signMonthlyProEntitlementCookie(stripeCustomerId), premiumCookieAttrs())
}

/**
 * HttpOnly signed Pro Report entitlement (narrow `/api` path, `JOBFIT_ENTITLEMENT_SECRET`).
 * Call only after server-side payment/unlock confirmation — never from client-provided Stripe identifiers.
 */
export function attachProReportEntitlementTokenCookie(
  res: NextResponse,
  previousCookieValue: string | undefined,
  analysisId: string
): void {
  try {
    res.cookies.set(
      JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE,
      appendProReportEntitlementCookie(previousCookieValue, analysisId),
      proReportEntitlementCookieAttrs()
    )
  } catch (e) {
    throw new Error(`Could not mint Pro Report entitlement cookie: ${e instanceof Error ? e.message : String(e)}`)
  }
}

export function attachProReportPendingCreditCookie(res: NextResponse, creditId: string): void {
  try {
    res.cookies.set(
      JOBFIT_PRO_REPORT_PENDING_CREDIT_COOKIE,
      mintProReportPendingCreditCookieValue(creditId),
      proReportPendingCreditCookieAttrs()
    )
  } catch (e) {
    throw new Error(`Could not mint Pro Report pending credit cookie: ${e instanceof Error ? e.message : String(e)}`)
  }
}

export function clearProReportPendingCreditCookie(res: NextResponse): void {
  res.cookies.set(JOBFIT_PRO_REPORT_PENDING_CREDIT_COOKIE, '', {
    ...proReportPendingCreditCookieAttrs(),
    maxAge: 0,
  })
}

export { premiumCookieAttrs } from '@/lib/billing/signedPremiumCookie'