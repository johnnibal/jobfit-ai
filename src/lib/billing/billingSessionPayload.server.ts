import { prisma } from '@/lib/prisma'
import { verifyMonthlyProStripeCustomer } from '@/lib/monetizationUsage.server'
import {
  JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE,
  listActiveProReportEntitlementAnalysisIds,
} from '@/lib/billing/proReportEntitlementToken.server'
import {
  JOBFIT_MONTHLY_PRO_COOKIE,
  JOBFIT_PRO_REPORT_GRANTS_COOKIE,
  verifyMonthlyProEntitlementCookie,
  verifyProReportGrantsCookie,
} from '@/lib/billing/signedPremiumCookie'

export type BillingSessionPayload = {
  monthlyProActive: boolean
  subscriptionStatus: string
  email: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  lastPaymentFailedAt: string | null
  proReportGrantedAnalysisIds: string[]
}

type CookieGetter = (name: string) => { value: string } | undefined

export async function buildBillingSessionPayload(getCookie: CookieGetter): Promise<BillingSessionPayload> {
  const monthlyCus = verifyMonthlyProEntitlementCookie(getCookie(JOBFIT_MONTHLY_PRO_COOKIE)?.value)
  let monthlyProActive = false
  let subscriptionStatus = 'none'
  let email: string | null = null
  let currentPeriodEnd: string | null = null
  let cancelAtPeriodEnd = false
  let lastPaymentFailedAt: string | null = null

  if (monthlyCus) {
    monthlyProActive = await verifyMonthlyProStripeCustomer(monthlyCus)
    const row = await prisma.billingAccount.findUnique({
      where: { stripeCustomerId: monthlyCus },
    })
    if (row) {
      subscriptionStatus = row.subscriptionStatus
      email = row.email
      currentPeriodEnd = row.currentPeriodEnd?.toISOString() ?? null
      cancelAtPeriodEnd = row.cancelAtPeriodEnd
      lastPaymentFailedAt = row.lastPaymentFailedAt?.toISOString() ?? null
    } else if (monthlyProActive) {
      subscriptionStatus = 'active'
    }
  }

  const fromEntitlement = listActiveProReportEntitlementAnalysisIds(
    getCookie(JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE)?.value
  )
  const fromLegacyGrants = verifyProReportGrantsCookie(getCookie(JOBFIT_PRO_REPORT_GRANTS_COOKIE)?.value) ?? []
  const rawAids = [...new Set([...fromEntitlement, ...fromLegacyGrants])]
  let proReportGrantedAnalysisIds: string[] = []
  if (rawAids.length > 0) {
    const unlocked = await prisma.proReportUnlock.findMany({
      where: { analysisId: { in: rawAids } },
      select: { analysisId: true },
    })
    proReportGrantedAnalysisIds = unlocked.map((r) => r.analysisId)
  }

  return {
    monthlyProActive,
    subscriptionStatus,
    email,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    lastPaymentFailedAt,
    proReportGrantedAnalysisIds,
  }
}

/** Library mode for saved reports nav (cookie-trusted only). */
export async function resolveReportsLibraryModeFromBillingCookies(getCookie: CookieGetter): Promise<
  'monthly_pro' | 'pro_only' | 'none'
> {
  const payload = await buildBillingSessionPayload(getCookie)
  if (payload.monthlyProActive) return 'monthly_pro'
  if (payload.proReportGrantedAnalysisIds.length > 0) return 'pro_only'
  return 'none'
}
