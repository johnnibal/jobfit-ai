import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import HeroMatchIllustration from '@/components/HeroMatchIllustration'
import { HomeTrackedLink } from '@/components/analytics/HomeTrackedLink'
import { MonthlyProCheckoutButton, ProReportCheckoutButton } from '@/components/billing/PlanStripeCheckoutButtons'
import {
  MONTHLY_PRO_ANALYSES_PER_MONTH,
  PRICE_MONTHLY_PRO_EUR,
  PRICE_PRO_REPORT_EUR,
} from '@/lib/planTypes'
import {
  badge,
  brandDot,
  brandMark,
  btnPrimary,
  btnSecondary,
  btnSecondaryFull,
  card,
  cardFeatured,
  cardPadding,
  iconAccent,
  pageMain,
  sectionHeading,
  stepBadge,
  textLink,
} from '@/components/ui/theme'

export const metadata: Metadata = {
  title: 'JobFit AI: CV fit scoring for Germany',
  description:
    'Compare your CV to any job posting. Fit score, missing skills, ATS keywords, cover letter. Built for applicants in Germany.',
}

function CheckIcon() {
  return (
    <svg className={`mt-0.5 h-4 w-4 shrink-0 ${iconAccent}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-relaxed text-zinc-700">
      <CheckIcon />
      <span>{children}</span>
    </li>
  )
}

const planCard = `flex flex-col ${card} ${cardPadding}`

export default function Home() {
  return (
    <main className={pageMain}>
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <Link href="/" className={brandMark}>
            <span className={brandDot} aria-hidden />
            JobFit AI
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-medium" aria-label="Primary">
            <HomeTrackedLink href="/analyze" ctaId="header_analyze" className={btnSecondary}>
              Analyze
            </HomeTrackedLink>
            <HomeTrackedLink href="/pricing" ctaId="header_pricing" className={btnSecondary}>
              Pricing
            </HomeTrackedLink>
          </nav>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,440px)] lg:gap-12">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">CV fit analysis</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              Know if your CV fits the job before you apply
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
              JobFit AI compares your CV with a job posting, gives you a fit score, finds missing gaps, and helps you
              improve your application.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HomeTrackedLink href="/analyze" ctaId="hero_primary_analyze" className={btnPrimary}>
                Analyze My CV
              </HomeTrackedLink>
              <HomeTrackedLink href="/pricing" ctaId="hero_secondary_pricing" className={btnSecondary}>
                View Pricing
              </HomeTrackedLink>
            </div>
            <p className="mt-6 text-sm text-zinc-500">
              Free tier available. No card required to try the analyzer.
            </p>
          </div>
          <HeroMatchIllustration />
        </section>

        {/* How it works */}
        <section className="mt-20 lg:mt-24" aria-labelledby="how-heading">
          <h2 id="how-heading" className={sectionHeading}>
            How it works
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Three steps from paste to actionable feedback.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Add your materials',
                body: 'Paste your CV text and the full job description. You can upload a PDF to fill the CV field.',
              },
              {
                step: '2',
                title: 'Run the analysis',
                body: 'JobFit AI compares overlap between your CV and the posting and scores the fit.',
              },
              {
                step: '3',
                title: 'Act on the report',
                body: 'Review gaps, suggestions, and ATS keywords. Upgrade for the full checklist, cover letter, and PDF.',
              },
            ].map((item) => (
              <li key={item.step} className={`${card} p-5 sm:p-6`}>
                <span className={stepBadge}>{item.step}</span>
                <h3 className="mt-4 text-sm font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* What you get */}
        <section className="mt-20 lg:mt-24" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className={sectionHeading}>
            What you get
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Outputs you can edit and reuse for each application.
          </p>
          <div className={`mt-8 ${card} ${cardPadding}`}>
            <ul className="grid gap-3 sm:grid-cols-2">
              <Bullet>Fit score for the role</Bullet>
              <Bullet>CV improvement suggestions</Bullet>
              <Bullet>ATS keyword checklist</Bullet>
              <Bullet>Tailored cover letter draft</Bullet>
              <Bullet>PDF report export</Bullet>
              <Bullet>Saved reports on Monthly Pro</Bullet>
            </ul>
          </div>
        </section>

        {/* Germany */}
        <section className="mt-20 lg:mt-24" aria-labelledby="germany-heading">
          <h2 id="germany-heading" className={sectionHeading}>
            Built for job seekers in Germany
          </h2>
          <div className={`mt-8 ${card} ${cardPadding}`}>
            <ul className="grid gap-3 sm:grid-cols-2">
              <Bullet>German and English CV and job text supported</Bullet>
              <Bullet>Highlights terms German postings often emphasize</Bullet>
              <Bullet>Honest suggestions based on your CV, not invented claims</Bullet>
              <Bullet>Secure checkout through Stripe when you upgrade</Bullet>
            </ul>
          </div>
        </section>

        {/* Pricing preview */}
        <section id="pricing-preview" className="mt-20 scroll-mt-24 lg:mt-24" aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" className={sectionHeading}>
            Pricing preview
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Start free. Full details on the{' '}
            <HomeTrackedLink href="/pricing" ctaId="pricing_section_compare_link" className={textLink}>
              pricing page
            </HomeTrackedLink>
            .
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3 lg:items-stretch">
            <article className={planCard}>
              <h3 className="text-base font-semibold text-zinc-900">Free</h3>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">€0</p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                <Bullet>1 free analysis per day</Bullet>
                <Bullet>Basic score and preview</Bullet>
              </ul>
              <HomeTrackedLink href="/analyze" ctaId="pricing_preview_free" className={`mt-6 ${btnSecondaryFull}`}>
                Start free
              </HomeTrackedLink>
            </article>

            <article className={`${cardFeatured} ${cardPadding} relative flex flex-col`}>
              <span className={`${badge} absolute -top-2.5 left-4`}>Recommended</span>
              <h3 className="pt-1 text-base font-semibold text-zinc-900">Pro Report</h3>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums text-indigo-700">€{PRICE_PRO_REPORT_EUR}</span>
                <span className="text-sm text-zinc-500">one-time</span>
              </p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                <Bullet>One paid analysis</Bullet>
                <Bullet>Full report, ATS checklist, cover letter</Bullet>
                <Bullet>PDF export</Bullet>
              </ul>
              <div className="mt-6">
                <ProReportCheckoutButton analyticsSurface="homepage_pricing_preview_pro_report">
                  Buy Pro Report
                </ProReportCheckoutButton>
              </div>
            </article>

            <article className={planCard}>
              <h3 className="text-base font-semibold text-zinc-900">Monthly Pro</h3>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums text-zinc-900">€{PRICE_MONTHLY_PRO_EUR}</span>
                <span className="text-sm text-zinc-500">/month</span>
              </p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                <Bullet>{MONTHLY_PRO_ANALYSES_PER_MONTH} analyses per month</Bullet>
                <Bullet>Saved reports and full premium features</Bullet>
                <Bullet>Best for active job seekers</Bullet>
              </ul>
              <div className="mt-6">
                <MonthlyProCheckoutButton analyticsSurface="homepage_pricing_preview_monthly_pro">
                  Subscribe Monthly Pro
                </MonthlyProCheckoutButton>
              </div>
            </article>
          </div>
        </section>

        <footer className="mt-20 border-t border-zinc-200 pt-8 text-center text-xs text-zinc-500">
          <p>JobFit AI. CV and role fit tooling for applicants in Germany.</p>
          <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-zinc-600">
            <HomeTrackedLink href="/analyze" ctaId="footer_analyzer" className="hover:text-indigo-600">
              Analyzer
            </HomeTrackedLink>
            <HomeTrackedLink href="/pricing" ctaId="footer_pricing" className="hover:text-indigo-600">
              Pricing
            </HomeTrackedLink>
            <Link href="/privacy" className="hover:text-indigo-600">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600">
              Terms
            </Link>
            <Link href="/refund-policy" className="hover:text-indigo-600">
              Refunds
            </Link>
            <Link href="/imprint" className="hover:text-indigo-600">
              Imprint
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  )
}
