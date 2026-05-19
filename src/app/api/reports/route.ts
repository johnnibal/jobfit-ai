export const runtime = 'nodejs'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { resolveProUnlockOwnerStripeCustomerId } from '@/lib/billing/proUnlockOwner.server'
import { JOBFIT_MONTHLY_PRO_COOKIE, verifyMonthlyProEntitlementCookie } from '@/lib/billing/signedPremiumCookie'
import { buildBillingSessionPayload } from '@/lib/billing/billingSessionPayload.server'
import { requirePremiumAccess } from '@/lib/billing/requirePremiumAccess.server'
import { prisma } from '@/lib/prisma'
import { extractFitScore, guessJobPostingMeta } from '@/lib/reports/extractReportMeta'
import { isMonthlyProCustomer } from '@/lib/reports/reportAccess.server'
import { ERR_DATABASE_NOT_CONFIGURED } from '@/lib/api/publicErrors'
import { logServerError } from '@/lib/logging/safeLog.server'

const MIN_CHARS = 50

export async function GET(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: ERR_DATABASE_NOT_CONFIGURED }, { status: 503 })
  }

  try {
    const library = await requirePremiumAccess({
      request: req,
      feature: 'reports_library',
      mode: 'reports_library',
    })
    if (!library.allowed) {
      return NextResponse.json({ error: 'Saved reports require Monthly Pro or a Pro Report purchase.' }, { status: 403 })
    }

    const jar = await cookies()
    const getCookie = (n: string) => jar.get(n)
    const payload = await buildBillingSessionPayload(getCookie)

    if (library.plan === 'monthly_pro' && payload.monthlyProActive) {
      const monthlyCus = verifyMonthlyProEntitlementCookie(getCookie(JOBFIT_MONTHLY_PRO_COOKIE)?.value)
      if (!monthlyCus || !(await isMonthlyProCustomer(monthlyCus))) {
        return NextResponse.json({ error: 'Saved reports require Monthly Pro or a Pro Report purchase.' }, { status: 403 })
      }
      const rows = await prisma.savedReport.findMany({
        where: { stripeCustomerId: monthlyCus },
        orderBy: { createdAt: 'desc' },
        select: {
          analysisId: true,
          jobTitle: true,
          companyName: true,
          fitScore: true,
          tier: true,
          createdAt: true,
        },
      })
      const reports = rows.map((r) => ({
        analysisId: r.analysisId,
        jobTitle: r.jobTitle,
        companyName: r.companyName,
        fitScore: r.fitScore,
        tier: r.tier,
        createdAt: r.createdAt.toISOString(),
        statusLabel: r.tier === 'monthly_pro' ? 'Monthly Pro' : 'Pro Report',
      }))
      return NextResponse.json({ mode: 'monthly_pro' as const, reports })
    }

    const aids = payload.proReportGrantedAnalysisIds
    if (!aids.length) {
      return NextResponse.json({ error: 'Saved reports require Monthly Pro or a Pro Report purchase.' }, { status: 403 })
    }

    const rows = await prisma.savedReport.findMany({
      where: { analysisId: { in: aids }, tier: 'pro_report' },
      orderBy: { createdAt: 'desc' },
      select: {
        analysisId: true,
        jobTitle: true,
        companyName: true,
        fitScore: true,
        tier: true,
        createdAt: true,
      },
    })

    const reports = rows.map((r) => ({
      analysisId: r.analysisId,
      jobTitle: r.jobTitle,
      companyName: r.companyName,
      fitScore: r.fitScore,
      tier: r.tier,
      createdAt: r.createdAt.toISOString(),
      statusLabel: 'Pro Report',
    }))
    return NextResponse.json({ mode: 'pro_only' as const, reports })
  } catch (e) {
    logServerError('[reports GET]', e)
    return NextResponse.json({ error: 'Could not load reports.' }, { status: 503 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: ERR_DATABASE_NOT_CONFIGURED }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const rec = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}

  const analysisId = typeof rec.analysisId === 'string' ? rec.analysisId.trim() : ''
  const cv = typeof rec.cv === 'string' ? rec.cv.trim() : ''
  const jd = typeof rec.jd === 'string' ? rec.jd.trim() : ''
  const resultText = typeof rec.resultText === 'string' ? rec.resultText.trim() : ''

  if (!analysisId || !isAnalysisSessionId(analysisId)) {
    return NextResponse.json({ error: 'Valid analysisId is required.' }, { status: 400 })
  }

  if (cv.length < MIN_CHARS || !/[a-zA-ZÄÖÜäöüß]/.test(cv)) {
    return NextResponse.json({ error: 'CV text is too short or invalid.' }, { status: 400 })
  }

  if (jd.length < MIN_CHARS || !/[a-zA-ZÄÖÜäöüß]/.test(jd)) {
    return NextResponse.json({ error: 'Job description is too short or invalid.' }, { status: 400 })
  }

  if (resultText.length < MIN_CHARS) {
    return NextResponse.json({ error: 'Analysis result is too short.' }, { status: 400 })
  }

  const jar = await cookies()
  const getCookie = (n: string) => jar.get(n)

  try {
    const access = await requirePremiumAccess({
      request: req,
      analysisId,
      feature: 'save_report',
      mode: 'per_analysis',
    })
    if (!access.allowed) {
      return NextResponse.json(
        { error: 'Saving requires Monthly Pro or a paid Pro Report unlock for this analysis.' },
        { status: 403 }
      )
    }

    let stripeCustomerId: string
    let tier: 'monthly_pro' | 'pro_report'

    if (access.plan === 'monthly_pro') {
      const monthlyCus = verifyMonthlyProEntitlementCookie(getCookie(JOBFIT_MONTHLY_PRO_COOKIE)?.value)
      if (!monthlyCus || !(await isMonthlyProCustomer(monthlyCus))) {
        return NextResponse.json(
          { error: 'Saving requires Monthly Pro or a paid Pro Report unlock for this analysis.' },
          { status: 403 }
        )
      }
      stripeCustomerId = monthlyCus
      tier = 'monthly_pro'
    } else {
      const unlock = await prisma.proReportUnlock.findUnique({
        where: { analysisId },
        select: { stripeCustomerId: true },
      })
      if (!unlock) {
        return NextResponse.json(
          { error: 'Saving requires Monthly Pro or a paid Pro Report unlock for this analysis.' },
          { status: 403 }
        )
      }

      const owner = await resolveProUnlockOwnerStripeCustomerId(analysisId)
      if (!owner) {
        return NextResponse.json({ error: 'Could not resolve report owner for this unlock.' }, { status: 503 })
      }

      if (unlock.stripeCustomerId && unlock.stripeCustomerId !== owner) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
      }

      stripeCustomerId = owner
      tier = 'pro_report'
    }

    const existing = await prisma.savedReport.findUnique({
      where: { analysisId },
      select: { stripeCustomerId: true },
    })
    if (existing && existing.stripeCustomerId !== stripeCustomerId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { jobTitle, companyName } = guessJobPostingMeta(jd)
    const fitScore = extractFitScore(resultText)

    await prisma.savedReport.upsert({
      where: { analysisId },
      create: {
        analysisId,
        stripeCustomerId,
        cvText: cv,
        jdText: jd,
        resultText,
        jobTitle,
        companyName,
        fitScore,
        tier,
      },
      update: {
        stripeCustomerId,
        cvText: cv,
        jdText: jd,
        resultText,
        jobTitle,
        companyName,
        fitScore,
        tier,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    logServerError('[reports POST]', e)
    return NextResponse.json({ error: 'Could not save report.' }, { status: 500 })
  }
}
