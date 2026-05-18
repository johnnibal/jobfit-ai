import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import {
  COPY_PRO_REPORT_INCLUDES,
  COPY_PRO_REPORT_ONELINE,
  PRICE_PRO_REPORT_EUR,
} from '@/lib/planTypes'
import {
  ProReportLandingPrimaryCtas,
  ProReportLandingPricePrimaryCta,
} from '@/components/marketing/ProReportLandingCtas'

export const metadata: Metadata = {
  title: 'Pro Report — JobFit AI',
  description:
    'One paid analysis plus full CV–job report: ATS checklist, cover letter, and PDF export. €4.99 one-time (not a subscription).',
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function InclusionItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-slate-300">
      <CheckIcon />
      <span>{children}</span>
    </li>
  )
}

function FaqItem({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4 backdrop-blur">
      <h3 className="font-semibold text-slate-100">{q}</h3>
      <div className="mt-2 text-sm leading-relaxed text-slate-400">{children}</div>
    </div>
  )
}

export default function ProReportSalesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(167,139,246,0.18),_transparent_30%)]" />
      <div className="absolute left-10 top-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-24 right-8 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" />

      <div className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-28 lg:pt-14">
        <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white transition hover:text-cyan-200"
          >
            <span className="h-2 w-2 rounded-full bg-violet-400" aria-hidden />
            JobFit AI
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm font-medium">
            <Link
              href="/analyze"
              className="rounded-full border border-violet-400/35 bg-violet-500/10 px-4 py-2 text-violet-100 transition hover:border-violet-400/55 hover:bg-violet-500/15"
            >
              Analyzer
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-slate-200 backdrop-blur transition hover:border-cyan-400/35 hover:text-white"
            >
              All plans
            </Link>
          </nav>
        </header>

        {/* 1–2 · Hero */}
        <section className="text-center sm:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-200">
            Pro Report · one-time
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">Pro Report · full detail for one application</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300 sm:mx-0">
            <span className="text-slate-200">{COPY_PRO_REPORT_ONELINE}</span> {COPY_PRO_REPORT_INCLUDES}
          </p>

          <ProReportLandingPrimaryCtas />
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Paid securely via Stripe ({PRICE_PRO_REPORT_EUR} one-time). You can start from the analyzer with a free run, or{' '}
            <span className="text-slate-400">buy now</span> to fund your next paid Pro analysis on this browser.
          </p>
        </section>

        {/* 3 · What is included */}
        <section className="mt-16 lg:mt-20" aria-labelledby="included-heading">
          <div className="rounded-[28px] border border-violet-400/25 bg-gradient-to-br from-violet-950/40 via-slate-950/90 to-slate-900/70 p-8 shadow-[0_0_60px_rgba(139,92,246,0.12)] backdrop-blur-xl sm:p-10">
            <h2 id="included-heading" className="text-xl font-semibold text-white sm:text-2xl">
              What is included
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              When you unlock (or prepaid), everything that stays blurred on Free opens for{' '}
              <span className="text-slate-300">one successful analysis session</span> — not a rolling subscription.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              <InclusionItem>Full fit analysis</InclusionItem>
              <InclusionItem>All improvement suggestions</InclusionItem>
              <InclusionItem>Recruiter red flags</InclusionItem>
              <InclusionItem>ATS keyword checklist</InclusionItem>
              <InclusionItem>Tailored cover letter</InclusionItem>
              <InclusionItem>PDF export</InclusionItem>
            </ul>
          </div>
        </section>

        {/* 4 · Who it is for */}
        <section className="mt-14 lg:mt-16" aria-labelledby="who-heading">
          <h2 id="who-heading" className="text-xl font-semibold text-white sm:text-2xl">
            Who it is for
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-300">
            <li className="flex gap-2">
              <span className="text-cyan-400" aria-hidden>
                ·
              </span>
              Applying for an important job
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400" aria-hidden>
                ·
              </span>
              International job seekers in Germany
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400" aria-hidden>
                ·
              </span>
              People who want to improve their CV before applying
            </li>
          </ul>
        </section>

        {/* 5–6 · Price + CTA */}
        <section className="mt-14 lg:mt-16" aria-labelledby="price-heading">
          <div
            id="price-heading"
            className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-8 text-center shadow-[0_0_48px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Price</p>
            <p className="mt-3 flex flex-wrap items-baseline justify-center gap-2 tabular-nums">
              <span className="text-5xl font-bold text-white">€{PRICE_PRO_REPORT_EUR}</span>
              <span className="text-base font-medium text-violet-200/85">one-time</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {COPY_PRO_REPORT_ONELINE} · €{PRICE_PRO_REPORT_EUR} one-time · {COPY_PRO_REPORT_INCLUDES}
            </p>
            <div className="mt-8 flex justify-center">
              <ProReportLandingPricePrimaryCta />
            </div>
          </div>
        </section>

        {/* 7 · FAQ */}
        <section className="mt-16 lg:mt-20" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-center text-xl font-semibold text-white sm:text-2xl">
            FAQ
          </h2>
          <div className="mt-8 space-y-4">
            <FaqItem q="Is this a subscription?">
              <p>
                No. Pro Report is a one-time €{PRICE_PRO_REPORT_EUR} payment — either for your current analyzer result
                (“unlock”), or prepaid as a browser credit so your next paid run unlocks automatically.
              </p>
              <p className="mt-2">
                Want ongoing quota and saved reports? See{' '}
                <Link href="/pricing" className="text-cyan-400 underline-offset-2 hover:underline">
                  Monthly Pro on the pricing page
                </Link>
                .
              </p>
            </FaqItem>
            <FaqItem q="Can I edit the result?">
              <p>
                Yes. AI output is meant as a draft you control — tweak suggestions and the cover letter before you send
                anything to employers.
              </p>
            </FaqItem>
            <FaqItem q="Does this guarantee a job?">
              <p>
                No. JobFit AI cannot guarantee interviews or offers. It helps you see fit and improve your materials;
                outcomes depend on many factors outside the tool.
              </p>
            </FaqItem>
            <FaqItem q="Is my CV private?">
              <p>
                Your CV and job text are used to generate your analysis. We do not use them to train public models for
                third parties unless we say so in a clear, separate notice. For details, read our{' '}
                <Link href="/privacy" className="text-cyan-400 underline-offset-2 hover:underline">
                  Privacy
                </Link>{' '}
                page.
              </p>
            </FaqItem>
          </div>
        </section>

        <footer className="mt-16 border-t border-slate-800 pt-8 text-center text-xs text-slate-600">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/" className="hover:text-cyan-400">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-cyan-400">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-cyan-400">
              Terms
            </Link>
            <Link href="/refund-policy" className="hover:text-cyan-400">
              Refunds
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  )
}
