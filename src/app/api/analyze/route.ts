export const runtime = 'nodejs'

import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getAuthenticatedJobFitUserId } from '@/lib/auth/authenticatedUser'
import {
  attachProReportEntitlementTokenCookie,
  clearProReportPendingCreditCookie,
} from '@/lib/billing/applyPremiumCookies'
import {
  JOBFIT_PRO_REPORT_PENDING_CREDIT_COOKIE,
  parseVerifiedProReportPendingCreditId,
} from '@/lib/billing/proReportCreditCookie.server'
import {
  consumePendingProReportCreditAndUnlock,
  loadConsumableProReportPendingCredit,
} from '@/lib/billing/proReportPendingCredit.server'
import { JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE } from '@/lib/billing/proReportEntitlementToken.server'
import {
  JOBFIT_MONTHLY_PRO_COOKIE,
  verifyMonthlyProEntitlementCookie,
} from '@/lib/billing/signedPremiumCookie'
import {
  decrementAnalysisUsage,
  incrementAnalysisUsage,
  JobFitQuotaExceededError,
  resolveAnalysisQuotaSubject,
  usageLimitsDisabled,
} from '@/lib/monetizationUsage.server'
import {
  JOBFIT_ANON_COOKIE,
  mintAnonymousSessionId,
  signAnonymousSessionId,
  verifyAnonymousCookie,
} from '@/lib/usage/anonymousCookie'
import { applyAnonymousSessionCookie } from '@/lib/usage/applyAnonymousSessionCookie'
import { getOpenRouterApiKey } from '@/lib/openrouter/getOpenRouterApiKey'

function buildAnalysisPrompt(cv: string, jd: string) {
  return `
You are JobFit.AI, an expert resume-to-job matching assistant.

Your job is to compare a candidate CV against a job description and produce a practical, evidence-based evaluation.

Rules:
- Be honest, specific, and strict.
- Only use information that appears in the CV or the job description.
- Do not invent achievements, skills, years of experience, certifications, or tools.
- If the job description is weak, vague, spammy, incomplete, or not a real role, say so clearly.
- Treat missing evidence as missing, not as implied experience.
- Prefer concise bullet points over long paragraphs.
- The score must reflect factual alignment only, not encouragement or optimism.

Scoring guidance:
- 85-100: Strong fit with most core requirements clearly supported by the CV
- 70-84: Good fit with some notable gaps or unclear evidence
- 50-69: Partial fit with several missing core requirements
- 0-49: Weak fit or poor/invalid job description

Return your answer in exactly this format:

Match Score: <number>/100

Verdict:
<1-2 sentences explaining the overall fit>

Strong Matches:
- <bullet>
- <bullet>
- <bullet>

Gaps / Risks:
- <bullet>
- <bullet>
- <bullet>

Recommended Resume Improvements:
- <bullet>
- <bullet>
- <bullet>

Interview Readiness:
- <1 short paragraph on what the candidate can confidently claim and what needs caution>

Reality Check:
<1 short, encouraging but realistic paragraph>

ATS Keyword Checklist:
- <keyword or phrase from the job description>: <Present | Partial | Missing> — <one short evidence-based note tied to the CV>
- <keyword or phrase>: <Present | Partial | Missing> — <note>
- Provide at least 5 checklist lines whenever the job description contains enough concrete requirements; otherwise provide only grounded items.

Important:
- If there are fewer than 3 good items for a section, provide only the valid ones.
- If the CV or job description is too weak to assess properly, say that explicitly and lower the score accordingly.
- Do not include markdown bold markers or extra sections.

CV:
${cv}

JOB DESCRIPTION:
${jd}
  `.trim()
}

