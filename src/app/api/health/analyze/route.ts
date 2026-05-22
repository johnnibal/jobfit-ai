export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAnalyzeConfigIssues } from '@/lib/analyze/analyzeServerConfig.server'

/** Safe ops check for CV analysis — missing env names only (no secret values). */
export async function GET() {
  const missing = getAnalyzeConfigIssues()

  return NextResponse.json({
    ok: missing.length === 0,
    env: {
      ok: missing.length === 0,
      missing,
    },
  })
}
