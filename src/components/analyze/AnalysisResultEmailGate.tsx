'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  EMAIL_CAPTURE_CONSENT_LABEL,
  EMAIL_CAPTURE_CONSENT_VERSION,
} from '@/lib/growth/emailCaptureConsent'

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
        'Please tick the consent box to receive your report by email — or choose “Continue without email”.'
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
          emailSaveNotice: `${msg} Your full result is below — nothing was stored without a successful save.`,
        })
        return
      }
      onRelease({
        emailSaveNotice:
          'Thanks — we saved your email and consent. Your full application report is below.',
      })
    } catch {
      onRelease({
        emailSaveNotice:
          'We could not reach the server to save your email. Your full result is below — use “Continue without email” next time if you prefer not to share it.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[28px] border border-cyan-400/20 bg-slate-950/80 p-6 shadow-[0_0_48px_rgba(15,23,42,0.85)] backdrop-blur-xl sm:p-8">
      <h3 className="text-lg font-semibold text-cyan-200 sm:text-xl">
        Where should we send your application report?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Optional — you can view your full free result on this page either way. We only store your email if you submit the
        form with consent below (lawful basis: consent under data protection rules that apply to us — see{' '}
        <Link href="/privacy" className="text-cyan-400/90 underline-offset-2 hover:text-cyan-300 hover:underline">
          Privacy
        </Link>
        ). Unsubscribe or deletion requests can be handled when we contact you; we do not add you to marketing lists
        without this checkbox.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Email address
          <input
            type="email"
            name="growth-email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400/30 placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 disabled:opacity-60"
            placeholder="you@example.com"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-300">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={busy}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-cyan-500 focus:ring-cyan-400/40 disabled:opacity-60"
          />
          <span>{EMAIL_CAPTURE_CONSENT_LABEL}</span>
        </label>
      </div>

      {err ? (
        <p className="mt-4 text-sm leading-relaxed text-amber-200/95" role="alert">
          {err}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={continueWithoutEmail}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-600 bg-transparent px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
        >
          Continue without email
        </button>
        <button
          type="button"
          onClick={() => void sendReport()}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] hover:shadow-[0_0_24px_rgba(56,189,248,0.28)] disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
        >
          {busy ? 'Saving…' : 'Send me my report'}
        </button>
      </div>
    </div>
  )
}
