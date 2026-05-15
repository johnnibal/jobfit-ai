import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { attachStripeCustomerToProUnlock } from '@/lib/billing/proReportUnlock'

function normalizeCustomerId(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  return t.startsWith('cus_') ? t : null
}

async function customerIdFromStripeCheckoutSession(checkoutSessionId: string): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null
  try {
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId)
    const raw =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer &&
            typeof session.customer === 'object' &&
            session.customer !== null &&
            'id' in session.customer
          ? String((session.customer as { id: string }).id)
          : ''
    return raw.startsWith('cus_') ? raw : null
  } catch {
    return null
  }
}

/**
 * Stripe customer id that owns a Pro Report unlock row (for SavedReport FK / ownership).
 * Hydrates from Stripe Checkout when the DB field is still null.
 */
export async function resolveProUnlockOwnerStripeCustomerId(analysisId: string): Promise<string | null> {
  const row = await prisma.proReportUnlock.findUnique({
    where: { analysisId },
    select: { stripeCustomerId: true, stripeCheckoutSessionId: true },
  })
  if (!row) return null

  const direct = normalizeCustomerId(row.stripeCustomerId)
  if (direct) return direct

  const fromSession = await customerIdFromStripeCheckoutSession(row.stripeCheckoutSessionId)
  if (fromSession) {
    await attachStripeCustomerToProUnlock(analysisId, fromSession).catch(() => {})
    return fromSession
  }
  return null
}
