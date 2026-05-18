import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { classifyProReportCreditAnonymousBind } from '@/lib/billing/proReportPendingCreditBind.logic'
import { persistProReportUnlockInTransaction } from '@/lib/billing/proReportUnlock'

export type PendingCreditBindFailureCode =
  | 'ALREADY_CONSUMED'
  | 'ANONYMOUS_SESSION_MISMATCH'
  | 'BIND_RACE_RETRY'
  | 'PRISMA_ERROR'

export type PendingCreditEnsureResult =
  | { ok: true; creditId: string }
  | { ok: false; code: PendingCreditBindFailureCode; logDetail: string }

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
 * Called right after Stripe Checkout.Session is created for **credit** purchases.
 * Pins this payment session’s pending row to the same anonymous usage id the browser carries,
 * **before** the user completes payment — prevents confirm-session minting another UUID or racing binds.
 */
export async function prebindProReportPendingCreditRowAtCheckout(params: {
  stripeCheckoutSessionId: string
  anonymousSessionId: string
}): Promise<void> {
  await prisma.proReportPendingCredit.upsert({
    where: { stripeCheckoutSessionId: params.stripeCheckoutSessionId.trim() },
    create: {
      stripeCheckoutSessionId: params.stripeCheckoutSessionId.trim(),
      stripeCustomerId: null,
      anonymousSessionId: params.anonymousSessionId.trim(),
    },
    update: {
      anonymousSessionId: params.anonymousSessionId.trim(),
    },
  })
}

/**
 * Browser confirmation: ensures DB row exists, binds prepaid credit to purchaser anonymous session once,
 * returns internal credit id for the signed cookie.
 */
export async function ensurePendingCreditBoundToAnonymousSession(params: {
  session: Stripe.Checkout.Session
  anonymousSessionId: string
}): Promise<PendingCreditEnsureResult> {
  const stripeSessionTail =
    typeof params.session.id === 'string' ? params.session.id.trim().slice(0, 12) + '…' : 'unknown'

  try {
    return await prisma.$transaction(async (tx) => {
      const cid = checkoutSessionStripeCustomer(params.session)
      const sessionId = params.session.id
      let row = await tx.proReportPendingCredit.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
      })

      if (!row) {
        row = await tx.proReportPendingCredit.create({
          data: {
            stripeCheckoutSessionId: sessionId,
            stripeCustomerId: cid,
          },
        })
      } else if (cid && row.stripeCustomerId !== cid) {
        row = await tx.proReportPendingCredit.update({
          where: { id: row.id },
          data: { stripeCustomerId: cid },
        })
      }

      const cls = classifyProReportCreditAnonymousBind({
        consumedAt: row.consumedAt,
        storedAnonymousSessionId: row.anonymousSessionId,
        requestedAnonymousSessionId: params.anonymousSessionId,
      })

      if (cls === 'already_consumed') {
        console.warn('[pro-report-credit] confirm on consumed row', { stripeSessionTail })
        return {
          ok: false,
          code: 'ALREADY_CONSUMED',
          logDetail: 'pending_credit_row_already_consumed',
        }
      }

      if (cls === 'anonymous_session_mismatch') {
        console.warn('[pro-report-credit] anonymous session mismatch', {
          stripeSessionTail,
          storedAnonTail:
            typeof row.anonymousSessionId === 'string' ? row.anonymousSessionId.trim().slice(-8) : 'none',
          requestAnonTail: params.anonymousSessionId.trim().slice(-8),
        })
        return {
          ok: false,
          code: 'ANONYMOUS_SESSION_MISMATCH',
          logDetail: 'anonymous_session_mismatch_vs_pending_row',
        }
      }

      if (cls === 'already_bound_ok') {
        return { ok: true, creditId: row.id }
      }

      /** `needs_anonymous_bind` — row exists but anon not yet persisted (legacy or rare race vs webhook). */

      const updated = await tx.proReportPendingCredit.updateMany({
        where: {
          id: row.id,
          consumedAt: null,
          anonymousSessionId: null,
        },
        data: { anonymousSessionId: params.anonymousSessionId.trim() },
      })

      if (updated.count === 1) {
        return { ok: true, creditId: row.id }
      }

      const refreshed = await tx.proReportPendingCredit.findUnique({
        where: { id: row.id },
      })
      if (!refreshed) {
        return {
          ok: false,
          code: 'BIND_RACE_RETRY',
          logDetail: 'pending_credit_row_missing_after_conditional_bind',
        }
      }

      const clsAfter = classifyProReportCreditAnonymousBind({
        consumedAt: refreshed.consumedAt,
        storedAnonymousSessionId: refreshed.anonymousSessionId,
        requestedAnonymousSessionId: params.anonymousSessionId,
      })

      if (clsAfter === 'already_bound_ok') {
        console.info('[pro-report-credit] bind race resolved OK', {
          stripeSessionTail,
          requestAnonTail: params.anonymousSessionId.trim().slice(-8),
        })
        return { ok: true, creditId: refreshed.id }
      }

      if (clsAfter === 'already_consumed') {
        return {
          ok: false,
          code: 'ALREADY_CONSUMED',
          logDetail: 'consumed_between_bind_attempt_and_refresh',
        }
      }

      if (clsAfter === 'anonymous_session_mismatch') {
        console.warn('[pro-report-credit] bind race surfaced mismatch', {
          stripeSessionTail,
          storedAnonTail:
            typeof refreshed.anonymousSessionId === 'string'
              ? refreshed.anonymousSessionId.trim().slice(-8)
              : 'none',
          requestAnonTail: params.anonymousSessionId.trim().slice(-8),
        })
        return {
          ok: false,
          code: 'ANONYMOUS_SESSION_MISMATCH',
          logDetail: 'anonymous_session_mismatch_after_concurrent_bind',
        }
      }

      return {
        ok: false,
        code: 'BIND_RACE_RETRY',
        logDetail: 'anonymous_bind_inconclusive_retry_confirm',
      }
    })
  } catch (e) {
    console.error('[pro-report-credit] ensure/bind', e instanceof Error ? e.message : 'unknown')
    return {
      ok: false,
      code: 'PRISMA_ERROR',
      logDetail: e instanceof Error ? e.message.slice(0, 200) : 'unknown_error',
    }
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
