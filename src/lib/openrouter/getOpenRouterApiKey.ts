/** OpenRouter key (preferred) with legacy OPENAI_API_KEY fallback for local .env files. */
export function getOpenRouterApiKey(): string | undefined {
  const openRouter = process.env.OPENROUTER_API_KEY?.trim()
  if (openRouter) return openRouter
  const legacy = process.env.OPENAI_API_KEY?.trim()
  return legacy || undefined
}
