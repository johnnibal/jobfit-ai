import type { BillingPlan } from './planTypes'
import { canRunAnalysis as monetizationCanRunAnalysis, getQuotaLimit } from './monetizationUsage'

/**
 * Everything permission helpers need — keep pure so tests / server reuse stay easy.
 */
export type AnalysisPermissionContext = {
  /** Highest purchased tier flag for UX badges (Stripe would drive this). */
  plan: BillingPlan
  /** Monthly Pro entitlement (Stripe subscription active/trialing, or demo without Stripe customer). */
  monthlyProActive: boolean
  /** One-time Pro Report applied to this analysis session. */
  currentAnalysisFullyUnlocked: boolean
}

export function canViewFullAnalysis(ctx: AnalysisPermissionContext): boolean {
  return ctx.monthlyProActive || ctx.currentAnalysisFullyUnlocked
}

export function canSeeAllSuggestions(ctx: AnalysisPermissionContext): boolean {
  return canViewFullAnalysis(ctx)
}

export function canViewFullATS(ctx: AnalysisPermissionContext): boolean {
  return canViewFullAnalysis(ctx)
}

export function canExportPDF(ctx: AnalysisPermissionContext): boolean {
  return canViewFullAnalysis(ctx)
}

export function canGenerateCoverLetter(ctx: AnalysisPermissionContext): boolean {
  return canViewFullAnalysis(ctx)
}

export function canAccessSavedReports(ctx: AnalysisPermissionContext): boolean {
  return ctx.monthlyProActive
}

/** Free tier shows verdict + score + capped suggestions only. */
export function shouldGateAnalysisSections(ctx: AnalysisPermissionContext): boolean {
  return !canViewFullAnalysis(ctx)
}

export type AnalysisQuotaContext = {
  used: number
  limit: number
}

export function getAnalysisQuotaCap(monthlyProActive: boolean): number {
  return getQuotaLimit(monthlyProActive)
}

export function canRunAnalysis(ctx: AnalysisQuotaContext): boolean {
  return monetizationCanRunAnalysis({ usedInPeriod: ctx.used, limit: ctx.limit })
}

export function buildPermissionContext(params: {
  monthlyProActive: boolean
  analysisId: string | null
  fullyUnlockedAnalysisIds: string[]
}): AnalysisPermissionContext {
  const currentAnalysisFullyUnlocked =
    !!params.analysisId && params.fullyUnlockedAnalysisIds.includes(params.analysisId)

  let plan: BillingPlan = 'free'
  if (params.monthlyProActive) plan = 'monthly_pro'
  else if (currentAnalysisFullyUnlocked) plan = 'pro_report'

  return {
    plan,
    monthlyProActive: params.monthlyProActive,
    currentAnalysisFullyUnlocked,
  }
}
