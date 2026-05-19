export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import {
  revokeBillingSubscription,
  touchPaymentFailed,
  upsertBillingAccountFromSubscription,
} from '@/lib/billing/billingAccountSync'
import { persistProReportUnlock } from '@/lib/billing/proReportUnlock'
import { upsertProReportPendingCreditFromPaidSession } from '@/lib/billing/proReportPendingCredit.server'
import { JOBFIT_STRIPE_PRO_REPORT_CREDIT } from '@/lib/billing/proReportStripeCheckoutFields'
import { getStripe } from '@/lib/stripe'
import { logServerError, logServerWarn } from '@/lib/logging/safeLog.server'

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const stripe = getStripe()

  if (!secret || !stripe) {
    logServerError('[webhook/stripe] not_configured', 'missing_config', {
      hasWebhookSecret: Boolean(secret),
      hasStripeClient: Boolean(stripe),
    })
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    logServerError('[webhook/stripe] signature_verification_failed', err)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'payment' && session.payment_status === 'paid') {
          const jobfitProductRaw = session.metadata?.jobfit_product
          const jobfitProduct =
            typeof jobfitProductRaw === 'string' ? jobfitProductRaw.trim().toLowerCase() : ''

          if (jobfitProduct === JOBFIT_STRIPE_PRO_REPORT_CREDIT) {
            await upsertProReportPendingCreditFromPaidSession(session)
            break
          }

          const analysisId = session.metadata?.analysisId ?? session.client_reference_id ?? ''
          if (analysisId && isAnalysisSessionId(analysisId)) {
            const sessionCustomer =
              typeof session.customer === 'string'
                ? session.customer
                : session.customer &&
                    typeof session.customer === 'object' &&
                    session.customer !== null &&
                    'id' in session.customer
                  ? String((session.customer as { id: string }).id)
                  : null
            await persistProReportUnlock(analysisId, session.id, sessionCustomer)
          } else {
            logServerWarn('[webhook/stripe] pro_report_checkout_missing_analysis_id', {
              sessionTail: typeof session.id === 'string' ? session.id.slice(-12) : 'unknown',
            })
          }
          break
        }

        if (session.mode === 'subscription' && session.status === 'complete') {
          const subRef = session.subscription
          const subId = typeof subRef === 'string' ? subRef : subRef?.id
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId)
            await upsertBillingAccountFromSubscription(sub)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await upsertBillingAccountFromSubscription(sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await revokeBillingSubscription(sub.id)
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null
        }
        const subRef = inv.subscription
        const subId = typeof subRef === 'string' ? subRef : subRef?.id
        if (subId) {
          await touchPaymentFailed(subId)
          const sub = await stripe.subscriptions.retrieve(subId)
          await upsertBillingAccountFromSubscription(sub)
        }
        break
      }

      default:
        break
    }
  } catch (e) {
    logServerError('[webhook/stripe] handler', e)
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
