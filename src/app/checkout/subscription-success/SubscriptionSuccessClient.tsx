'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/track'
import {
 SUCCESS_MONTHLY_PRO_ACTIVE_BODY,
 SUCCESS_MONTHLY_PRO_ACTIVE_TITLE,
 SUCCESS_SUBSCRIPTION_LOADING_BODY,
} from '@/lib/billing/checkoutSuccessCopy'
import { btnPrimary } from '@/components/ui/theme'

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
 <main className="min-h-screen bg-zinc-50 text-zinc-900">
 <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
 <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm ">
 {phase === 'loading' ? (
 <>
 <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
 Confirming subscription
 </div>
 <h1 className="text-2xl font-semibold text-zinc-900">Almost there…</h1>
 <p className="mt-3 text-sm leading-relaxed text-zinc-600">{SUCCESS_SUBSCRIPTION_LOADING_BODY}</p>
 <div className="mt-8 flex gap-2">
 <div className="h-2 flex-1 rounded-full bg-zinc-100" />
 <div className="h-2 w-16 rounded-full bg-zinc-100" />
 </div>
 </>
 ) : null}

 {phase === 'ok' ? (
 <>
 <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-800">
 Subscription active
 </div>
 <h1 className="text-2xl font-semibold text-zinc-900">{SUCCESS_MONTHLY_PRO_ACTIVE_TITLE}</h1>
 <p className="mt-3 text-sm leading-relaxed text-zinc-600">{SUCCESS_MONTHLY_PRO_ACTIVE_BODY}</p>
 <Link
 href="/analyze?sub=1"
 className={`${btnPrimary} mt-8 w-full px-6 py-3`}
 >
 Open analyzer
 </Link>
 </>
 ) : null}

 {phase === 'error' ? (
 <>
 <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-red-800">
 Could not confirm
 </div>
 <h1 className="text-2xl font-semibold text-zinc-900">Something went wrong</h1>
 <p className="mt-3 text-sm leading-relaxed text-red-800">{message}</p>
 <Link
 href="/analyze"
 className="mt-8 inline-flex w-full min-h-[44px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
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
