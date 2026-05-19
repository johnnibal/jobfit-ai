export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { requirePremiumAccess } from '@/lib/billing/requirePremiumAccess.server'
import { prisma } from '@/lib/prisma'
import { logServerError } from '@/lib/logging/safeLog.server'

export async function GET(req: Request, ctx: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await ctx.params
  if (!analysisId || !isAnalysisSessionId(analysisId)) {
    return NextResponse.json({ error: 'Invalid analysis id.' }, { status: 400 })
  }

  try {
    const access = await requirePremiumAccess({
      request: req,
      analysisId,
      feature: 'saved_report_get',
      mode: 'saved_report_row',
    })
    if (!access.allowed) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const report = await prisma.savedReport.findUnique({
      where: { analysisId },
      select: {
        analysisId: true,
        cvText: true,
        jdText: true,
        resultText: true,
        jobTitle: true,
        companyName: true,
        fitScore: true,
        tier: true,
        createdAt: true,
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    return NextResponse.json({
      report: {
        ...report,
        createdAt: report.createdAt.toISOString(),
        statusLabel: report.tier === 'monthly_pro' ? 'Monthly Pro' : 'Pro Report',
      },
    })
  } catch (e) {
    logServerError('[reports/analysisId GET]', e)
    return NextResponse.json({ error: 'Could not load report.' }, { status: 503 })
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await ctx.params
  if (!analysisId || !isAnalysisSessionId(analysisId)) {
    return NextResponse.json({ error: 'Invalid analysis id.' }, { status: 400 })
  }

  try {
    const access = await requirePremiumAccess({
      request: req,
      analysisId,
      feature: 'saved_report_delete',
      mode: 'saved_report_row',
    })
    if (!access.allowed) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const row = await prisma.savedReport.findUnique({
      where: { analysisId },
      select: { stripeCustomerId: true },
    })
    if (!row) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    await prisma.savedReport.deleteMany({
      where: { analysisId, stripeCustomerId: row.stripeCustomerId },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    logServerError('[reports/analysisId DELETE]', e)
    return NextResponse.json({ error: 'Could not delete report.' }, { status: 503 })
  }
}
