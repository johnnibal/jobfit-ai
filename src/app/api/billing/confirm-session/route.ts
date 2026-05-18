export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  attachMonthlyProBillingCookie,
  attachProReportEntitlementTokenCookie,
  attachProReportPendingCreditCookie,
} from '@/lib/billing/applyPremiumCookies'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE } from '@/lib/billing/proReportEntitlementToken.server'
import { ensurePendingCreditBoundToAnonymousSession } from '@/lib/billing/proReportPendingCredit.server'
import { upsertBillingAccountFromSubscription } from '@/lib/billing/billingAccountSync'
import { persistProReportUnlock } from '@/lib/billing/proReportUnlock'
import { getStripe } from '@/lib/stripe'
import {
  JOBFIT_ANON_COOKIE,
  mintAnonymousSessionId,
  signAnonymousSessionId,
  verifyAnonymousCookie,
} from '@/lib/usage/anonymousCookie'
import { applyAnonymousSessionCookie } from '@/lib/usage/applyAnonymousSessionCookie'

/**
 * Verify Checkout Session server-side (never trust the client alone).
 * Supports one-time Pro Report (payment) and Monthly Pro (subscription).
 * Sets HttpOnly signed entitlement cookies (no client-trusted Stripe identifiers).
 */
export async function GET(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const sessionId = new URL(req.url).searchParams.get('session_id')
  if (!sessionId?.trim()) {
    return NextResponse.json({ error: 'session_id is required.' }, { status: 400 })
  }

  const trimmedSessionId = sessionId.trim()
  let session
  try {
    session = await stripe.checkout.sessions.retrieve(trimmedSessionId)
  } catch {
    return NextResponse.json({ error: 'Could not retrieve checkout session.' }, { status: 400 })
  }

  const jar = await cookies()

  if (session.mode === 'payment') {
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        {
          error:
            'Stripe still marks this checkout as unpaid. If you were just redirected from payment, wait a few seconds—we will retry from this screen. Otherwise open the Stripe receipt link again.',
          code: 'STRIPE_PAYMENT_PENDING' as const,
        },
        { status: 409 }
      )
    }

    const jobfitProductRaw = session.metadata?.jobfit_product
    const jobfitProduct = typeof jobfitProductRaw === 'string' ? jobfitProductRaw.trim().toLowerCase() : ''

    if (jobfitProduct === 'pro_report_credit') {
      console.info('[confirm-session]', {
        stripeSessionTail: trimmedSessionId.slice(-12),
        jobfit_product: jobfitProduct,
        paid: session.payment_status === 'paid',
      })
      const anonVerified = verifyAnonymousCookie(jar.get(JOBFIT_ANON_COOKIE)?.value)
      let signedAnon: string | null = null
      const anonymousSessionId = anonVerified ?? mintAnonymousSessionId()
      if (!anonVerified) {
        signedAnon = signAnonymousSessionId(anonymousSessionId)
      }

      const bound = await ensurePendingCreditBoundToAnonymousSession({
        session,
        anonymousSessionId,
      })

      if (!bound) {
        console.warn('[confirm-session] prepaid credit binding failed')
        return NextResponse.json(
          {
            error:
              'This Pro Report credit is already tied to another browser session, already used for an analysis, or could not bind to this anonymous session—complete checkout in the same browser, or contact support with your Stripe receipt URL.',
            code: 'PRO_REPORT_CREDIT_BIND_FAILED' as const,
          },
          { status: 409 }
        )
      }

      const res = NextResponse.json({
        ok: true,
        type: 'pro_report_credit' as const,
      })

      applyAnonymousSessionCookie(res, signedAnon)
      try {
        attachProReportPendingCreditCookie(res, bound.creditId)
      } catch (e) {
        console.error('[confirm-session] pending credit cookie', e)
        return NextResponse.json(
          { error: 'Could not issue secure prepaid credit cookie. Check server configuration.' },
          { status: 503 }
        )
      }
      return res
    }

    const analysisId = session.metadata?.analysisId ?? session.client_reference_id ?? ''
    if (!analysisId || !isAnalysisSessionId(analysisId)) {
      return NextResponse.json(
        {
          error:
            'This checkout session is missing analyzer metadata (expected unlock for one result). If you bought prepaid Pro Report credit, return from the Buy Pro Report checkout flow so confirmation lands on analysis setup. Otherwise contact support.',
        },
        { status: 400 }
      )
    }

    console.info('[confirm-session]', {
      stripeSessionTail: trimmedSessionId.slice(-12),
      jobfit_product: jobfitProduct || '(single unlock)',
      analysisTail: analysisId.slice(-8),
    })

    try {
      const sessionCustomer =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer &&
              typeof session.customer === 'object' &&
              session.customer !== null &&
              'id' in session.customer
            ? String((session.customer as { id: string }).id)
            : ''
      await persistProReportUnlock(analysisId, session.id, sessionCustomer.startsWith('cus_') ? sessionCustomer : null)
    } catch (e) {
      console.error('[confirm-session]', e)
      return NextResponse.json({ error: 'Could not save unlock.' }, { status: 500 })
    }

    const res = NextResponse.json({
      ok: true,
      type: 'pro_report' as const,
      analysisId,
    })
    try {
      attachProReportEntitlementTokenCookie(
        res,
        jar.get(JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE)?.value,
        analysisId
      )
    } catch (e) {
      console.error('[confirm-session] entitlement cookie', e)
      return NextResponse.json(
        { error: 'Could not issue secure entitlement. Check server configuration.' },
        { status: 503 }
      )
    }
    return res
  }

  if (session.mode === 'subscription') {
    if (session.status !== 'complete') {
      return NextResponse.json({ error: 'Checkout not complete.' }, { status: 400 })
    }

    const subRef = session.subscription
    const subId = typeof subRef === 'string' ? subRef : subRef?.id
    if (!subId) {
      return NextResponse.json({ error: 'Missing subscription on session.' }, { status: 400 })
    }

    let subscription
    try {
      subscription = await stripe.subscriptions.retrieve(subId)
    } catch {
      return NextResponse.json({ error: 'Could not retrieve subscription.' }, { status: 400 })
    }

    try {
      await upsertBillingAccountFromSubscription(subscription)
    } catch (e) {
      console.error('[confirm-session] subscription sync', e)
      return NextResponse.json({ error: 'Could not save subscription.' }, { status: 500 })
    }

    const sessionCustomer =
      typeof session.customer === 'string' ? session.customer : session.customer?.id ?? ''

    const subscriptionCustomer =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer && typeof subscription.customer === 'object' && 'id' in subscription.customer
          ? String(subscription.customer.id)
          : ''

    const customerId = sessionCustomer || subscriptionCustomer

    if (!customerId.startsWith('cus_')) {
      return NextResponse.json({ error: 'Missing Stripe customer.' }, { status: 400 })
    }

    const res = NextResponse.json({
      ok: true,
      type: 'monthly_pro' as const,
    })
    attachMonthlyProBillingCookie(res, customerId)
    return res
  }

  return NextResponse.json({ error: 'Unsupported checkout mode.' }, { status: 400 })
}
