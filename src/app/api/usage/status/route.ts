import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedJobFitUserId } from '@/lib/auth/authenticatedUser'
import { canRunAnalysis, getRemainingAnalyses } from '@/lib/monetizationUsage'
import type { UsageQuotaSnapshot } from '@/lib/monetizationUsage'
import {
  countsForMode,
  loadUsageRow,
  resolveAnalysisQuotaSubject,
} from '@/lib/monetizationUsage.server'
import {
  JOBFIT_ANON_COOKIE,
  mintAnonymousSessionId,
  signAnonymousSessionId,
  verifyAnonymousCookie,
} from '@/lib/usage/anonymousCookie'
import { applyAnonymousSessionCookie } from '@/lib/usage/applyAnonymousSessionCookie'
import {
  JOBFIT_MONTHLY_PRO_COOKIE,
  verifyMonthlyProEntitlementCookie,
} from '@/lib/billing/signedPremiumCookie'

export async function GET() {
  const jar = await cookies()
  const anonVerified = verifyAnonymousCookie(jar.get(JOBFIT_ANON_COOKIE)?.value)
  let signedAnon: string | null = null
  const anonymousSessionId = anonVerified ?? mintAnonymousSessionId()
  if (!anonVerified) {
    signedAnon = signAnonymousSessionId(anonymousSessionId)
  }

  const authenticatedUserId = await getAuthenticatedJobFitUserId()

  const monthlyStripeCustomerFromBillingCookie = verifyMonthlyProEntitlementCookie(
    jar.get(JOBFIT_MONTHLY_PRO_COOKIE)?.value
  )

  const { subject, mode, monthlyProVerified } = await resolveAnalysisQuotaSubject({
    monthlyStripeCustomerFromBillingCookie,
    anonymousSessionId,
    authenticatedUserId,
  })

  const row = await loadUsageRow(subject)
  const { usedInPeriod, limit } = countsForMode(row, mode)

  const snapshot: UsageQuotaSnapshot = {
    usedInPeriod,
    limit,
    period: mode === 'monthly' ? 'month' : 'day',
    monthlyProVerified,
  }

  const res = NextResponse.json({
    monthlyProVerified,
    quotaMode: mode,
    used: usedInPeriod,
    limit,
    remaining: getRemainingAnalyses(snapshot),
    canRun: canRunAnalysis(snapshot),
  })

  applyAnonymousSessionCookie(res, signedAnon)
  return res
}
