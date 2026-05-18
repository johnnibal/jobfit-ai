import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import { MonthlyProCheckoutButton, ProReportCheckoutButton } from '@/components/billing/PlanStripeCheckoutButtons'
import {
  MONTHLY_PRO_ANALYSES_PER_MONTH,
  PRICE_MONTHLY_PRO_EUR,
  PRICE_PRO_REPORT_EUR,
} from '@/lib/planTypes'
import { btnPrimary, btnSecondary } from '@/components/ui/theme'

export const metadata: Metadata = {
  title: 'Pricing · JobFit AI',
  description: 'Free CV fit analysis, Pro Report at €4.99, or Monthly Pro at €9.99/month. Pay through Stripe when you upgrade.',
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500"
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
    <li className="flex gap-2.5 text-sm leading-relaxed text-zinc-700">
      <CheckIcon />
      <span>{children}</span>
    </li>
  )
}

const planCard =
  'flex min-w-0 flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-zinc-900 transition hover:text-zinc-600"
          >
            JobFit AI
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Link href="/" className={`${btnSecondary} min-h-0 px-4 py-2`}>
              Home
            </Link>
            <Link href="/analyze" className={`${btnPrimary} min-h-0 px-4 py-2`}>
              Analyze CV
            </Link>
          </nav>
        </header>

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Simple pricing
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
            Start free. Pay only when you need a full report or apply to many roles in a month. Checkout is
            handled by Stripe.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch lg:gap-5">
          {/* Free */}
          <article className={planCard}>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-zinc-900">Free</h2>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tabular-nums text-zinc-900">€0</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">No card required</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2.5">
              <FeatureItem>1 free analysis per day</FeatureItem>
              <FeatureItem>Basic score and preview</FeatureItem>
            </ul>
            <Link href="/analyze" className={`${btnSecondary} mt-6 w-full`}>
              Start free
            </Link>
          </article>

          {/* Pro Report (recommended) */}
          <article className={`${planCard} relative border-zinc-400`}>
            <span className="absolute -top-2.5 left-4 rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
              Recommended
            </span>
            <div className="mb-5 pt-1">
              <h2 className="text-base font-semibold text-zinc-900">Pro Report</h2>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-3xl font-semibold tabular-nums text-zinc-900">€{PRICE_PRO_REPORT_EUR}</span>
                <span className="text-sm text-zinc-500">one-time</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">One application, full report</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2.5">
              <FeatureItem>One paid analysis</FeatureItem>
              <FeatureItem>Full report for one application</FeatureItem>
              <FeatureItem>ATS checklist</FeatureItem>
              <FeatureItem>Cover letter</FeatureItem>
              <FeatureItem>PDF export</FeatureItem>
            </ul>
            <div className="mt-6">
              <ProReportCheckoutButton analyticsSurface="pricing_page_pro_report">
                Buy Pro Report
              </ProReportCheckoutButton>
            </div>
            <Link
              href="/pro-report"
              className="mt-3 block text-center text-xs text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
            >
              What is Pro Report?
            </Link>
          </article>

          {/* Monthly Pro */}
          <article className={planCard}>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-zinc-900">Monthly Pro</h2>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-3xl font-semibold tabular-nums text-zinc-900">€{PRICE_MONTHLY_PRO_EUR}</span>
                <span className="text-sm text-zinc-500">/month</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">Best for active job seekers</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2.5">
              <FeatureItem>{MONTHLY_PRO_ANALYSES_PER_MONTH} analyses per month</FeatureItem>
              <FeatureItem>Saved reports</FeatureItem>
              <FeatureItem>Full premium features</FeatureItem>
              <FeatureItem>Cancel anytime from the billing portal</FeatureItem>
            </ul>
            <div className="mt-6">
              <MonthlyProCheckoutButton analyticsSurface="pricing_page_monthly_pro">
                Subscribe Monthly Pro
              </MonthlyProCheckoutButton>
            </div>
          </article>
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-zinc-500">
          Prices in EUR. Taxes may apply at checkout. Your plan controls which features unlock after payment.
        </p>

        <TestimonialsSection idPrefix="pricing" compactTop className="mx-auto max-w-6xl pt-14" />

        <section className="mx-auto mt-16 max-w-2xl" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-center text-xl font-semibold text-zinc-900">
            Common questions
          </h2>

          <dl className="mt-8 space-y-3">
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
              <dt className="text-sm font-medium text-zinc-900">Can I use this for German job postings?</dt>
              <dd className="mt-2 text-sm leading-relaxed text-zinc-600">
                Yes. Paste German or English CV and job text. The analyzer compares what you wrote with what the
                employer asks for.
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
              <dt className="text-sm font-medium text-zinc-900">Is my CV private?</dt>
              <dd className="mt-2 text-sm leading-relaxed text-zinc-600">
                Your text is used only to generate your analysis. We do not train public models on it. See our{' '}
                <Link href="/privacy" className="text-zinc-800 underline-offset-2 hover:underline">
                  Privacy
                </Link>{' '}
                policy for retention and your rights.
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
              <dt className="text-sm font-medium text-zinc-900">Can I cancel Monthly Pro?</dt>
              <dd className="mt-2 text-sm leading-relaxed text-zinc-600">
                Yes. Billing runs through Stripe. Cancel before your next renewal from the customer portal linked
                after checkout.
              </dd>
            </div>
          </dl>
        </section>

        <footer className="mx-auto mt-16 max-w-2xl border-t border-zinc-200 pt-8 text-center text-xs text-zinc-500">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="hover:text-zinc-800">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-800">
              Terms
            </Link>
            <Link href="/refund-policy" className="hover:text-zinc-800">
              Refunds
            </Link>
            <Link href="/imprint" className="hover:text-zinc-800">
              Imprint
            </Link>
          </nav>
          <Link href="/" className="mt-4 inline-block hover:text-zinc-800">
            Back to home
          </Link>
        </footer>
      </div>
    </main>
  )
}
