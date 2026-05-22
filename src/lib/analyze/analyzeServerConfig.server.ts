import { getOpenRouterApiKey } from '@/lib/openrouter/getOpenRouterApiKey'

export type AnalyzeConfigKey = 'OPENROUTER_API_KEY' | 'JOBFIT_USAGE_SECRET' | 'DATABASE_URL'

export function getAnalyzeConfigIssues(): AnalyzeConfigKey[] {
  const missing: AnalyzeConfigKey[] = []

  if (!getOpenRouterApiKey()) missing.push('OPENROUTER_API_KEY')

  const usageSecret = process.env.JOBFIT_USAGE_SECRET?.trim()
  if (!usageSecret || usageSecret.length < 16) missing.push('JOBFIT_USAGE_SECRET')

  if (!process.env.DATABASE_URL?.trim()) missing.push('DATABASE_URL')

  return missing
}

export function analyzeConfigIncompleteResponse() {
  const missing = getAnalyzeConfigIssues()
  if (missing.length === 0) return null

  return {
    status: 503 as const,
    body: {
      error: 'Analysis is not fully configured on the server.',
      code: 'CONFIG_INCOMPLETE' as const,
      missing,
    },
  }
}
