'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/track'

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [phase, setPhase] = useState<'loading' | 'ok' | 'error'>('loading')
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const paymentReportedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'ok' || !analysisId) return
    if (paymentReportedRef.current) return
    paymentReportedRef.current = true
    trackEvent('payment_success', { product: 'pro_report' })
  }, [phase, analysisId])

  useEffect(() => {
    if (!sessionId?.trim()) {
      setPhase('error')
      setMessage('Missing checkout session. Start again from the analyzer.')
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
          analysisId?: string
          error?: string
        }
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Verification failed.')
        }
        if (cancelled) return

        if (data.type === 'monthly_pro') {
          window.location.replace(
            `/checkout/subscription-success?session_id=${encodeURIComponent(sessionId.trim())}`
          )
          return
        }

        if (data.type !== 'pro_report' || typeof data.analysisId !== 'string') {
          throw new Error('Unexpected checkout confirmation — open support if you were charged.')
        }

        setAnalysisId(data.analysisId)
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
    if (phase !== 'ok' || !analysisId) return
    const t = window.setTimeout(() => {
      window.location.href = `/analyze?pro=${encodeURIComponent(analysisId)}`
    }, 1600)
    return () => window.clearTimeout(t)
  }, [phase, analysisId])

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.14),_transparent_32%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-8 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl">
          {phase === 'loading' ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
                Confirming payment
              </div>
              <h1 className="text-2xl font-semibold text-white">Hang tight…</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Verifying your checkout session with Stripe and saving your Pro Report unlock.
              </p>
              <div className="mt-8 flex gap-2">
                <div className="h-2 flex-1 animate-pulse rounded-full bg-slate-800" />
                <div className="h-2 w-16 animate-pulse rounded-full bg-cyan-500/40" />
              </div>
            </>
          ) : null}

          {phase === 'ok' ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                Payment successful
              </div>
              <h1 className="text-2xl font-semibold text-white">Pro Report unlocked</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Your entitlement cookie is saved on this browser. Redirecting back to the analyzer — your report opens with
                full detail.
              </p>
              {analysisId ? (
                <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 font-mono text-xs text-slate-500">
                  Session · {analysisId.slice(0, 8)}…
                </p>
              ) : null}
              <Link
                href={analysisId ? `/analyze?pro=${encodeURIComponent(analysisId)}` : '/analyze'}
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
              >
                Open analyzer now
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
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                If you were charged, your webhook may still process shortly — contact support with your Stripe receipt.
              </p>
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
