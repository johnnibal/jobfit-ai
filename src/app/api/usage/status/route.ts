import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedJobFitUserId } from '@/lib/auth/authenticatedUser'
import { canRunAnalysis, getRemainingAnalyses } from '@/lib/monetizationUsage'
import type { UsageQuotaSnapshot } from '@/lib/monetizationUsage'
import {
  countsForMode,
  isDatabaseConfigured,
  loadUsageRow,
  resolveAnalysisQuotaSubject,
  usageLimitsDisabled,
} from '@/lib/monetizationUsage.server'
import { FREE_ANALYSES_PER_DAY } from '@/lib/planTypes'
import {
  JOBFIT_ANON_COOKIE,
  mintAnonymousSessionId,
  signAnonymousSessionId,
  verifyAnonymousCookie,
} from '@/lib/usage/anonymousCookie'
import { applyAnonymousSessionCookie } from '@/lib/usage/applyAnonymousSessionCookie'
import {
  JOBFIT_PRO_REPORT_PENDING_CREDIT_COOKIE,
  parseVerifiedProReportPendingCreditId,
} from '@/lib/billing/proReportCreditCookie.server'
import { loadConsumableProReportPendingCredit } from '@/lib/billing/proReportPendingCredit.server'
import {
  JOBFIT_MONTHLY_PRO_COOKIE,
  verifyMonthlyProEntitlementCookie,
} from '@/lib/billing/signedPremiumCookie'
import { logServerError } from '@/lib/logging/safeLog.server'

function degradedUsageResponse(signedAnon: string | null) {
  const limit = FREE_ANALYSES_PER_DAY
  const used = 0
  const snapshot: UsageQuotaSnapshot = {
    usedInPeriod: used,
    limit,
    period: 'day',
    monthlyProVerified: false,
  }
  const res = NextResponse.json({
    monthlyProVerified: false,
    quotaMode: 'daily',
    used,
    limit,
    remaining: getRemainingAnalyses(snapshot),
    canRun: usageLimitsDisabled() || canRunAnalysis(snapshot),
    prepaidProReportCreditEligible: false,
    degraded: true,
    error: 'Usage quota could not be verified.',
  })
  applyAnonymousSessionCookie(res, signedAnon)
  return res
}

export async function GET() {
  let signedAnon: string | null = null

  try {
  const jar = await cookies()
  const anonVerified = verifyAnonymousCookie(jar.get(JOBFIT_ANON_COOKIE)?.value)
  const anonymousSessionId = anonVerified ?? mintAnonymousSessionId()
  if (!anonVerified) {
    signedAnon = signAnonymousSessionId(anonymousSessionId)
  }

  const authenticatedUserId = await getAuthenticatedJobFitUserId()

  if (!isDatabaseConfigured()) {
    const limit = FREE_ANALYSES_PER_DAY
    const used = 0
    const snapshot: UsageQuotaSnapshot = {
      usedInPeriod: used,
      limit,
      period: 'day',
      monthlyProVerified: false,
    }
    const canRun = usageLimitsDisabled() || canRunAnalysis(snapshot)
    const res = NextResponse.json({
      monthlyProVerified: false,
      quotaMode: 'daily',
      used,
      limit,
      remaining: getRemainingAnalyses(snapshot),
      canRun,
      prepaidProReportCreditEligible: false,
      offline: true,
    })
    applyAnonymousSessionCookie(res, signedAnon)
    return res
  }

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

  let prepaidCreditEligible = false
  if (!monthlyProVerified) {
    const creditParsed = parseVerifiedProReportPendingCreditId(
      jar.get(JOBFIT_PRO_REPORT_PENDING_CREDIT_COOKIE)?.value
    )
    if (creditParsed) {
      const creditRow = await loadConsumableProReportPendingCredit({
        creditIdFromCookie: creditParsed,
        anonymousSessionId,
      })
      prepaidCreditEligible = !!creditRow
    }
  }

  const baseCanRun = canRunAnalysis(snapshot)
  const canRun = baseCanRun || prepaidCreditEligible

  const res = NextResponse.json({
    monthlyProVerified,
    quotaMode: mode,
    used: usedInPeriod,
    limit,
    remaining: getRemainingAnalyses(snapshot),
    canRun,
    prepaidProReportCreditEligible: prepaidCreditEligible,
  })

  applyAnonymousSessionCookie(res, signedAnon)
  return res
  } catch (e) {
    logServerError('[usage/status]', e)
    return degradedUsageResponse(signedAnon)
  }
}
