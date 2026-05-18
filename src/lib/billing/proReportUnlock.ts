import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function normalizeCustomerId(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  return t.startsWith('cus_') ? t : null
}

export async function persistProReportUnlockInTransaction(
  tx: Prisma.TransactionClient,
  analysisId: string,
  stripeCheckoutSessionId: string,
  stripeCustomerId?: string | null
): Promise<void> {
  const cid = normalizeCustomerId(stripeCustomerId ?? undefined)

  await tx.proReportUnlock.upsert({
    where: { analysisId },
    create: {
      analysisId,
      stripeCheckoutSessionId,
      stripeCustomerId: cid,
    },
    update: {
      stripeCheckoutSessionId,
      ...(cid ? { stripeCustomerId: cid } : {}),
    },
  })
}

export async function persistProReportUnlock(
  analysisId: string,
  stripeCheckoutSessionId: string,
  stripeCustomerId?: string | null
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await persistProReportUnlockInTransaction(tx, analysisId, stripeCheckoutSessionId, stripeCustomerId)
  })
}

/** Attach Stripe customer to an unlock row (e.g. first saved report sync). */
export async function attachStripeCustomerToProUnlock(analysisId: string, stripeCustomerId: string): Promise<void> {
  const cid = normalizeCustomerId(stripeCustomerId)
  if (!cid) return

  await prisma.proReportUnlock.updateMany({
    where: { analysisId },
    data: { stripeCustomerId: cid },
  })
}

export async function isAnalysisUnlocked(analysisId: string): Promise<boolean> {
  const row = await prisma.proReportUnlock.findUnique({
    where: { analysisId },
    select: { id: true },
  })
  return !!row
}
