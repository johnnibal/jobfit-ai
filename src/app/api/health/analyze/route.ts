export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAnalyzeConfigIssues } from '@/lib/analyze/analyzeServerConfig.server'
import { verifyOpenRouterKey } from '@/lib/openrouter/verifyOpenRouterKey.server'

/** Safe ops check for CV analysis — missing env names + OpenRouter key/credits (no secrets). */
export async function GET() {
  const missing = getAnalyzeConfigIssues()
  const openrouter = await verifyOpenRouterKey()

  return NextResponse.json({
    ok: missing.length === 0 && openrouter.ok,
    env: {
      ok: missing.length === 0,
      missing,
    },
    openrouter,
  })
}
