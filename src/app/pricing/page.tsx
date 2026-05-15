import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import {
  FREE_ANALYSES_PER_DAY,
  MONTHLY_PRO_ANALYSES_PER_MONTH,
  PRICE_MONTHLY_PRO_EUR,
  PRICE_PRO_REPORT_EUR,
} from '@/lib/planTypes'

export const metadata: Metadata = {
  title: 'Pricing — JobFit AI',
  description: 'Simple pricing for CV and job fit analysis. Free tier, Pro Report, and Monthly Pro.',
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400 lg:h-4 lg:w-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function FeatureItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-slate-300 lg:gap-2.5 lg:text-[0.8125rem] lg:leading-snug">
      <CheckIcon />
      <span>{children}</span>
    </li>
  )
}

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.18),_transparent_30%)]" />
      <div className="absolute left-10 top-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-12 right-12 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-28 lg:pt-7">
        {/* First screen: pricing hero + cards; testimonials start below the fold */}
        <div className="flex min-h-[100dvh] flex-col">
          <header className="mb-6 flex w-full shrink-0 flex-col gap-5 sm:mb-6 sm:flex-row sm:items-center sm:justify-between lg:mb-4">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 text-lg font-semibold tracking-tight text-white transition hover:text-cyan-200"
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400" aria-hidden />
              JobFit AI
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-sm font-medium sm:justify-end">
              <Link
                href="/"
                className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-slate-200 backdrop-blur transition hover:border-slate-600 hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/analyze"
                className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-cyan-100 transition hover:border-cyan-400/55 hover:bg-cyan-500/15"
              >
                Analyze CV
              </Link>
            </nav>
          </header>

          {/* Vertically centers hero + cards on large screens; stacks from top on mobile if content is tall */}
          <div className="flex min-h-0 flex-1 flex-col justify-start py-3 sm:py-5 lg:justify-center lg:py-6">
          {/* Hero — centered column */}
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-1 text-center sm:px-2">
            <div className="mb-4 flex justify-center lg:mb-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-900/70 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur lg:px-3 lg:py-1.5 lg:text-xs">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Transparent pricing
              </span>
            </div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[2.35rem] lg:leading-[1.15] xl:text-5xl">
              Choose your{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                JobFit plan
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-slate-400 lg:mt-4 lg:text-base lg:leading-relaxed">
              Start free, unlock a full Pro Report for one role, or subscribe to Monthly Pro when you are applying often.
              Checkout is secured with Stripe — pay only when you upgrade.
            </p>
          </div>

          {/* Cards — centered single column on small screens; full row from lg */}
          <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-1 justify-items-stretch gap-8 pt-4 sm:max-w-xl sm:px-2 lg:mt-6 lg:max-w-6xl lg:grid-cols-3 lg:items-stretch lg:gap-6 lg:px-0 lg:pt-3 xl:gap-8">
          {/* Free */}
          <article className="flex min-w-0 flex-col rounded-[28px] border border-slate-800 bg-slate-900/70 p-7 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-8 lg:rounded-2xl lg:p-6">
            <div className="mb-6 lg:mb-4">
              <h2 className="text-lg font-semibold text-slate-100 lg:text-base">Free</h2>
              <p className="mt-3 flex items-baseline gap-1 lg:mt-2">
                <span className="text-4xl font-bold tabular-nums text-white lg:text-3xl">€0</span>
              </p>
              <p className="mt-2 text-sm text-slate-500 lg:text-xs">Always available · no card required</p>
            </div>
            <ul className="flex flex-1 flex-col gap-3 lg:gap-2">
              <FeatureItem>
                {FREE_ANALYSES_PER_DAY} CV/job analysis per day
              </FeatureItem>
              <FeatureItem>Fit score</FeatureItem>
              <FeatureItem>Short summary</FeatureItem>
              <FeatureItem>3 improvement suggestions</FeatureItem>
              <FeatureItem>Basic missing skills</FeatureItem>
            </ul>
            <Link
              href="/analyze"
              className="mt-8 inline-flex w-full min-h-[44px] items-center justify-center rounded-full border border-slate-600 bg-slate-950/80 px-6 py-3 text-center text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 lg:mt-6 lg:min-h-0 lg:py-2.5 lg:text-[13px]"
            >
              Start Free
            </Link>
          </article>

          {/* Pro Report — recommended */}
          <article className="relative flex min-w-0 flex-col rounded-[28px] border-2 border-violet-400/45 bg-gradient-to-b from-violet-950/50 via-slate-900/90 to-slate-900/70 p-7 shadow-[0_0_80px_rgba(139,92,246,0.22),0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-xl sm:p-8 lg:z-10 lg:rounded-2xl lg:p-6 lg:shadow-[0_0_48px_rgba(139,92,246,0.18)]">
            <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 justify-center lg:-top-2.5">
              <span className="rounded-full border border-violet-400/40 bg-gradient-to-r from-violet-500/90 to-cyan-500/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-lg lg:px-3 lg:py-0.5 lg:text-[0.625rem]">
                Recommended
              </span>
            </div>
            <div className="mb-6 mt-3 lg:mb-4 lg:mt-2">
              <h2 className="text-lg font-semibold text-white lg:text-base">Pro Report</h2>
              <p className="mt-3 flex flex-wrap items-baseline gap-2 lg:mt-2">
                <span className="text-4xl font-bold tabular-nums text-white lg:text-3xl">€{PRICE_PRO_REPORT_EUR}</span>
                <span className="text-sm font-medium text-violet-200/90 lg:text-xs">one-time</span>
              </p>
              <p className="mt-2 text-sm text-violet-200/70 lg:text-xs">Deep dive for one application</p>
              <Link
                href="/pro-report"
                className="mt-3 inline-block text-xs font-medium text-cyan-400/90 underline-offset-2 hover:text-cyan-300 hover:underline lg:mt-2"
              >
                See Pro Report overview →
              </Link>
            </div>
            <ul className="flex flex-1 flex-col gap-3 lg:gap-2">
              <FeatureItem>Full AI analysis</FeatureItem>
              <FeatureItem>All CV improvement suggestions</FeatureItem>
              <FeatureItem>ATS keyword checklist</FeatureItem>
              <FeatureItem>Tailored cover letter</FeatureItem>
              <FeatureItem>PDF export</FeatureItem>
              <FeatureItem>Best for one job application</FeatureItem>
            </ul>
            <Link
              href="/analyze"
              className="mt-8 inline-flex w-full min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-center text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(139,92,246,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(56,189,248,0.4)] lg:mt-6 lg:min-h-0 lg:py-2.5 lg:text-[13px]"
            >
              Unlock Pro Report
            </Link>
          </article>

          {/* Monthly Pro */}
          <article className="flex min-w-0 flex-col rounded-[28px] border border-slate-800 bg-slate-900/70 p-7 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-8 lg:rounded-2xl lg:p-6">
            <div className="mb-6 lg:mb-4">
              <h2 className="text-lg font-semibold text-slate-100 lg:text-base">Monthly Pro</h2>
              <p className="mt-3 flex flex-wrap items-baseline gap-2 lg:mt-2">
                <span className="text-4xl font-bold tabular-nums text-white lg:text-3xl">€{PRICE_MONTHLY_PRO_EUR}</span>
                <span className="text-sm font-medium text-slate-400 lg:text-xs">/month</span>
              </p>
              <p className="mt-2 text-sm text-slate-500 lg:text-xs">For steady applications</p>
            </div>
            <ul className="flex flex-1 flex-col gap-3 lg:gap-2">
              <FeatureItem>Up to {MONTHLY_PRO_ANALYSES_PER_MONTH} analyses / month (UTC)</FeatureItem>
              <FeatureItem>Saved reports</FeatureItem>
              <FeatureItem>Cover letters</FeatureItem>
              <FeatureItem>PDF exports</FeatureItem>
              <FeatureItem>Full ATS optimization</FeatureItem>
              <FeatureItem>Best for active job seekers</FeatureItem>
            </ul>
            <Link
              href="/analyze"
              className="mt-8 inline-flex w-full min-h-[44px] items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 px-6 py-3 text-center text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/55 hover:bg-cyan-500/15 lg:mt-6 lg:min-h-0 lg:py-2.5 lg:text-[13px]"
            >
              Go Pro
            </Link>
          </article>
        </div>
          </div>
        </div>

        <TestimonialsSection
          idPrefix="pricing"
          compactTop
          className="mx-auto max-w-6xl pt-10 lg:pt-12"
        />

        <section className="mx-auto mt-20 max-w-3xl lg:mt-16" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-center text-2xl font-semibold text-white sm:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-center text-sm text-slate-500">
            Straight answers before you commit — no surprises at checkout.
          </p>

          <dl className="mt-10 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-5 backdrop-blur sm:px-6">
              <dt className="font-semibold text-slate-100">Can I use it for German jobs?</dt>
              <dd className="mt-3 text-sm leading-relaxed text-slate-400">
                Yes. Paste German job descriptions and CV text — the analyzer focuses on overlap between what you wrote
                and what the employer asks for, regardless of language. Results follow the language of your inputs.
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-5 backdrop-blur sm:px-6">
              <dt className="font-semibold text-slate-100">Is my CV private?</dt>
              <dd className="mt-3 text-sm leading-relaxed text-slate-400">
                Your CV and job text are sent only to generate your analysis. We do not train public models on your data.
                See our{' '}
                <Link href="/privacy" className="text-cyan-400 underline-offset-2 hover:underline">
                  Privacy
                </Link>{' '}
                policy for details on retention and your rights.
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-5 backdrop-blur sm:px-6">
              <dt className="font-semibold text-slate-100">Can I cancel Monthly Pro?</dt>
              <dd className="mt-3 text-sm leading-relaxed text-slate-400">
                Yes. Monthly Pro is a subscription billed through Stripe. You can cancel before renewal anytime from the
                customer billing portal linked after checkout.
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-5 backdrop-blur sm:px-6">
              <dt className="font-semibold text-slate-100">Is this useful for international job seekers in Germany?</dt>
              <dd className="mt-3 text-sm leading-relaxed text-slate-400">
                Very often, yes. It highlights whether your CV reflects what German postings emphasize — tools, seniority,
                language hints, and domain keywords — so you can adapt before you apply.
              </dd>
            </div>
          </dl>
        </section>

        <footer className="mx-auto mt-20 max-w-3xl border-t border-slate-800 pt-10 text-center text-xs leading-relaxed text-slate-600">
          <p>
            Prices shown in EUR. Taxes may apply at checkout. Feature availability follows your active plan after purchase.
          </p>
          <nav className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
            <Link href="/privacy" className="hover:text-cyan-400">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-cyan-400">
              Terms
            </Link>
            <Link href="/refund-policy" className="hover:text-cyan-400">
              Refunds
            </Link>
            <Link href="/imprint" className="hover:text-cyan-400">
              Imprint
            </Link>
          </nav>
          <Link href="/" className="mt-5 inline-block text-slate-500 transition hover:text-cyan-400">
            ← JobFit AI home
          </Link>
        </footer>
      </div>
    </main>
  )
}
