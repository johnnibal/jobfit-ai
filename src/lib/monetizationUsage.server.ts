import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { subscriptionGrantsMonthlyPro } from '@/lib/billing/subscriptionAccess'
import { FREE_ANALYSES_PER_DAY, MONTHLY_PRO_ANALYSES_PER_MONTH } from '@/lib/planTypes'

export type UsageSubject =
  | { kind: 'anonymous'; anonymousSessionId: string }
  | { kind: 'stripe'; stripeCustomerId: string }
  | { kind: 'user'; userId: string }

export class JobFitQuotaExceededError extends Error {
  readonly code = 'QUOTA_EXCEEDED' as const
  constructor(
    readonly mode: 'daily' | 'monthly',
    readonly limit: number,
    readonly used: number
  ) {
    super('Analysis quota exceeded.')
    this.name = 'JobFitQuotaExceededError'
  }
}

export function usageLimitsDisabled(): boolean {
  const v = process.env.JOBFIT_SKIP_USAGE_LIMITS
  return v === '1' || v?.toLowerCase() === 'true'
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function utcMonthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7)
}

function subjectWhere(subject: UsageSubject): Prisma.AnalysisUsageWhereUniqueInput {
  switch (subject.kind) {
    case 'anonymous':
      return { anonymousSessionId: subject.anonymousSessionId }
    case 'stripe':
      return { stripeCustomerId: subject.stripeCustomerId }
    case 'user':
      return { userId: subject.userId }
  }
}

function uncheckedCreate(subject: UsageSubject): Prisma.AnalysisUsageUncheckedCreateInput {
  const now = new Date()
  const base = {
    dailyBucketUtc: utcDayKey(now),
    dailyCount: 0,
    monthlyBucketUtc: utcMonthKey(now),
    monthlyCount: 0,
  }
  switch (subject.kind) {
    case 'anonymous':
      return { ...base, anonymousSessionId: subject.anonymousSessionId }
    case 'stripe':
      return { ...base, stripeCustomerId: subject.stripeCustomerId }
    case 'user':
      return { ...base, userId: subject.userId }
  }
}

export async function verifyMonthlyProStripeCustomer(stripeCustomerId: string): Promise<boolean> {
  const trimmed = stripeCustomerId.trim()
  if (!trimmed.startsWith('cus_')) return false
  const row = await prisma.billingAccount.findUnique({
    where: { stripeCustomerId: trimmed },
    select: { subscriptionStatus: true },
  })
  return !!row && subscriptionGrantsMonthlyPro(row.subscriptionStatus)
}

export async function resolveAnalysisQuotaSubject(params: {
  /** From HttpOnly signed billing cookie only — never from request body or query. */
  monthlyStripeCustomerFromBillingCookie: string | null | undefined
  anonymousSessionId: string
  authenticatedUserId: string | null
}): Promise<{ subject: UsageSubject; mode: 'daily' | 'monthly'; monthlyProVerified: boolean }> {
  const cid =
    typeof params.monthlyStripeCustomerFromBillingCookie === 'string' &&
    params.monthlyStripeCustomerFromBillingCookie.startsWith('cus_')
      ? params.monthlyStripeCustomerFromBillingCookie.trim()
      : null

  let monthlyProVerified = false
  if (cid && isDatabaseConfigured()) {
    monthlyProVerified = await verifyMonthlyProStripeCustomer(cid)
    if (monthlyProVerified) {
      return {
        subject: { kind: 'stripe', stripeCustomerId: cid },
        mode: 'monthly',
        monthlyProVerified: true,
      }
    }
  }

  if (params.authenticatedUserId) {
    return {
      subject: { kind: 'user', userId: params.authenticatedUserId },
      mode: 'daily',
      monthlyProVerified: false,
    }
  }

  return {
    subject: { kind: 'anonymous', anonymousSessionId: params.anonymousSessionId },
    mode: 'daily',
    monthlyProVerified: false,
  }
}

export async function loadUsageRow(subject: UsageSubject) {
  return prisma.analysisUsage.findUnique({ where: subjectWhere(subject) })
}

export function countsForMode(
  row: { dailyBucketUtc: string; dailyCount: number; monthlyBucketUtc: string; monthlyCount: number } | null,
  mode: 'daily' | 'monthly'
): { usedInPeriod: number; limit: number } {
  const day = utcDayKey()
  const month = utcMonthKey()
  if (mode === 'monthly') {
    const used = row && row.monthlyBucketUtc === month ? row.monthlyCount : 0
    return { usedInPeriod: used, limit: MONTHLY_PRO_ANALYSES_PER_MONTH }
  }
  const used = row && row.dailyBucketUtc === day ? row.dailyCount : 0
  return { usedInPeriod: used, limit: FREE_ANALYSES_PER_DAY }
}

/**
 * Atomically consumes one analysis slot. Call before invoking the AI; call {@link decrementAnalysisUsage}
 * if the AI request fails after this succeeds.
 */
export async function incrementAnalysisUsage(subject: UsageSubject, mode: 'daily' | 'monthly'): Promise<void> {
  if (!isDatabaseConfigured()) {
    if (usageLimitsDisabled()) return
    throw new Error('DATABASE_URL is not configured.')
  }
  await prisma.$transaction(
    async (tx) => {
      const where = subjectWhere(subject)
      let row = await tx.analysisUsage.findUnique({ where })

      const day = utcDayKey()
      const month = utcMonthKey()

      if (!row) {
        row = await tx.analysisUsage.create({ data: uncheckedCreate(subject) })
      }

      let dailyCount = row.dailyBucketUtc === day ? row.dailyCount : 0
      let monthlyCount = row.monthlyBucketUtc === month ? row.monthlyCount : 0

      if (mode === 'monthly') {
        if (monthlyCount >= MONTHLY_PRO_ANALYSES_PER_MONTH) {
          throw new JobFitQuotaExceededError('monthly', MONTHLY_PRO_ANALYSES_PER_MONTH, monthlyCount)
        }
        monthlyCount += 1
        await tx.analysisUsage.update({
          where,
          data: {
            monthlyBucketUtc: month,
            monthlyCount,
            dailyBucketUtc: day,
            dailyCount: row.dailyBucketUtc === day ? row.dailyCount : 0,
          },
        })
        return
      }

      if (dailyCount >= FREE_ANALYSES_PER_DAY) {
        throw new JobFitQuotaExceededError('daily', FREE_ANALYSES_PER_DAY, dailyCount)
      }
      dailyCount += 1
      await tx.analysisUsage.update({
        where,
        data: {
          dailyBucketUtc: day,
          dailyCount,
          monthlyBucketUtc: month,
          monthlyCount: row.monthlyBucketUtc === month ? row.monthlyCount : 0,
        },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}

/** Undo {@link incrementAnalysisUsage} when the AI pipeline fails after quota was consumed. */
export async function decrementAnalysisUsage(subject: UsageSubject, mode: 'daily' | 'monthly'): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const where = subjectWhere(subject)
    const row = await tx.analysisUsage.findUnique({ where })
    if (!row) return

    const day = utcDayKey()
    const month = utcMonthKey()

    if (mode === 'monthly') {
      if (row.monthlyBucketUtc !== month || row.monthlyCount <= 0) return
      await tx.analysisUsage.update({
        where,
        data: { monthlyCount: { decrement: 1 } },
      })
      return
    }

    if (row.dailyBucketUtc !== day || row.dailyCount <= 0) return
    await tx.analysisUsage.update({
      where,
      data: { dailyCount: { decrement: 1 } },
    })
  })
}
