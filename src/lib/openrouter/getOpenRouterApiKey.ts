const PLACEHOLDER_PATTERNS = [
  'your_openrouter_api_key',
  'your-api-key-here',
  'your_api_key',
  'changeme',
  'replace_me',
  'insert_key',
]

export function isUsableOpenRouterApiKey(key: string | undefined): boolean {
  if (!key) return false
  const trimmed = key.trim()
  if (trimmed.length < 20) return false

  const lower = trimmed.toLowerCase()
  if (PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))) return false
  if (lower === 'undefined' || lower === 'null') return false

  return true
}

/** OpenRouter key (preferred) with legacy OPENAI_API_KEY fallback for local .env files. */
export function getOpenRouterApiKey(): string | undefined {
  const openRouter = process.env.OPENROUTER_API_KEY?.trim()
  if (isUsableOpenRouterApiKey(openRouter)) return openRouter

  const legacy = process.env.OPENAI_API_KEY?.trim()
  if (isUsableOpenRouterApiKey(legacy)) return legacy

  return undefined
}

/** Safe ops logging — never log the full key. */
export function openRouterKeyFingerprint(key: string | undefined): {
  configured: boolean
  length: number
  prefix: string
} {
  const trimmed = typeof key === 'string' ? key.trim() : ''
  if (!isUsableOpenRouterApiKey(trimmed)) {
    return { configured: false, length: trimmed.length, prefix: 'none' }
  }
  return {
    configured: true,
    length: trimmed.length,
    prefix: trimmed.slice(0, 8),
  }
}
