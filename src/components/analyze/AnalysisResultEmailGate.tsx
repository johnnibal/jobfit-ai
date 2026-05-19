'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
 EMAIL_CAPTURE_CONSENT_LABEL,
 EMAIL_CAPTURE_CONSENT_VERSION,
} from '@/lib/growth/emailCaptureConsent'
import { btnPrimary, btnSecondary, card, cardPadding, inputSurface, labelCaps, textLink, textMuted } from '@/components/ui/theme'

type Props = {
 analysisId: string
 onRelease: (opts: { emailSaveNotice: string | null }) => void
}

export function AnalysisResultEmailGate({ analysisId, onRelease }: Props) {
 const [email, setEmail] = useState('')
 const [consent, setConsent] = useState(false)
 const [busy, setBusy] = useState(false)
 const [err, setErr] = useState<string | null>(null)

 const continueWithoutEmail = () => {
 onRelease({ emailSaveNotice: null })
 }

 const sendReport = async () => {
 setErr(null)
 const trimmed = email.trim()
 if (!trimmed) {
 setErr('Enter your email above, or use “Continue without email”.')
 return
 }
 if (!consent) {
 setErr(
 'Please tick the consent box to receive your report by email, or choose “Continue without email”.'
 )
 return
 }

 setBusy(true)
 try {
 const res = await fetch('/api/growth/email-capture', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 email: trimmed,
 consentReportAndUpdates: true,
 consentCopyVersion: EMAIL_CAPTURE_CONSENT_VERSION,
 analysisId,
 }),
 })
 const data = (await res.json()) as { error?: string }
 if (!res.ok) {
 const msg =
 typeof data.error === 'string' ? data.error : 'Could not save your email right now.'
 onRelease({
 emailSaveNotice: `${msg} Your full result is below. Nothing was stored without a successful save.`,
 })
 return
 }
 onRelease({
 emailSaveNotice:
 'Thanks. We saved your email and consent. Your full application report is below.',
 })
 } catch {
 onRelease({
 emailSaveNotice:
 'We could not reach the server to save your email. Your full result is below. Use “Continue without email” next time if you prefer not to share it.',
 })
 } finally {
 setBusy(false)
 }
 }

 return (
 <div className={`${card} ${cardPadding}`}>
 <h3 className="text-lg font-semibold text-onyx sm:text-xl">
 Where should we send your application report?
 </h3>
 <p className={`mt-2 text-sm leading-relaxed ${textMuted}`}>
 Optional. You can view your full free result on this page either way. We only store your email if you submit the
 form with consent below (lawful basis: consent under data protection rules that apply to us; see{' '}
 <Link href="/privacy" className={textLink}>
 Privacy
 </Link>
 ). Unsubscribe or deletion requests can be handled when we contact you; we do not add you to marketing lists
 without this checkbox.
 </p>

 <div className="mt-5 space-y-4">
 <label className={`block ${labelCaps}`}>
 Email address
 <input
 type="email"
 name="growth-email"
 autoComplete="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 disabled={busy}
 className={`mt-2 ${inputSurface} text-sm disabled:opacity-60`}
 placeholder="you@example.com"
 />
 </label>

 <label className={`flex cursor-pointer items-start gap-3 text-sm leading-relaxed ${textMuted}`}>
 <input
 type="checkbox"
 checked={consent}
 onChange={(e) => setConsent(e.target.checked)}
 disabled={busy}
 className="mt-1 h-4 w-4 shrink-0 rounded border-ash/60 text-onyx focus:ring-brick/20 disabled:opacity-60"
 />
 <span>{EMAIL_CAPTURE_CONSENT_LABEL}</span>
 </label>
 </div>

 {err ? (
 <p className="mt-4 text-sm leading-relaxed text-amber-800" role="alert">
 {err}
 </p>
 ) : null}

 <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
 <button
 type="button"
 onClick={continueWithoutEmail}
 disabled={busy}
 className={`${btnSecondary} flex-1 px-6 py-3 sm:flex-none disabled:cursor-not-allowed disabled:opacity-60`}
 >
 Continue without email
 </button>
 <button
 type="button"
 onClick={() => void sendReport()}
 disabled={busy}
 className={`${btnPrimary} flex-1 px-6 py-3 sm:flex-none disabled:cursor-not-allowed disabled:opacity-60`}
 >
 {busy ? 'Saving…' : 'Send me my report'}
 </button>
 </div>
 </div>
 )
}
