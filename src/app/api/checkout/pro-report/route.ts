export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { isAnalysisUnlocked } from '@/lib/billing/proReportUnlock'
import { resolveProReportPromo } from '@/lib/billing/proReportPromos.server'
import { getPublicAppUrl } from '@/lib/appUrl'
import { getStripe } from '@/lib/stripe'
import { buildProReportCheckoutStripeCoreFields } from '@/lib/billing/proReportStripeCheckoutFields'

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database is not configured.', code: 'NO_DATABASE', fallbackDemo: true },
        { status: 503 }
      )
    }

    const stripe = getStripe()
    const priceId = process.env.STRIPE_PRO_REPORT_PRICE_ID
    const appUrl = getPublicAppUrl()

    if (!stripe || !priceId?.trim() || !appUrl) {
      return NextResponse.json(
        {
          error:
            'Checkout is not configured. Set STRIPE_SECRET_KEY, STRIPE_PRO_REPORT_PRICE_ID, and NEXT_PUBLIC_APP_URL.',
          code: 'NO_STRIPE',
          fallbackDemo: true,
        },
        { status: 503 }
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const rec = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
    const rawAnalysisId =
      typeof rec.analysisId === 'string' ? rec.analysisId.trim() : rec.analysisId == null ? '' : undefined

    if (typeof rawAnalysisId === 'undefined') {
      return NextResponse.json({ error: 'Invalid analysisId field.' }, { status: 400 })
    }

    const hasAnalysisId = rawAnalysisId.length > 0
    const analysisId = hasAnalysisId ? rawAnalysisId : null

    if (hasAnalysisId && !isAnalysisSessionId(rawAnalysisId)) {
      return NextResponse.json({ error: 'Valid analysisId (UUID v4) is required when provided.' }, { status: 400 })
    }

    if (hasAnalysisId && analysisId) {
      const already = await isAnalysisUnlocked(analysisId)
      if (already) {
        return NextResponse.json(
          { error: 'This analysis already has Pro Report unlocked.', code: 'ALREADY_UNLOCKED' },
          { status: 409 }
        )
      }
    }

    const promoCodeRaw = typeof rec.promoCode === 'string' ? rec.promoCode : ''

    let discounts: undefined | [{ coupon: string }]
    let metadataPromo = ''

    if (typeof promoCodeRaw === 'string' && promoCodeRaw.trim()) {
      const promo = resolveProReportPromo(promoCodeRaw)
      if (!promo.ok) {
        const msg =
          promo.reason === 'expired'
            ? 'This promotion has expired.'
            : promo.reason === 'not_configured'
              ? 'This promotion is not available.'
              : 'Invalid promotion code.'
        return NextResponse.json({ error: msg, code: 'BAD_PROMO' }, { status: 400 })
      }
      discounts = [{ coupon: promo.stripeCouponId }]
      metadataPromo = promo.canonicalCode
    }

    const core = buildProReportCheckoutStripeCoreFields(analysisId)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId.trim(), quantity: 1 }],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      ...(core.client_reference_id ? { client_reference_id: core.client_reference_id } : {}),
      metadata: {
        ...core.metadataBaseline,
        promoCode: metadataPromo,
      },
      ...(discounts ? { discounts } : {}),
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[checkout/pro-report]', e instanceof Error ? e.message : 'unknown_error')
    return NextResponse.json({ error: 'Unable to start checkout. Try again shortly.' }, { status: 500 })
  }
}
