import OpenAI from 'openai'
import { getOpenRouterApiKey } from '@/lib/openrouter/getOpenRouterApiKey'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

function openRouterAttributionHeaders(): Record<string, string> {
  const referer = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://jobfit.ai'
  return {
    'HTTP-Referer': referer,
    'X-OpenRouter-Title': 'JobFit AI',
  }
}

/** Shared OpenRouter client — attribution headers + unified base URL. */
export function createOpenRouterClient(apiKey?: string): OpenAI {
  const key = apiKey ?? getOpenRouterApiKey()
  if (!key) {
    throw new Error('OpenRouter API key is not configured.')
  }

  return new OpenAI({
    apiKey: key,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      Authorization: `Bearer ${key}`,
      ...openRouterAttributionHeaders(),
    },
    timeout: 90_000,
    maxRetries: 1,
  })
}
