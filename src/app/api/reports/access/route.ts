export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { requirePremiumAccess } from '@/lib/billing/requirePremiumAccess.server'
import { logServerError } from '@/lib/logging/safeLog.server'

export async function GET(req: Request) {
  try {
    const access = await requirePremiumAccess({
      request: req,
      feature: 'reports_access',
      mode: 'reports_library',
    })
    const mode =
      !access.allowed ? 'none'
      : access.plan === 'monthly_pro' ? 'monthly_pro'
      : access.plan === 'pro_report' ? 'pro_only'
      : 'none'
    return NextResponse.json({ mode })
  } catch (e) {
    logServerError('[reports/access]', e)
    return NextResponse.json({ error: 'Could not resolve library access.' }, { status: 503 })
  }
}
