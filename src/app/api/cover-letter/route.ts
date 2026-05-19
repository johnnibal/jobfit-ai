export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  coverLetterLanguagePrompt,
  coverLetterTonePrompt,
  parseCoverLetterLanguage,
  parseCoverLetterTone,
} from '@/lib/coverLetterOptions'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { requirePremiumAccess } from '@/lib/billing/requirePremiumAccess.server'
import { getOpenRouterApiKey } from '@/lib/openrouter/getOpenRouterApiKey'
import { ERR_AI_NOT_CONFIGURED } from '@/lib/api/publicErrors'
import { logServerError } from '@/lib/logging/safeLog.server'

const MIN_CHARS = 50

function buildCoverLetterPrompt(params: {
  cv: string
  jd: string
  analysisResult: string
  languageLine: string
  toneLine: string
}) {
  return `
You are JobFit AI, an expert assistant for concise, truthful job-application cover letters.

Non-negotiable rules:
1. Use ONLY facts, skills, employers, titles, education, tools, and achievements that appear explicitly in the CV below. Do not invent, infer, or embellish experience.
2. Tie the letter to this job posting using honest alignment — reference requirements and themes from the JD, but only support them with CV evidence.
3. If the CV does not mention something the JD asks for, do not claim it. You may express interest in growing in that area without fabricating credentials.
4. Use the structured fit analysis only as secondary context — never contradict what is in the CV.
5. Output plain text only: a complete letter with greeting, body paragraphs, and closing. No markdown, no bullet lists in the letter body unless essential (prefer short paragraphs).

${params.languageLine}

${params.toneLine}

CV (sole source of truth for candidate facts):
${params.cv}

JOB POSTING:
${params.jd}

FIT ANALYSIS (context only; do not add facts beyond the CV):
${params.analysisResult}
  `.trim()
}

export async function POST(req: Request) {
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
  const analysisResult = typeof rec.analysisResult === 'string' ? rec.analysisResult.trim() : ''

  const language = parseCoverLetterLanguage(rec.language)
  const tone = parseCoverLetterTone(rec.tone)

  if (!analysisId || !isAnalysisSessionId(analysisId)) {
    return NextResponse.json({ error: 'Valid analysisId (UUID v4) is required.' }, { status: 400 })
  }

  if (!language || !tone) {
    return NextResponse.json({ error: 'Invalid language or tone.' }, { status: 400 })
  }

  if (cv.length < MIN_CHARS || !/[a-zA-Z]/.test(cv)) {
    return NextResponse.json({ error: 'CV text is too short or invalid.' }, { status: 400 })
  }

  if (jd.length < MIN_CHARS || !/[a-zA-Z]/.test(jd)) {
    return NextResponse.json({ error: 'Job description is too short or invalid.' }, { status: 400 })
  }

  if (analysisResult.length < MIN_CHARS) {
    return NextResponse.json({ error: 'Analysis result is too short.' }, { status: 400 })
  }

  let access: Awaited<ReturnType<typeof requirePremiumAccess>>
  try {
    access = await requirePremiumAccess({
      request: req,
      analysisId,
      feature: 'cover_letter',
    })
  } catch (e) {
    logServerError('[cover-letter] entitlement check', e)
    return NextResponse.json({ error: 'Could not verify subscription.' }, { status: 503 })
  }

  if (!access.allowed) {
    return NextResponse.json({ error: 'Cover letter generation requires Pro Report or Monthly Pro.' }, { status: 403 })
  }

  const apiKey = getOpenRouterApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: ERR_AI_NOT_CONFIGURED }, { status: 500 })
  }

  const prompt = buildCoverLetterPrompt({
    cv,
    jd,
    analysisResult,
    languageLine: coverLetterLanguagePrompt(language),
    toneLine: coverLetterTonePrompt(tone),
  })

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
            'You write accurate, tailored cover letters. You never invent resume facts. You follow instructions exactly.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.35,
    })

    const raw = completion.choices[0]?.message?.content
    const letter = typeof raw === 'string' ? raw.trim() : ''

    if (!letter) {
      return NextResponse.json({ error: 'AI returned an empty cover letter.' }, { status: 502 })
    }

    return NextResponse.json({ letter })
  } catch (error: unknown) {
    logServerError('[cover-letter] ai_provider', error)
    return NextResponse.json({ error: 'Cover letter generation failed.' }, { status: 500 })
  }
}
