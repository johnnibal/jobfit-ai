import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { persistProReportUnlockInTransaction } from '@/lib/billing/proReportUnlock'

function checkoutSessionStripeCustomer(session: Stripe.Checkout.Session): string | null {
  const c = session.customer
  if (typeof c === 'string' && c.startsWith('cus_')) return c.trim()
  if (c && typeof c === 'object' && 'id' in c) {
    const id = String((c as { id: string }).id)
    return id.startsWith('cus_') ? id.trim() : null
  }
  return null
}

/** Webhook-safe idempotent pending row creation. */
export async function upsertProReportPendingCreditFromPaidSession(session: Stripe.Checkout.Session): Promise<void> {
  const cid = checkoutSessionStripeCustomer(session)
  await prisma.proReportPendingCredit.upsert({
    where: { stripeCheckoutSessionId: session.id },
    create: {
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: cid,
    },
    update: cid ? { stripeCustomerId: cid } : {},
  })
}

/**
 * Browser confirmation: ensures DB row exists, binds pending credit to purchaser anonymous session once,
 * returns internal credit id for the signed cookie.
 */
export async function ensurePendingCreditBoundToAnonymousSession(params: {
  session: Stripe.Checkout.Session
  anonymousSessionId: string
}): Promise<{ creditId: string } | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      const cid = checkoutSessionStripeCustomer(params.session)

      const row = await tx.proReportPendingCredit.upsert({
        where: { stripeCheckoutSessionId: params.session.id },
        create: {
          stripeCheckoutSessionId: params.session.id,
          stripeCustomerId: cid,
        },
        update: cid ? { stripeCustomerId: cid } : {},
      })

      if (row.consumedAt) {
        console.warn('[pro-report-credit] confirm on already consumed row', {
          stripeSessionTail: params.session.id.slice(-10),
        })
        return null
      }

      if (row.anonymousSessionId && row.anonymousSessionId !== params.anonymousSessionId) {
        console.warn('[pro-report-credit] anonymous session mismatch during bind', {
          stripeSessionTail: params.session.id.slice(-10),
        })
        return null
      }

      if (!row.anonymousSessionId) {
        await tx.proReportPendingCredit.update({
          where: { id: row.id },
          data: { anonymousSessionId: params.anonymousSessionId },
        })
      }

      return { creditId: row.id }
    })
  } catch (e) {
    console.error('[pro-report-credit] ensure/bind', e instanceof Error ? e.message : 'unknown')
    return null
  }
}

export async function loadConsumableProReportPendingCredit(params: {
  creditIdFromCookie: string
  anonymousSessionId: string
}) {
  return prisma.proReportPendingCredit.findFirst({
    where: {
      id: params.creditIdFromCookie,
      consumedAt: null,
      anonymousSessionId: params.anonymousSessionId,
    },
  })
}

export async function consumePendingProReportCreditAndUnlock(params: {
  creditRowId: string
  anonymousSessionId: string
  analysisId: string
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const row = await tx.proReportPendingCredit.findFirst({
      where: {
        id: params.creditRowId,
        consumedAt: null,
        anonymousSessionId: params.anonymousSessionId,
      },
    })
    if (!row) {
      throw new Error('consumable_credit_not_found')
    }

    const consumed = await tx.proReportPendingCredit.updateMany({
      where: { id: row.id, consumedAt: null },
      data: {
        consumedAt: new Date(),
        consumedAnalysisId: params.analysisId,
      },
    })
    if (consumed.count !== 1) {
      throw new Error('credit_consume_race')
    }

    await persistProReportUnlockInTransaction(
      tx,
      params.analysisId,
      row.stripeCheckoutSessionId,
      row.stripeCustomerId
    )
  })
}
