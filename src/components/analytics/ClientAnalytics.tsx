'use client'

import { type ReactNode, useEffect } from 'react'

import type { AnalyticsEventName } from '@/lib/analytics/events'
import type { AnalyticsPayload } from '@/lib/analytics/track'
import { registerAnalyticsSink } from '@/lib/analytics/track'

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void
    posthog?: { capture?: (event: string, props?: Record<string, unknown>) => void }
    jobfitAnalyticsDispatchDom?: boolean
    gtag?: (...args: unknown[]) => void
    dataLayer?: Record<string, unknown>[]
  }
}

type Props = { children?: ReactNode }

/**
 * Opt-in integrations (no trackers loaded here):
 *
 * - `window.plausible` — insert Plausible snippet yourself for your domain.
 * - `window.posthog` — if you initialise Posthog elsewhere.
 * - `window.gtag` — Google GA4 usually sets this globally.
 * - `window.dataLayer` — pushes `{ event, ...props }`.
 * - Set `window.jobfitAnalyticsDispatchDom = true` to receive `CustomEvent("jobfit-analytics")` with `{ detail: { event, props } }`.
 */
export function ClientAnalytics({ children }: Props) {
  useEffect(() => {
    registerAnalyticsSink((event: AnalyticsEventName, props?: AnalyticsPayload) => {
      const extras = props && Object.keys(props).length ? (props as Record<string, unknown>) : undefined

      if (typeof window !== 'undefined' && window.jobfitAnalyticsDispatchDom === true) {
        try {
          window.dispatchEvent(
            new CustomEvent('jobfit-analytics', {
              bubbles: false,
              detail: { event, props: extras ?? {} },
            })
          )
        } catch {
          /* noop */
        }
      }

      try {
        if (typeof window.plausible === 'function') {
          window.plausible(event, extras ? { props: extras } : undefined)
        }
      } catch {
        /* noop */
      }

      try {
        window.posthog?.capture?.(event, extras ?? {})
      } catch {
        /* noop */
      }

      try {
        if (typeof window.gtag === 'function') {
          window.gtag('event', event, extras ?? {})
        }
      } catch {
        /* noop */
      }

      try {
        if (Array.isArray(window.dataLayer)) {
          window.dataLayer.push({ event, ...(extras ?? {}) })
        }
      } catch {
        /* noop */
      }
    })

    return () => registerAnalyticsSink(null)
  }, [])

  return children ?? null
}
