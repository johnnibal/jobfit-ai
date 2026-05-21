export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import {
  getCheckoutConfigIssues,
  type CheckoutConfigKey,
} from '@/lib/billing/checkoutServerConfig.server'

/** Safe ops check — returns missing env var names only, never secret values. */
export async function GET() {
  const proReport = getCheckoutConfigIssues('pro_report')
  const monthlyPro = getCheckoutConfigIssues('monthly_pro')

  const allMissing = [...new Set<CheckoutConfigKey>([...proReport, ...monthlyPro])]

  return NextResponse.json({
    ok: allMissing.length === 0,
    proReport: { ok: proReport.length === 0, missing: proReport },
    monthlyPro: { ok: monthlyPro.length === 0, missing: monthlyPro },
    missing: allMissing,
  })
}
