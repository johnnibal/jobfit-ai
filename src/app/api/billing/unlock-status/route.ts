export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { isAnalysisUnlocked } from '@/lib/billing/proReportUnlock'

export async function GET(req: Request) {
  const analysisId = new URL(req.url).searchParams.get('analysisId')
  if (!analysisId || !isAnalysisSessionId(analysisId)) {
    return NextResponse.json({ unlocked: false })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ unlocked: false })
  }

  try {
    const unlocked = await isAnalysisUnlocked(analysisId)
    return NextResponse.json({ unlocked })
  } catch {
    return NextResponse.json({ unlocked: false })
  }
}
