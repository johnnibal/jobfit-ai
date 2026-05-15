'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/track'

export default function SubscriptionSuccessClient() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [phase, setPhase] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const paymentReportedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'ok') return
    if (paymentReportedRef.current) return
    paymentReportedRef.current = true
    trackEvent('payment_success', { product: 'monthly_pro' })
  }, [phase])

  useEffect(() => {
    if (!sessionId?.trim()) {
      setPhase('error')
      setMessage('Missing checkout session.')
      return
    }

    let cancelled = false
    fetch(`/api/billing/confirm-session?session_id=${encodeURIComponent(sessionId.trim())}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          ok?: boolean
          type?: string
          error?: string
        }
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Verification failed.')
        }
        if (cancelled) return
        if (data.type !== 'monthly_pro') {
          throw new Error('This session is not a Monthly Pro subscription checkout.')
        }
        setPhase('ok')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setPhase('error')
        setMessage(e instanceof Error ? e.message : 'Something went wrong.')
      })

    return () => {
      cancelled = true
    }
  }, [sessionId])

  useEffect(() => {
    if (phase !== 'ok') return
    const t = window.setTimeout(() => {
      window.location.href = '/analyze?sub=1'
    }, 1400)
    return () => window.clearTimeout(t)
  }, [phase])

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.14),_transparent_32%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-8 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl">
          {phase === 'loading' ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
                Confirming subscription
              </div>
              <h1 className="text-2xl font-semibold text-white">Almost there…</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Saving your Monthly Pro subscription to your billing profile and setting secure cookies on this browser.
              </p>
              <div className="mt-8 flex gap-2">
                <div className="h-2 flex-1 animate-pulse rounded-full bg-slate-800" />
                <div className="h-2 w-16 animate-pulse rounded-full bg-violet-500/40" />
              </div>
            </>
          ) : null}

          {phase === 'ok' ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                Subscription active
              </div>
              <h1 className="text-2xl font-semibold text-white">Welcome to Monthly Pro</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Higher monthly quota, full reports, exports, and saved reports are unlocked while your subscription stays active.
                Redirecting…
              </p>
              <Link
                href="/analyze?sub=1"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
              >
                Open analyzer
              </Link>
            </>
          ) : null}

          {phase === 'error' ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200">
                Could not confirm
              </div>
              <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
              <p className="mt-3 text-sm leading-relaxed text-rose-200/90">{message}</p>
              <Link
                href="/analyze"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-slate-600 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
              >
                Back to analyzer
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </main>
  )
}
