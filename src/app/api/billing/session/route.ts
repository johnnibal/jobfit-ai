export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { buildBillingSessionPayload } from '@/lib/billing/billingSessionPayload.server'
import { isDatabaseConfigured } from '@/lib/monetizationUsage.server'
import { logServerError } from '@/lib/logging/safeLog.server'

/** Cookie-backed billing + entitlement snapshot (never trust client `stripeCustomerId`). */
export async function GET() {
  try {
    const jar = await cookies()
    const payload = await buildBillingSessionPayload((n) => jar.get(n))
    return NextResponse.json({
      ...payload,
      ...(!isDatabaseConfigured() ? { offline: true } : {}),
    })
  } catch (e) {
    logServerError('[billing/session]', e)
    return NextResponse.json({ error: 'Could not load billing session.' }, { status: 503 })
  }
}
