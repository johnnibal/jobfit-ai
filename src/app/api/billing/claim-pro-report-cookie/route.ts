export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { attachProReportEntitlementTokenCookie } from '@/lib/billing/applyPremiumCookies'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE } from '@/lib/billing/proReportEntitlementToken.server'
import { prisma } from '@/lib/prisma'

/**
 * If this analysis has a persisted Pro unlock (Stripe webhook landed first), mint/merge HttpOnly entitlement cookie.
 * Only `analysisId` is read from the body to select the unlock row — never trust client Stripe identifiers for auth.
 */
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  const rawId =
    typeof body === 'object' && body !== null && 'analysisId' in body
      ? (body as { analysisId?: unknown }).analysisId
      : undefined
  const analysisId = typeof rawId === 'string' ? rawId.trim() : ''

  if (!analysisId || !isAnalysisSessionId(analysisId)) {
    return NextResponse.json({ error: 'Valid analysisId is required.' }, { status: 400 })
  }

  try {
    const unlock = await prisma.proReportUnlock.findUnique({
      where: { analysisId },
      select: { id: true },
    })
    if (!unlock) {
      return NextResponse.json({ error: 'Analysis is not unlocked.' }, { status: 403 })
    }

    const jar = await cookies()
    try {
      const res = NextResponse.json({ ok: true })
      attachProReportEntitlementTokenCookie(
        res,
        jar.get(JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE)?.value,
        analysisId
      )
      return res
    } catch (e) {
      console.error('[claim-pro-report-cookie] mint entitlement', e)
      return NextResponse.json(
        { error: 'Could not issue entitlement cookie. Check server configuration.' },
        { status: 503 }
      )
    }
  } catch (e) {
    console.error('[claim-pro-report-cookie]', e)
    return NextResponse.json({ error: 'Could not verify unlock.' }, { status: 500 })
  }
}
