import { APIError } from 'openai'
import { safeErrorMessage } from '@/lib/logging/safeLog.server'
import { openRouterKeyFingerprint } from '@/lib/openrouter/getOpenRouterApiKey'

export type OpenRouterFailureKind =
  | 'missing_key'
  | 'invalid_key'
  | 'no_credits'
  | 'rate_limited'
  | 'model_unavailable'
  | 'timeout'
  | 'provider_error'

export function classifyOpenRouterError(error: unknown): OpenRouterFailureKind {
  const message = safeErrorMessage(error).toLowerCase()

  if (message.includes('missing authentication header')) return 'missing_key'

  if (error instanceof APIError) {
    if (error.status === 401) return 'invalid_key'
    if (error.status === 402) return 'no_credits'
    if (error.status === 429) return 'rate_limited'
    if (error.status === 404) return 'model_unavailable'
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (error.name === 'AbortError' || msg.includes('timeout') || msg.includes('timed out')) {
      return 'timeout'
    }
  }

  return 'provider_error'
}

/** User-safe message — no secrets or env var names. */
export function openRouterUserErrorMessage(error: unknown): string {
  switch (classifyOpenRouterError(error)) {
    case 'missing_key':
      return 'AI service authentication failed. Please contact support.'
    case 'invalid_key':
      return 'AI service authentication failed. Please contact support.'
    case 'no_credits':
      return 'AI service credits are exhausted. Please try again later.'
    case 'rate_limited':
      return 'AI service is busy. Please wait a moment and try again.'
    case 'model_unavailable':
      return 'AI model is temporarily unavailable. Please try again shortly.'
    case 'timeout':
      return 'AI analysis timed out. Try shorter text or retry in a moment.'
    default:
      return 'AI analysis failed. Please try again shortly.'
  }
}

export function openRouterErrorHttpStatus(error: unknown): number {
  if (error instanceof OpenRouterHttpError) {
    if (error.status === 401 || error.status === 402) return 503
    if (error.status === 429) return 429
    if (error.status === 404) return 503
    if (error.status === 504) return 504
  }
  if (error instanceof APIError) {
    if (error.status === 401 || error.status === 402) return 503
    if (error.status === 429) return 429
    if (error.status === 404) return 503
  }
  if (classifyOpenRouterError(error) === 'timeout') return 504
  return 500
}

export function openRouterLogContext(
  error: unknown,
  apiKey?: string
): Record<string, string | number | boolean> {
  const kind = classifyOpenRouterError(error)
  const fingerprint = openRouterKeyFingerprint(apiKey)
  const ctx: Record<string, string | number | boolean> = {
    kind,
    message: safeErrorMessage(error),
    keyConfigured: fingerprint.configured,
    keyLength: fingerprint.length,
    keyPrefix: fingerprint.prefix,
  }
  if (error instanceof APIError && typeof error.status === 'number') {
    ctx.status = error.status
  }
  return ctx
}

export class OpenRouterHttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'OpenRouterHttpError'
    this.status = status
  }
}

export function toOpenRouterThrownError(status: number, message: string): OpenRouterHttpError {
  return new OpenRouterHttpError(status, message)
}

/** Map fetch-based OpenRouter errors through the same classifier as the OpenAI SDK. */
export function classifyOpenRouterHttpFailure(status: number, message: string): OpenRouterHttpError {
  if (status === 401 && message.toLowerCase().includes('missing authentication header')) {
    return toOpenRouterThrownError(status, message)
  }
  return toOpenRouterThrownError(status, message)
}
