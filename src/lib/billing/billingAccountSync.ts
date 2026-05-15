import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

function readSubscriptionPeriod(subscription: Stripe.Subscription): {
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
} {
  const raw = subscription as unknown as {
    current_period_end?: number
    cancel_at_period_end?: boolean
  }
  const cpe =
    typeof raw.current_period_end === 'number' ? new Date(raw.current_period_end * 1000) : null
  return {
    currentPeriodEnd: cpe,
    cancelAtPeriodEnd: Boolean(raw.cancel_at_period_end),
  }
}

export async function upsertBillingAccountFromSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? ''

  if (!customerId) {
    console.warn('[billing] Subscription missing customer id', subscription.id)
    return
  }

  let email: string | null = null
  const cust = subscription.customer
  if (cust && typeof cust === 'object' && !('deleted' in cust && cust.deleted)) {
    email = 'email' in cust && typeof cust.email === 'string' ? cust.email : null
  }

  const { currentPeriodEnd, cancelAtPeriodEnd } = readSubscriptionPeriod(subscription)

  await prisma.billingAccount.upsert({
    where: { stripeCustomerId: customerId },
    create: {
      stripeCustomerId: customerId,
      email,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    },
    update: {
      email,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    },
  })
}

/** Subscription removed — revoke Monthly Pro access in our DB. */
export async function revokeBillingSubscription(subscriptionId: string): Promise<void> {
  await prisma.billingAccount.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  })
}

export async function touchPaymentFailed(subscriptionId: string): Promise<void> {
  await prisma.billingAccount.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { lastPaymentFailedAt: new Date() },
  })
}
