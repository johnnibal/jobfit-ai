export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import OpenAI from 'openai'

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
  const { cv, jd } = await req.json()
  const normalizedCv = typeof cv === 'string' ? cv.trim() : ''
  const normalizedJd = typeof jd === 'string' ? jd.trim() : ''
  const apiKey = process.env.OPENROUTER_API_KEY

  if (normalizedCv.length < 50 || !/[a-zA-Z]/.test(normalizedCv)) {
    return NextResponse.json({ message: 'Please provide a valid CV or resume text.' }, { status: 400 })
  }

  if (normalizedJd.length < 50 || !/[a-zA-Z]/.test(normalizedJd)) {
    return NextResponse.json({ message: 'Please provide a valid job description.' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY is not configured on the server.' },
      { status: 500 }
    )
  }

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

    if (!message) {
      return NextResponse.json({ error: 'AI analysis returned an empty response.' }, { status: 502 })
    }

    return NextResponse.json({ message })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('OpenRouter API Error:', error.message)
    } else {
      console.error('Unknown error:', error)
    }

    return NextResponse.json(
      { error: 'OpenRouter AI analysis failed.' },
      { status: 500 }
    )
  }
}
