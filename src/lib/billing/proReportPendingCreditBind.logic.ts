/** Pure classification for prepaid Pro Report credit anonymous binding — used by ensure + Vitest */

export type ProReportCreditBindClass =
  | 'already_consumed'
  /** Row already pinned to another browser-scoped anon id — should not overwrite */
  | 'anonymous_session_mismatch'
  /** Row exists and already matches purchaser anon */
  | 'already_bound_ok'
  /** Row lacks anon → confirm flow may set exactly once */
  | 'needs_anonymous_bind'

export function classifyProReportCreditAnonymousBind(opts: {
  consumedAt: Date | null | undefined
  storedAnonymousSessionId: string | null | undefined
  requestedAnonymousSessionId: string
}): ProReportCreditBindClass {
  if (opts.consumedAt != null) {
    return 'already_consumed'
  }
  const stored = opts.storedAnonymousSessionId?.trim() ?? ''
  const want = opts.requestedAnonymousSessionId.trim()
  if (stored && stored !== want) {
    return 'anonymous_session_mismatch'
  }
  if (stored === want) {
    return 'already_bound_ok'
  }
  return 'needs_anonymous_bind'
}
