import { prisma } from '@/lib/prisma'
import { subscriptionGrantsMonthlyPro } from '@/lib/billing/subscriptionAccess'

export type ReportsLibraryMode = 'monthly_pro' | 'pro_only' | 'none'

export async function resolveReportsLibraryMode(stripeCustomerId: string): Promise<ReportsLibraryMode> {
  const cid = stripeCustomerId.trim()
  if (!cid.startsWith('cus_')) return 'none'

  const acct = await prisma.billingAccount.findUnique({
    where: { stripeCustomerId: cid },
    select: { subscriptionStatus: true },
  })
  if (acct && subscriptionGrantsMonthlyPro(acct.subscriptionStatus)) return 'monthly_pro'

  const [unlockRows, proSaves] = await Promise.all([
    prisma.proReportUnlock.count({ where: { stripeCustomerId: cid } }),
    prisma.savedReport.count({ where: { stripeCustomerId: cid, tier: 'pro_report' } }),
  ])

  if (unlockRows > 0 || proSaves > 0) return 'pro_only'

  return 'none'
}

export async function isMonthlyProCustomer(stripeCustomerId: string): Promise<boolean> {
  const cid = stripeCustomerId.trim()
  if (!cid.startsWith('cus_')) return false
  const acct = await prisma.billingAccount.findUnique({
    where: { stripeCustomerId: cid },
    select: { subscriptionStatus: true },
  })
  return !!(acct && subscriptionGrantsMonthlyPro(acct.subscriptionStatus))
}

export async function userCanViewSavedReport(params: {
  stripeCustomerId: string
  analysisId: string
}): Promise<boolean> {
  const cid = params.stripeCustomerId.trim()
  if (!cid.startsWith('cus_')) return false

  const row = await prisma.savedReport.findUnique({
    where: { analysisId: params.analysisId },
    select: { stripeCustomerId: true, tier: true },
  })
  if (!row || row.stripeCustomerId !== cid) return false

  const monthly = await isMonthlyProCustomer(cid)
  if (monthly) return true

  return row.tier === 'pro_report'
}

export async function userCanDeleteSavedReport(params: {
  stripeCustomerId: string
  analysisId: string
}): Promise<boolean> {
  return userCanViewSavedReport(params)
}
