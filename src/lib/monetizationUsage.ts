import type { BillingPlan } from '@/lib/planTypes'
import { FREE_ANALYSES_PER_DAY, MONTHLY_PRO_ANALYSES_PER_MONTH } from '@/lib/planTypes'

/** Pure quota helpers shared by UI + API responses. Persistence: `@/lib/monetizationUsage.server` (`incrementAnalysisUsage`, …). */

/** Monetization tier for UX — Pro Report never lifts analysis quota. */
export type MonetizationUserPlan = BillingPlan

export type UsageQuotaPeriod = 'day' | 'month'

/** Minimal shape for quota math — shared by UI snapshots and permission gates. */
export type UsageQuotaGate = {
  usedInPeriod: number
  limit: number
}

export type UsageQuotaSnapshot = UsageQuotaGate & {
  period: UsageQuotaPeriod
  monthlyProVerified: boolean
}

export type HasProReportSignals = {
  proReportCreditsCount: number
  fullyUnlockedAnalysisIdsCount: number
}

export function getQuotaLimit(monthlyProVerified: boolean): number {
  return monthlyProVerified ? MONTHLY_PRO_ANALYSES_PER_MONTH : FREE_ANALYSES_PER_DAY
}

/** Highest tier for badges — independent from analysis quota caps. */
export function getUserPlan(params: {
  monthlyProVerified: boolean
  hasProReportSignals: HasProReportSignals
}): MonetizationUserPlan {
  if (params.monthlyProVerified) return 'monthly_pro'
  const hasPro =
    params.hasProReportSignals.proReportCreditsCount > 0 ||
    params.hasProReportSignals.fullyUnlockedAnalysisIdsCount > 0
  if (hasPro) return 'pro_report'
  return 'free'
}

export function getRemainingAnalyses(gate: UsageQuotaGate): number {
  return Math.max(0, gate.limit - gate.usedInPeriod)
}

export function canRunAnalysis(gate: UsageQuotaGate): boolean {
  return gate.usedInPeriod < gate.limit
}

/** Server-side persistence lives in `@/lib/monetizationUsage.server` (`incrementAnalysisUsage`, …). */
