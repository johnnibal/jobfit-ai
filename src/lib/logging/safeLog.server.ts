/** Server-side logging helpers — never log CV/JD, secrets, full cookies, or full Stripe IDs. */

export type SafeLogContext = Record<string, string | number | boolean | undefined | null>

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.trim()
    if (!msg) return error.name || 'Error'
    return msg.length > 240 ? `${msg.slice(0, 240)}…` : msg
  }
  if (typeof error === 'string') {
    return error.length > 240 ? `${error.slice(0, 240)}…` : error
  }
  return 'unknown_error'
}

export function logServerError(tag: string, error: unknown, context?: SafeLogContext): void {
  console.error(tag, { ...context, error: safeErrorMessage(error) })
}

export function logServerWarn(tag: string, context?: SafeLogContext): void {
  console.warn(tag, context ?? {})
}

export function logServerInfo(tag: string, context?: SafeLogContext): void {
  console.info(tag, context ?? {})
}

export function idTail(id: string | null | undefined, len = 8): string {
  if (!id || typeof id !== 'string') return 'none'
  const t = id.trim()
  return t.length <= len ? t : t.slice(-len)
}

export function idPrefix(id: string | null | undefined, len = 12): string {
  if (!id || typeof id !== 'string') return 'unknown'
  const t = id.trim()
  return t.length <= len ? t : `${t.slice(0, len)}…`
}
