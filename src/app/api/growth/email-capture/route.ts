export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import {
  EMAIL_CAPTURE_CONSENT_LABEL,
  EMAIL_CAPTURE_CONSENT_VERSION,
} from '@/lib/growth/emailCaptureConsent'
import { prisma } from '@/lib/prisma'
import { ERR_DATABASE_NOT_CONFIGURED } from '@/lib/api/publicErrors'
import { logServerError } from '@/lib/logging/safeLog.server'

const MAX_EMAIL = 320

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

function isValidEmail(s: string): boolean {
  if (s.length < 5 || s.length > MAX_EMAIL) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

/**
 * Persist email + consent only — no mailing provider integration yet.
 * Do not persist when consent is false (GDPR-style purpose limitation).
 */
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

  const emailRaw = typeof rec.email === 'string' ? rec.email : ''
  const email = normalizeEmail(emailRaw)
  const consent = rec.consentReportAndUpdates === true
  const versionClient = typeof rec.consentCopyVersion === 'string' ? rec.consentCopyVersion.trim() : ''
  const analysisIdRaw = typeof rec.analysisId === 'string' ? rec.analysisId.trim() : ''

  if (!consent) {
    return NextResponse.json(
      { error: 'Consent is required to store your email. Use “Continue without email” if you prefer not to share it.' },
      { status: 400 }
    )
  }

  if (versionClient !== EMAIL_CAPTURE_CONSENT_VERSION) {
    return NextResponse.json({ error: 'Please refresh the page and try again (consent version mismatch).' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  let analysisId: string | null = null
  if (analysisIdRaw) {
    if (!isAnalysisSessionId(analysisIdRaw)) {
      return NextResponse.json({ error: 'Invalid analysis reference.' }, { status: 400 })
    }
    analysisId = analysisIdRaw
  }

  try {
    await prisma.growthEmailConsent.create({
      data: {
        email,
        consentCopyVersion: EMAIL_CAPTURE_CONSENT_VERSION,
        analysisId,
      },
    })

    return NextResponse.json({
      ok: true,
      /** Echo for client logs only — do not treat as marketing subscription yet */
      delivered: false,
      consentLabelSnapshot: EMAIL_CAPTURE_CONSENT_LABEL,
    })
  } catch (e) {
    logServerError('[growth/email-capture]', e)
    return NextResponse.json({ error: 'Could not save your details. You can still view your report.' }, { status: 500 })
  }
}
