import { getOpenRouterApiKey } from '@/lib/openrouter/getOpenRouterApiKey'

export type OpenRouterKeyCheck = {
  ok: boolean
  keyValid: boolean
  limitRemaining: number | null
  isFreeTier: boolean | null
  error: 'missing_key' | 'invalid_key' | 'no_credits' | 'key_check_failed' | 'key_check_unreachable' | null
}

type OpenRouterKeyPayload = {
  data?: {
    limit_remaining?: number | null
    is_free_tier?: boolean
  }
}

/** Ops-only probe — validates key and remaining credits without running a model. */
export async function verifyOpenRouterKey(): Promise<OpenRouterKeyCheck> {
  const apiKey = getOpenRouterApiKey()
  if (!apiKey) {
    return {
      ok: false,
      keyValid: false,
      limitRemaining: null,
      isFreeTier: null,
      error: 'missing_key',
    }
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8_000),
    })

    if (res.status === 401) {
      return {
        ok: false,
        keyValid: false,
        limitRemaining: null,
        isFreeTier: null,
        error: 'invalid_key',
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        keyValid: false,
        limitRemaining: null,
        isFreeTier: null,
        error: 'key_check_failed',
      }
    }

    const json = (await res.json()) as OpenRouterKeyPayload
    const limitRemaining =
      typeof json.data?.limit_remaining === 'number' ? json.data.limit_remaining : null
    const isFreeTier = typeof json.data?.is_free_tier === 'boolean' ? json.data.is_free_tier : null

    if (limitRemaining !== null && limitRemaining <= 0) {
      return {
        ok: false,
        keyValid: true,
        limitRemaining: 0,
        isFreeTier,
        error: 'no_credits',
      }
    }

    return {
      ok: true,
      keyValid: true,
      limitRemaining,
      isFreeTier,
      error: null,
    }
  } catch {
    return {
      ok: false,
      keyValid: false,
      limitRemaining: null,
      isFreeTier: null,
      error: 'key_check_unreachable',
    }
  }
}
