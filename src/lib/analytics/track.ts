/**
 * Lightweight analytics façade — wires to optional sinks only (client-side).
 * No third-party scripts are loaded unless you register a sink yourself.
 */

import type { AnalyticsEventName } from './events'

/** Values must be primitives only — never paste CV/JD/copy into analytics. */
export type AnalyticsPayloadValue = string | number | boolean

export type AnalyticsPayload = Partial<Record<string, AnalyticsPayloadValue>>

export type AnalyticsSink = (event: AnalyticsEventName, props?: AnalyticsPayload) => void

let sink: AnalyticsSink | null = null

/** Register provider(s) once (e.g. from ClientAnalytics bootstrap). Passing null clears. */
export function registerAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next
}

function scrubPayload(props?: AnalyticsPayload): AnalyticsPayload | undefined {
  if (!props) return undefined
  const out: AnalyticsPayload = {}
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'number' && !Number.isFinite(v)) continue
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') continue
    if (typeof k !== 'string' || k.length > 64 || k.includes('.')) continue
    out[k] = v as AnalyticsPayloadValue
  }
  return Object.keys(out).length ? out : undefined
}

/**
 * Emit a product event from the browser. Server-side / SSR: no-op.
 */
export function trackEvent(event: AnalyticsEventName, props?: AnalyticsPayload): void {
  if (typeof window === 'undefined') return
  try {
    const safe = scrubPayload(props)
    sink?.(event, safe)

    const allowDevLog =
      typeof process !== 'undefined' &&
      typeof process.env !== 'undefined' &&
      process.env.NODE_ENV !== 'production'
    if (allowDevLog) {
      console.debug('[jobfit-analytics]', event, safe ?? {})
    }
  } catch {
    /* analytics must never throw */
  }
}
