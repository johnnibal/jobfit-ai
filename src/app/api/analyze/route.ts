export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
})

export async function POST(req: Request) {
  const { cv, jd } = await req.json()

  const prompt = `
You are a career coach AI. Compare this resume with the job description.

RESUME:
${cv}

JOB DESCRIPTION:
${jd}

1. Give a fit score from 0–100.
2. List missing skills.
3. Suggest ways to improve the match.
  `.trim()

  try {
    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const message = completion.choices[0].message.content
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
