export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAnalyzeConfigIssues } from '@/lib/analyze/analyzeServerConfig.server'
import { isUsableOpenRouterApiKey } from '@/lib/openrouter/getOpenRouterApiKey'
import { verifyOpenRouterKey } from '@/lib/openrouter/verifyOpenRouterKey.server'

function describeOpenRouterEnvIssue(): 'missing_key' | 'invalid_key_format' | null {
  const rawOpenRouter = process.env.OPENROUTER_API_KEY?.trim()
  const rawLegacy = process.env.OPENAI_API_KEY?.trim()

  if (isUsableOpenRouterApiKey(rawOpenRouter) || isUsableOpenRouterApiKey(rawLegacy)) {
    return null
  }

  if (rawOpenRouter || rawLegacy) return 'invalid_key_format'
  return 'missing_key'
}

/** Safe ops check for CV analysis — missing env names + OpenRouter key/credits (no secrets). */
export async function GET() {
  const missing = getAnalyzeConfigIssues()
  const openrouter = await verifyOpenRouterKey()
  const envIssue = describeOpenRouterEnvIssue()

  return NextResponse.json({
    ok: missing.length === 0 && openrouter.ok,
    env: {
      ok: missing.length === 0,
      missing,
      openRouterKeyIssue: envIssue,
    },
    openrouter,
  })
}
