export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { buildBillingSessionPayload } from '@/lib/billing/billingSessionPayload.server'

/** Cookie-backed billing + entitlement snapshot (never trust client `stripeCustomerId`). */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }
  try {
    const jar = await cookies()
    const payload = await buildBillingSessionPayload((n) => jar.get(n))
    return NextResponse.json(payload)
  } catch (e) {
    console.error('[billing/session]', e)
    return NextResponse.json({ error: 'Could not load billing session.' }, { status: 503 })
  }
}
