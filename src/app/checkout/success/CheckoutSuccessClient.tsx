'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/track'
import {
  CHECKOUT_CONFIRM_LOADING_PAYMENT_BODY,
  CHECKOUT_CONFIRM_LOADING_PAYMENT_TITLE,
  SUCCESS_PRO_REPORT_CREDIT_BODY,
  SUCCESS_PRO_REPORT_CREDIT_TITLE,
  SUCCESS_PRO_REPORT_UNLOCKED_BODY,
  SUCCESS_PRO_REPORT_UNLOCKED_TITLE,
} from '@/lib/billing/checkoutSuccessCopy'

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [phase, setPhase] = useState<'loading' | 'ok' | 'error'>('loading')
  const [successKind, setSuccessKind] = useState<'pro_report' | 'pro_report_credit' | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [confirmAttempt, setConfirmAttempt] = useState(0)
  const paymentReportedRef = useRef(false)
  const paymentPendingRetryCountRef = useRef(0)

  useEffect(() => {
    paymentPendingRetryCountRef.current = 0
  }, [sessionId])

  useEffect(() => {
    if (phase !== 'ok' || !successKind) return
    if (paymentReportedRef.current) return
    paymentReportedRef.current = true
    trackEvent('payment_success', {
      product: successKind === 'pro_report_credit' ? 'pro_report_credit' : 'pro_report',
    })
  }, [phase, successKind])

  useEffect(() => {
    if (!sessionId?.trim()) {
      setPhase('error')
      setMessage('Missing checkout session. Start checkout again from the analyzer or pricing page.')
      return
    }

    let cancelled = false
    let paymentRetryTimeoutId: number | undefined

    paymentReportedRef.current = false
    setPhase('loading')
    setSuccessKind(null)
    setAnalysisId(null)

    fetch(`/api/billing/confirm-session?session_id=${encodeURIComponent(sessionId.trim())}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          ok?: boolean
          type?: string
          analysisId?: string
          error?: string
          code?: string
        }
        if (!res.ok) {
          if (
            res.status === 409 &&
            data.code === 'STRIPE_PAYMENT_PENDING' &&
            paymentPendingRetryCountRef.current < 6
          ) {
            paymentPendingRetryCountRef.current += 1
            paymentRetryTimeoutId = window.setTimeout(() => {
              if (!cancelled) setConfirmAttempt((x) => x + 1)
            }, Math.min(500 + paymentPendingRetryCountRef.current * 450, 3000))
            return
          }
          throw new Error(typeof data.error === 'string' ? data.error : 'Verification failed.')
        }
        if (cancelled) return

        if (data.type === 'monthly_pro') {
          window.location.replace(
            `/checkout/subscription-success?session_id=${encodeURIComponent(sessionId.trim())}`
          )
          return
        }

        if (data.type === 'pro_report_credit') {
          setSuccessKind('pro_report_credit')
          setAnalysisId(null)
          setPhase('ok')
          return
        }

        if (data.type !== 'pro_report' || typeof data.analysisId !== 'string') {
          throw new Error('Unexpected checkout confirmation — contact support if you were charged.')
        }

        setSuccessKind('pro_report')
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
      if (paymentRetryTimeoutId !== undefined) window.clearTimeout(paymentRetryTimeoutId)
    }
  }, [sessionId, confirmAttempt])

  useEffect(() => {
    if (phase !== 'ok') return

    if (successKind === 'pro_report_credit') {
      const t = window.setTimeout(() => window.location.replace('/analyze'), 2200)
      return () => window.clearTimeout(t)
    }

    if (!analysisId) return
    const t = window.setTimeout(() => {
      window.location.href = `/analyze?pro=${encodeURIComponent(analysisId)}`
    }, 2000)
    return () => window.clearTimeout(t)
  }, [phase, successKind, analysisId])

  const handleRetryConfirm = () => {
    paymentReportedRef.current = false
    paymentPendingRetryCountRef.current = 0
    setConfirmAttempt((x) => x + 1)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(167,139,246,0.14),_transparent_32%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-8 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl">
          {phase === 'loading' ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
                {CHECKOUT_CONFIRM_LOADING_PAYMENT_TITLE}
              </div>
              <h1 className="text-2xl font-semibold text-white">Hang tight…</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{CHECKOUT_CONFIRM_LOADING_PAYMENT_BODY}</p>
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
              <h1 className="text-2xl font-semibold text-white">
                {successKind === 'pro_report_credit' ? SUCCESS_PRO_REPORT_CREDIT_TITLE : SUCCESS_PRO_REPORT_UNLOCKED_TITLE}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                {successKind === 'pro_report_credit'
                  ? SUCCESS_PRO_REPORT_CREDIT_BODY
                  : SUCCESS_PRO_REPORT_UNLOCKED_BODY}
              </p>
              {successKind === 'pro_report_credit' ? (
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  We saved a secure prepaid credit on this browser. After you open the analyzer, your next paid run unlocks automatically when the AI completes—no separate unlock step needed.
                </p>
              ) : null}
              {analysisId ? (
                <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 font-mono text-xs text-slate-500">
                  Session · {analysisId.slice(0, 8)}…
                </p>
              ) : null}
              <Link
                href={
                  analysisId && successKind === 'pro_report'
                    ? `/analyze?pro=${encodeURIComponent(analysisId)}`
                    : '/analyze'
                }
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
              >
                Go to analyzer
              </Link>
            </>
          ) : null}

          {phase === 'error' ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200">
                Could not confirm
              </div>
              <h1 className="text-2xl font-semibold text-white">We could not finish activation yet</h1>
              <p className="mt-3 text-sm leading-relaxed text-rose-200/90">{message}</p>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Activation runs from our server using Stripe—we do not need your webhook to succeed for this screen. Try
                again in a moment, or reopen this page from Stripe’s confirmation email link (same checkout session URL).
              </p>
              <button
                type="button"
                onClick={handleRetryConfirm}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
              >
                Try verifying again
              </button>
              <Link
                href="/analyze"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-600 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
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
