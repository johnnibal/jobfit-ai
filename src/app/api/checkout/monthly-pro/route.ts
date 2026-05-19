export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { subscriptionGrantsMonthlyPro } from '@/lib/billing/subscriptionAccess'
import { prisma } from '@/lib/prisma'
import { getPublicAppUrl } from '@/lib/appUrl'
import { getStripe } from '@/lib/stripe'
import { JOBFIT_MONTHLY_PRO_COOKIE, verifyMonthlyProEntitlementCookie } from '@/lib/billing/signedPremiumCookie'
import { ERR_CHECKOUT_NOT_CONFIGURED, ERR_DATABASE_NOT_CONFIGURED } from '@/lib/api/publicErrors'
import { logServerError } from '@/lib/logging/safeLog.server'

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: ERR_DATABASE_NOT_CONFIGURED, code: 'NO_DATABASE', fallbackDemo: true },
        { status: 503 }
      )
    }

    const stripe = getStripe()
    const priceId = process.env.STRIPE_MONTHLY_PRO_PRICE_ID
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

    const jar = await cookies()
    const cookieCustomer = verifyMonthlyProEntitlementCookie(jar.get(JOBFIT_MONTHLY_PRO_COOKIE)?.value)

    let customerId: string

    if (cookieCustomer?.startsWith('cus_')) {
      const existing = await prisma.billingAccount.findUnique({
        where: { stripeCustomerId: cookieCustomer },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Unknown billing session.' }, { status: 400 })
      }
      if (subscriptionGrantsMonthlyPro(existing.subscriptionStatus)) {
        return NextResponse.json(
          { error: 'You already have an active Monthly Pro subscription.', code: 'ALREADY_SUBSCRIBED' },
          { status: 409 }
        )
      }
      customerId = cookieCustomer
    } else {
      // Subscription mode does not support `customer_creation`; create a Customer first, then pass `customer`.
      const customer = await stripe.customers.create({
        metadata: { jobfit_product: 'monthly_pro' },
      })
      customerId = customer.id
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId.trim(), quantity: 1 }],
      success_url: `${appUrl}/checkout/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      metadata: { jobfit_product: 'monthly_pro' },
    }

    const session = await stripe.checkout.sessions.create(params)

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    if (e instanceof Stripe.errors.StripeError) {
      logServerError('[checkout/monthly-pro] stripe', e, {
        stripeType: e.type,
        code: e.code ?? 'none',
      })
    } else {
      logServerError('[checkout/monthly-pro]', e)
    }
    return NextResponse.json({ error: 'Unable to start subscription checkout.' }, { status: 500 })
  }
}
