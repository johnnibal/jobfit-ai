export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { buildBillingSessionPayload } from '@/lib/billing/billingSessionPayload.server'
import { ERR_DATABASE_NOT_CONFIGURED } from '@/lib/api/publicErrors'
import { logServerError } from '@/lib/logging/safeLog.server'

/** Backwards-compatible alias — same payload as `GET /api/billing/session`. */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: ERR_DATABASE_NOT_CONFIGURED }, { status: 503 })
  }
  try {
    const jar = await cookies()
    const payload = await buildBillingSessionPayload((n) => jar.get(n))
    return NextResponse.json(payload)
  } catch (e) {
    logServerError('[billing/subscription-status]', e)
    return NextResponse.json({ error: 'Could not load billing profile.' }, { status: 503 })
  }
}
