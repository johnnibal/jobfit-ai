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
You are a career coach AI. Compare this resume with the job description., analyze how well the candidate fits the role.
Your evaluation must:
- Be honest and strict
- Identify missing skills or experiences
- Reject irrelevant or meaningless job descriptions

Give a final **score out of 100** based only on factual alignment

RESUME:
${cv}

JOB DESCRIPTION:
${jd}

Respond in this format:
Score: <number>/100
Suggestions: <your suggestions>

End your message with this note:
"⚠️ Reality Check:
Even with a strong match, you may still get ghosted... or the dreaded “leider” email 😔.

Keep applying, keep refining. One 'yes' is all you need."
`.trim()

if (jd.length < 50 || !/[a-zA-Z]/.test(jd)) {
  return NextResponse.json({ message: 'Invalid job description.' }, { status: 400 })
}

  try {
    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
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
