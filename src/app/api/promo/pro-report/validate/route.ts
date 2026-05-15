export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { resolveProReportPromo } from '@/lib/billing/proReportPromos.server'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ valid: false, reason: 'invalid' as const, message: 'Invalid JSON body.' }, { status: 400 })
  }

  const code =
    typeof body === 'object' && body !== null && 'code' in body ? (body as { code?: unknown }).code : undefined
  const promo = resolveProReportPromo(typeof code === 'string' ? code : '')

  if (promo.ok) {
    return NextResponse.json({
      valid: true as const,
      code: promo.canonicalCode,
      percentOff: promo.percentOff,
      originalEur: promo.originalEur,
      discountedEur: promo.discountedEur,
    })
  }

  const message =
    promo.reason === 'expired'
      ? 'This code has expired.'
      : promo.reason === 'not_configured'
        ? 'This promotion is not available yet — check back soon.'
        : 'Unknown or invalid code.'

  return NextResponse.json({
    valid: false as const,
    reason: promo.reason,
    message,
  })
}
