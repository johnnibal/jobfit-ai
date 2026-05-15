export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { parseAtsChecklistPremium } from '@/lib/atsChecklistTypes'
import { isAnalysisSessionId } from '@/lib/billing/analysisSession'
import { requirePremiumAccess } from '@/lib/billing/requirePremiumAccess.server'

const MIN_CHARS = 50

function buildAtsChecklistPrompt(cv: string, jd: string, analysisResult: string) {
  return `
You extract ATS-relevant terminology from a JOB POSTING and map it to the candidate CV.

Job postings may be in GERMAN or ENGLISH (or mixed). Preserve keywords exactly as meaningful for search systems (correct casing where it matters: product names, certs, stacks).

Hard rules:
1. ONLY include phrases that clearly appear or are reasonably implied clusters from the JOB POSTING (requirements, responsibilities, tools, stacks, certs, methodologies). Never invent JD requirements.
2. NEVER invent CV facts. Classify presence strictly from CV text: if the CV does not clearly support a phrase, treat it as missing for CV alignment — do not assume hidden skills.
3. Separate REQUIRED vs NICE-TO-HAVE using the posting's language (e.g. English "must/required", German "erforderlich/muss/wünschenswert/von Vorteil/Bonus").
4. Do NOT optimize for keyword stuffing. Prefer fewer, accurate items over long lists.
5. suggestedPlacements: ONLY for genuinely MISSING phrases where honest inclusion might be natural IF the candidate truly has adjacent experience. Give one concise suggestion each (which CV section type or bullet theme — not full rewritten sentences). If there is no honest angle, omit that phrase from suggestedPlacements and put guidance under authenticityWarnings instead.
6. authenticityWarnings: When the JD emphasizes something the CV cannot substantiate, warn against adding it without evidence (interviews will probe). Use separate entries per risky phrase when needed.

Return ONLY valid JSON with this exact shape (arrays may be empty):
{
  "requiredFoundInCv": [{ "phrase": "string", "cvEvidenceNote": "optional short tie to CV wording" }],
  "requiredMissingFromCv": [{ "phrase": "string", "cvEvidenceNote": "optional why core from JD" }],
  "niceToHave": [{ "phrase": "string", "cvEvidenceNote": "optional" }],
  "suggestedPlacements": [{ "keyword": "string", "suggestion": "string" }],
  "authenticityWarnings": [{ "keyword": "string", "warning": "string" }]
}

FIT ANALYSIS (context only — CV below remains source of truth for facts):
${analysisResult}

CV:
${cv}

JOB POSTING:
${jd}
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

  if (!analysisId || !isAnalysisSessionId(analysisId)) {
    return NextResponse.json({ error: 'Valid analysisId (UUID v4) is required.' }, { status: 400 })
  }

  if (cv.length < MIN_CHARS || !/[a-zA-ZÄÖÜäöüß]/.test(cv)) {
    return NextResponse.json({ error: 'CV text is too short or invalid.' }, { status: 400 })
  }

  if (jd.length < MIN_CHARS || !/[a-zA-ZÄÖÜäöüß]/.test(jd)) {
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
      feature: 'ats_checklist',
    })
  } catch (e) {
    console.error('[ats-checklist] entitlement check', e)
    return NextResponse.json({ error: 'Could not verify subscription.' }, { status: 503 })
  }

  if (!access.allowed) {
    return NextResponse.json({ error: 'Full ATS checklist requires Pro Report or Monthly Pro.' }, { status: 403 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured on the server.' }, { status: 500 })
  }

  const prompt = buildAtsChecklistPrompt(cv, jd, analysisResult)

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
            'You output only compact JSON for resume–job alignment. You never invent CV or JD facts. You discourage dishonest keyword stuffing.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content
    const jsonStr = typeof raw === 'string' ? raw.trim() : ''

    if (!jsonStr) {
      return NextResponse.json({ error: 'AI returned an empty checklist.' }, { status: 502 })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonStr) as unknown
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON.' }, { status: 502 })
    }

    const checklist = parseAtsChecklistPremium(parsed)
    if (!checklist) {
      return NextResponse.json({ error: 'Could not parse ATS checklist.' }, { status: 502 })
    }

    return NextResponse.json({ checklist })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[ats-checklist]', error.message)
    } else {
      console.error('[ats-checklist]', error)
    }
    return NextResponse.json({ error: 'ATS checklist generation failed.' }, { status: 500 })
  }
}
