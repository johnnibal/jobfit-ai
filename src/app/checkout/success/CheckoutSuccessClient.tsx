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
import { btnPrimary } from '@/components/ui/theme'

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
 debugReason?: string
 bindSubtype?: string
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
 let errMsg = typeof data.error === 'string' ? data.error : 'Verification failed.'
 if (typeof data.debugReason === 'string' && data.debugReason.trim()) {
 errMsg += `\n\nTechnical (diagnostics):\n${data.debugReason}`
 }
 if (typeof data.bindSubtype === 'string' && data.bindSubtype.trim()) {
 errMsg += `\n(bindSubtype: ${data.bindSubtype})`
 }
 throw new Error(errMsg)
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
 throw new Error('Unexpected checkout confirmation. Contact support if you were charged.')
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
 <main className="min-h-screen bg-zinc-50 text-zinc-900">
 <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
 <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm ">
 {phase === 'loading' ? (
 <>
 <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
 {CHECKOUT_CONFIRM_LOADING_PAYMENT_TITLE}
 </div>
 <h1 className="text-2xl font-semibold text-zinc-900">Hang tight…</h1>
 <p className="mt-3 text-sm leading-relaxed text-zinc-600">{CHECKOUT_CONFIRM_LOADING_PAYMENT_BODY}</p>
 <div className="mt-8 flex gap-2">
 <div className="h-2 flex-1 rounded-full bg-zinc-100" />
 <div className="h-2 w-16 rounded-full bg-blue-50" />
 </div>
 </>
 ) : null}

 {phase === 'ok' ? (
 <>
 <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-800">
 Payment successful
 </div>
 <h1 className="text-2xl font-semibold text-zinc-900">
 {successKind === 'pro_report_credit' ? SUCCESS_PRO_REPORT_CREDIT_TITLE : SUCCESS_PRO_REPORT_UNLOCKED_TITLE}
 </h1>
 <p className="mt-3 text-sm leading-relaxed text-zinc-600">
 {successKind === 'pro_report_credit'
 ? SUCCESS_PRO_REPORT_CREDIT_BODY
 : SUCCESS_PRO_REPORT_UNLOCKED_BODY}
 </p>
 {successKind === 'pro_report_credit' ? (
 <p className="mt-4 text-xs leading-relaxed text-zinc-500">
 We saved a secure prepaid credit on this browser. After you open the analyzer, your next paid run unlocks automatically when the AI completes. No separate unlock step is needed.
 </p>
 ) : null}
 {analysisId ? (
 <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-xs text-zinc-500">
 Session · {analysisId.slice(0, 8)}…
 </p>
 ) : null}
 <Link
 href={
 analysisId && successKind === 'pro_report'
 ? `/analyze?pro=${encodeURIComponent(analysisId)}`
 : '/analyze'
 }
 className={`${btnPrimary} mt-8 w-full px-6 py-3`}
 >
 Go to analyzer
 </Link>
 </>
 ) : null}

 {phase === 'error' ? (
 <>
 <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-red-800">
 Could not confirm
 </div>
 <h1 className="text-2xl font-semibold text-zinc-900">We could not finish activation yet</h1>
 <p className="mt-3 text-sm leading-relaxed text-red-800">{message}</p>
 <p className="mt-4 text-xs leading-relaxed text-zinc-500">
 Activation runs from our server using Stripe. We do not need your webhook to succeed for this screen. Try
 again in a moment, or reopen this page from Stripe’s confirmation email link (same checkout session URL).
 </p>
 <button
 type="button"
 onClick={handleRetryConfirm}
 className={`${btnPrimary} mt-6 w-full px-6 py-3`}
 >
 Try verifying again
 </button>
 <Link
 href="/analyze"
 className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
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