export async function POST(req: Request) {
  const jar = await cookies()
  const anonVerified = verifyAnonymousCookie(jar.get(JOBFIT_ANON_COOKIE)?.value)
  let signedAnon: string | null = null
  const anonymousSessionId = anonVerified ?? mintAnonymousSessionId()
  if (!anonVerified) {
    signedAnon = signAnonymousSessionId(anonymousSessionId)
  }

  const respond = (payload: unknown, status: number) => {
    const res = NextResponse.json(payload, { status })
    applyAnonymousSessionCookie(res, signedAnon)
    return res
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return respond({ error: 'Invalid JSON body.' }, 400)
  }

  const rec = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const cvRaw = rec.cv
  const jdRaw = rec.jd

  const normalizedCv = typeof cvRaw === 'string' ? cvRaw.trim() : ''
  const normalizedJd = typeof jdRaw === 'string' ? jdRaw.trim() : ''

  const monthlyStripeCustomerFromBillingCookie = verifyMonthlyProEntitlementCookie(
    jar.get(JOBFIT_MONTHLY_PRO_COOKIE)?.value
  )

  const apiKey = getOpenRouterApiKey()

  if (normalizedCv.length < 50 || !/[a-zA-Z]/.test(normalizedCv)) {
    return respond({ message: 'Please provide a valid CV or resume text.' }, 400)
  }

  if (normalizedJd.length < 50 || !/[a-zA-Z]/.test(normalizedJd)) {
    return respond({ message: 'Please provide a valid job description.' }, 400)
  }

  if (!apiKey) {
    return respond({ error: 'OPENROUTER_API_KEY (or OPENAI_API_KEY) is not configured on the server.' }, 500)
  }

  const authenticatedUserId = await getAuthenticatedJobFitUserId()

  let subject
  let mode: 'daily' | 'monthly'

  try {
    const resolved = await resolveAnalysisQuotaSubject({
      monthlyStripeCustomerFromBillingCookie,
      anonymousSessionId,
      authenticatedUserId,
    })
    subject = resolved.subject
    mode = resolved.mode
  } catch (e) {
    console.error('[analyze] resolve quota subject', e)
    return respond({ error: 'Could not resolve usage quota.' }, 503)
  }

  let quotaConsumed = false
  let prepaidCreditRowId: string | null = null

  if (!usageLimitsDisabled()) {
    try {
      await incrementAnalysisUsage(subject, mode)
      quotaConsumed = true
    } catch (e) {
      if (e instanceof JobFitQuotaExceededError) {
        const creditCookieRaw = jar.get(JOBFIT_PRO_REPORT_PENDING_CREDIT_COOKIE)?.value
        const creditId = parseVerifiedProReportPendingCreditId(creditCookieRaw)
        if (!creditId) {
          return respond(
            {
              error: 'Analysis quota exceeded.',
              code: e.code,
              quota: { mode: e.mode, limit: e.limit, used: e.used, remaining: 0 },
            },
            429
          )
        }
        const creditRow = await loadConsumableProReportPendingCredit({
          creditIdFromCookie: creditId,
          anonymousSessionId,
        })
        if (!creditRow) {
          console.warn('[analyze] prepaid credit cookie present but not consumable', {
            creditTail: creditId.slice(-8),
          })
          return respond(
            {
              error: 'Analysis quota exceeded.',
              code: e.code,
              quota: { mode: e.mode, limit: e.limit, used: e.used, remaining: 0 },
            },
            429
          )
        }
        prepaidCreditRowId = creditRow.id
      } else {
        console.error('[analyze] quota increment', e)
        return respond({ error: 'Could not verify usage quota.' }, 503)
      }
    }
  }

  const analysisId = randomUUID()

  const prompt = buildAnalysisPrompt(normalizedCv, normalizedJd)

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content:
            'You are a precise hiring and resume analysis assistant. You must be factual, structured, and concise.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    })

    const rawMessage = completion.choices[0]?.message?.content
    const message = typeof rawMessage === 'string' ? rawMessage.trim() : ''

    const fullReportAccess = mode === 'monthly' || prepaidCreditRowId != null

    if (!message) {
      if (quotaConsumed && !usageLimitsDisabled()) {
        await decrementAnalysisUsage(subject, mode).catch(() => {})
      }
      return respond({ error: 'AI analysis returned an empty response.', analysisId }, 502)
    }

    if (prepaidCreditRowId) {
      try {
        await consumePendingProReportCreditAndUnlock({
          creditRowId: prepaidCreditRowId,
          anonymousSessionId,
          analysisId,
        })
      } catch (ce) {
        console.error('[analyze] prepaid credit consume', ce instanceof Error ? ce.message : 'unknown')
        if (quotaConsumed && !usageLimitsDisabled()) {
          await decrementAnalysisUsage(subject, mode).catch(() => {})
        }
        return respond(
          { error: 'Analysis completed but Pro unlock failed. Please retry or contact support.', analysisId },
          500
        )
      }

      const res = NextResponse.json({ message, analysisId, fullReportAccess }, { status: 200 })
      applyAnonymousSessionCookie(res, signedAnon)
      try {
        attachProReportEntitlementTokenCookie(
          res,
          jar.get(JOBFIT_PRO_REPORT_ENTITLEMENT_COOKIE)?.value,
          analysisId
        )
        clearProReportPendingCreditCookie(res)
      } catch (cookieErr) {
        console.error('[analyze] entitlement after prepaid', cookieErr instanceof Error ? cookieErr.message : 'unknown')
        return respond(
          { error: 'Unlock saved but browser cookies could not be updated. Use “claim” from account tools.', analysisId },
          500
        )
      }
      return res
    }

    return respond({ message, analysisId, fullReportAccess }, 200)
  } catch (error: unknown) {
    if (quotaConsumed && !usageLimitsDisabled()) {
      await decrementAnalysisUsage(subject, mode).catch(() => {})
    }

    if (error instanceof Error) {
      console.error('OpenRouter API Error:', error.message)
    } else {
      console.error('Unknown error:', error)
    }

    return respond({ error: 'OpenRouter AI analysis failed.', analysisId }, 500)
  }
}
