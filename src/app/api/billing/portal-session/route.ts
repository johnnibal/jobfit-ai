export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JOBFIT_MONTHLY_PRO_COOKIE, verifyMonthlyProEntitlementCookie } from '@/lib/billing/signedPremiumCookie'
import { getPublicAppUrl } from '@/lib/appUrl'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const stripe = getStripe()
  const appUrl = getPublicAppUrl()
  if (!stripe || !appUrl) {
    return NextResponse.json({ error: 'Stripe or app URL not configured.' }, { status: 503 })
  }

  const jar = await cookies()
  const customerId = verifyMonthlyProEntitlementCookie(jar.get(JOBFIT_MONTHLY_PRO_COOKIE)?.value)
  if (!customerId) {
    return NextResponse.json({ error: 'Billing session cookie required.' }, { status: 401 })
  }

  const account = await prisma.billingAccount.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!account) {
    return NextResponse.json({ error: 'Billing profile not found for this session.' }, { status: 404 })
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/analyze`,
    })

    if (!portal.url) {
      return NextResponse.json({ error: 'Stripe did not return a portal URL.' }, { status: 502 })
    }

    return NextResponse.json({ url: portal.url })
  } catch (e) {
    console.error('[portal-session]', e)
    return NextResponse.json({ error: 'Unable to open billing portal.' }, { status: 500 })
  }
}
