import {
  classifyOpenRouterHttpFailure,
  OpenRouterHttpError,
} from '@/lib/openrouter/openRouterErrors.server'

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type OpenRouterChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function attributionHeaders(): Record<string, string> {
  const referer = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://jobfit.ai'
  return {
    'HTTP-Referer': referer,
    'X-OpenRouter-Title': 'JobFit AI',
  }
}

type OpenRouterChatCompletionInput = {
  apiKey: string
  model: string
  messages: OpenRouterChatMessage[]
  temperature?: number
  timeoutMs?: number
}

type OpenRouterChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
  error?: {
    message?: string
  }
}

/** Direct OpenRouter call with explicit Authorization header (avoids SDK header edge cases). */
export async function openRouterChatCompletion(
  input: OpenRouterChatCompletionInput
): Promise<string> {
  const timeoutMs = input.timeoutMs ?? 90_000

  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
      ...attributionHeaders(),
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  const raw = await res.text()
  let parsed: OpenRouterChatCompletionResponse | null = null
  try {
    parsed = raw ? (JSON.parse(raw) as OpenRouterChatCompletionResponse) : null
  } catch {
    parsed = null
  }

  if (!res.ok) {
    const providerMessage =
      typeof parsed?.error?.message === 'string'
        ? parsed.error.message
        : raw.trim() || `OpenRouter request failed (${res.status})`
    throw classifyOpenRouterHttpFailure(res.status, providerMessage)
  }

  const content = parsed?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new OpenRouterHttpError(502, 'OpenRouter returned an empty completion.')
  }

  return content.trim()
}
