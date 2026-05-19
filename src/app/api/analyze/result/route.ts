export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { requirePremiumAccess } from '@/lib/billing/requirePremiumAccess.server'
import {
  buildFullAnalyzeResponse,
  buildPreviewAnalyzeResponse,
} from '@/lib/analyze/buildAnalysisPreview'
import { loadAnalysisSnapshot } from '@/lib/analyze/analysisSnapshot.server'
import { logServerError } from '@/lib/logging/safeLog.server'

/**
 * Return full analysis text when the caller has Monthly Pro or Pro Report unlock for this analysisId.
 * Otherwise return the same preview shape as free /api/analyze (no premium section content).
 */
export async function GET(req: Request) {
  const analysisId = new URL(req.url).searchParams.get('analysisId')?.trim() ?? ''
  if (!analysisId || !isAnalysisSessionId(analysisId)) {
    return NextResponse.json({ error: 'Valid analysisId is required.' }, { status: 400 })
  }

  let snapshot: string | null
  try {
    snapshot = await loadAnalysisSnapshot(analysisId)
  } catch (e) {
    logServerError('[analyze/result] load snapshot', e)
    return NextResponse.json({ error: 'Could not load analysis.' }, { status: 503 })
  }

  if (!snapshot) {
    return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })
  }

  let access: Awaited<ReturnType<typeof requirePremiumAccess>>
  try {
    access = await requirePremiumAccess({
      request: req,
      analysisId,
      feature: 'analysis_full_result',
      mode: 'per_analysis',
    })
  } catch (e) {
    logServerError('[analyze/result] entitlement check', e)
    return NextResponse.json({ error: 'Could not verify access.' }, { status: 503 })
  }

  if (access.allowed) {
    const tier = access.plan === 'monthly_pro' ? 'monthly_pro' : 'pro_report'
    return NextResponse.json(buildFullAnalyzeResponse(analysisId, snapshot, tier))
  }

  return NextResponse.json(buildPreviewAnalyzeResponse(analysisId, snapshot))
}
