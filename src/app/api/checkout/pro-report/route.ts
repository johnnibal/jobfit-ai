export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { prebindProReportPendingCreditRowAtCheckout } from '@/lib/billing/proReportPendingCredit.server'
import { isAnalysisUnlocked } from '@/lib/billing/proReportUnlock'
import { resolveProReportPromo } from '@/lib/billing/proReportPromos.server'
import { getPublicAppUrl } from '@/lib/appUrl'
import { getStripe } from '@/lib/stripe'
import { buildProReportCheckoutStripeCoreFields } from '@/lib/billing/proReportStripeCheckoutFields'
import {
  JOBFIT_ANON_COOKIE,
  mintAnonymousSessionId,
  signAnonymousSessionId,
  verifyAnonymousCookie,
} from '@/lib/usage/anonymousCookie'
import { applyAnonymousSessionCookie } from '@/lib/usage/applyAnonymousSessionCookie'
import { checkoutUnavailableNoDatabaseMessage, ERR_CHECKOUT_NOT_CONFIGURED } from '@/lib/api/publicErrors'
import { logServerError } from '@/lib/logging/safeLog.server'

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: checkoutUnavailableNoDatabaseMessage(),
          code: 'NO_DATABASE',
          fallbackDemo: true,
        },
        { status: 503 }
      )
    }

    const stripe = getStripe()
    const priceId = process.env.STRIPE_PRO_REPORT_PRICE_ID
    const appUrl = getPublicAppUrl()

    if (!stripe || !priceId?.trim() || !appUrl) {
      return NextResponse.json(
        {
          error: ERR_CHECKOUT_NOT_CONFIGURED,
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

    const jar = await cookies()
    const anonVerified = verifyAnonymousCookie(jar.get(JOBFIT_ANON_COOKIE)?.value)
    const anonymousSessionId = anonVerified ?? mintAnonymousSessionId()

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

    /**
     * Pre-bind pending credit BEFORE redirect so the same Stripe session + HttpOnly anon id correlate.
     * `confirm-session` verifies the anon cookie matches this row.
     */
    if (!hasAnalysisId) {
      try {
        await prebindProReportPendingCreditRowAtCheckout({
          stripeCheckoutSessionId: session.id,
          anonymousSessionId,
        })
      } catch (bindErr) {
        logServerError('[checkout/pro-report] prebind pending credit failed', bindErr)
        const res = NextResponse.json(
          { error: 'Could not reserve prepaid credit. Try again shortly.' },
          { status: 500 }
        )
        applyAnonymousSessionCookie(res, signAnonymousSessionId(anonymousSessionId))
        return res
      }
    }

    const res = NextResponse.json({ url: session.url })
    applyAnonymousSessionCookie(res, signAnonymousSessionId(anonymousSessionId))
    return res
  } catch (e) {
    logServerError('[checkout/pro-report]', e)
    return NextResponse.json({ error: 'Unable to start checkout. Try again shortly.' }, { status: 500 })
  }
}
