import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import AnimatedHeroLogo from '@/components/AnimatedHeroLogo'
import { HomeTrackedLink } from '@/components/analytics/HomeTrackedLink'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import {
  MONTHLY_PRO_ANALYSES_PER_MONTH,
  PRICE_MONTHLY_PRO_EUR,
  PRICE_PRO_REPORT_EUR,
} from '@/lib/planTypes'

export const metadata: Metadata = {
  title: 'JobFit AI — CV fit scoring for Germany',
  description:
    'Compare your CV to any job posting. Fit score, missing skills, ATS keywords, cover letter — built for applicants in Germany.',
}

function SectionShell({
  children,
  className = '',
  dark = false,
}: {
  children: ReactNode
  className?: string
  dark?: boolean
}) {
  return (
    <div
      className={`rounded-[28px] border backdrop-blur-xl ${
        dark
          ? 'border-slate-800 bg-slate-900/70'
          : 'border-slate-800/80 bg-slate-950/40'
      } p-8 sm:p-10 ${className}`}
    >
      {children}
    </div>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 h-5 w-5 shrink-0 text-cyan-400 ${className}`}
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

function Bullet({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <li className={`flex gap-3 text-sm leading-relaxed text-slate-300 ${className ?? ''}`}>
      <CheckIcon />
      <span>{children}</span>
    </li>
  )
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.18),_transparent_30%)]" />
      <div className="absolute left-10 top-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-12 right-12 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-28 lg:pt-10">
        {/* Desktop: first screen = header + hero only; “Most CVs…” and below appear after scroll */}
        <div className="lg:flex lg:min-h-[100dvh] lg:flex-col">
        <header className="mb-12 flex shrink-0 flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:mb-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white transition hover:text-cyan-200"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400" aria-hidden />
            JobFit AI
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm font-medium" aria-label="Primary">
            <HomeTrackedLink
              href="/analyze"
              ctaId="header_analyze"
              className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-cyan-100 transition hover:border-cyan-400/55 hover:bg-cyan-500/15"
            >
              Analyze
            </HomeTrackedLink>
            <HomeTrackedLink
              href="/pricing"
              ctaId="header_pricing"
              className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-slate-200 backdrop-blur transition hover:border-violet-400/35 hover:text-white"
            >
              Pricing
            </HomeTrackedLink>
            <HomeTrackedLink
              href="/pro-report"
              ctaId="header_pro_report"
              className="rounded-full border border-violet-400/35 bg-violet-500/10 px-4 py-2 text-violet-100 transition hover:border-violet-400/55 hover:bg-violet-500/15"
            >
              Pro Report
            </HomeTrackedLink>
          </nav>
        </header>

        {/* 1 · Hero — mobile: illustration then short copy + CTAs (no pill/H1); desktop: full headline + text | illustration */}
        <section className="flex flex-col lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:flex-1 lg:items-center lg:gap-12 lg:pb-10 lg:pt-8">
          <div className="order-2 mx-auto flex max-w-2xl flex-col text-center lg:order-1 lg:mx-0 lg:max-w-none lg:text-left">
            <div className="mb-6 hidden items-center gap-2 self-center rounded-full border border-cyan-400/25 bg-slate-900/70 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur lg:inline-flex lg:self-start">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Focused on the German job market
            </div>

            <h1 className="hidden text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:block lg:max-w-2xl lg:text-[3.35rem]">
              Know if your CV fits the job before you apply.
            </h1>

            <p className="mt-0 text-lg leading-relaxed text-slate-300 lg:mt-6 lg:max-w-2xl">
              JobFit AI compares your CV with a job posting, gives you a fit score, finds missing skills, and helps you
              improve your application for the German job market.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <HomeTrackedLink
                href="/analyze"
                ctaId="hero_primary_analyze"
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-8 py-3.5 text-center font-semibold text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(56,189,248,0.45)] sm:w-auto"
              >
                Analyze My CV
              </HomeTrackedLink>
              <HomeTrackedLink
                href="#pricing-preview"
                ctaId="hero_secondary_pricing_anchor"
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-600 bg-slate-900/80 px-8 py-3.5 text-center font-semibold text-slate-100 backdrop-blur transition hover:border-slate-500 hover:bg-slate-800/90 sm:w-auto"
              >
                See Pricing
              </HomeTrackedLink>
            </div>

            <p className="mt-6 max-w-xl self-center text-xs leading-relaxed text-slate-500 lg:self-start">
              No card needed to start on the free tier · Upgrade when you want full suggestions, ATS detail, exports, or
              a monthly allowance.
            </p>
          </div>

          <div className="order-1 mb-8 flex justify-center max-lg:w-full lg:order-2 lg:mb-0 lg:mt-0 lg:justify-end">
            <div className="rounded-[32px] border border-slate-800 bg-slate-900/60 p-4 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-6">
              <AnimatedHeroLogo />
            </div>
          </div>
        </section>
        </div>

        {/* 2 · Problem */}
        <section className="mt-20 lg:mt-16" aria-labelledby="problem-heading">
          <SectionShell>
            <h2 id="problem-heading" className="max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl lg:text-[1.75rem]">
              Most CVs are not rejected because they are bad. They are rejected because they do not match the job.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-400">
              Recruiters and ATS systems prioritize overlap with what the posting actually asks for. JobFit AI makes that
              overlap visible fast — so you can adapt before you send the application.
            </p>
          </SectionShell>
        </section>

        {/* 3 · Benefits */}
        <section className="mt-16 lg:mt-20" aria-labelledby="benefits-heading">
          <div className="mb-10 text-center lg:text-left">
            <h2 id="benefits-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              What you get
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 lg:mx-0">
              Practical outputs you can edit and reuse for every posting.
            </p>
          </div>
          <SectionShell dark>
            <ul className="grid gap-4 sm:grid-cols-2 lg:gap-5">
              <Bullet>Find missing skills</Bullet>
              <Bullet>Improve your CV for each job</Bullet>
              <Bullet>Get ATS-friendly keywords</Bullet>
              <Bullet>Generate a tailored cover letter</Bullet>
              <Bullet>Export a professional report</Bullet>
            </ul>
          </SectionShell>
        </section>

        {/* 4 · Trust */}
        <section className="mt-16 lg:mt-20" aria-labelledby="trust-heading">
          <div className="mb-10 text-center lg:text-left">
            <h2 id="trust-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Why applicants trust JobFit AI
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'Built for job seekers in Germany',
              'Supports English and German applications',
              'AI-generated suggestions you can edit',
              'Secure payment with Stripe',
            ].map((line) => (
              <SectionShell key={line} dark className="p-6 sm:p-7">
                <div className="flex gap-3">
                  <CheckIcon />
                  <p className="text-sm font-medium leading-relaxed text-slate-100">{line}</p>
                </div>
              </SectionShell>
            ))}
          </div>
        </section>

        <TestimonialsSection idPrefix="home" />

        {/* 5 · Pricing preview */}
        <section id="pricing-preview" className="mt-20 lg:mt-28 scroll-mt-24" aria-labelledby="pricing-preview-heading">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-900/70 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Simple pricing
            </div>
            <h2 id="pricing-preview-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Pick what fits how you apply
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
              Start free anytime. Detailed comparison and FAQs on the{' '}
              <HomeTrackedLink
                href="/pricing"
                ctaId="pricing_section_compare_link"
                className="text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline"
              >
                pricing page
              </HomeTrackedLink>
              .
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            <article className="flex flex-col rounded-[28px] border border-slate-800 bg-slate-900/70 p-8 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Free</h3>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tabular-nums text-white">€0</span>
                </p>
                <p className="mt-2 text-sm text-slate-500">Try the analyzer — essentials first</p>
              </div>
              <ul className="flex flex-1 flex-col gap-3 text-sm">
                <Bullet>Fit score &amp; daily free run</Bullet>
                <Bullet>Core suggestions preview</Bullet>
                <Bullet>No card required</Bullet>
              </ul>
              <HomeTrackedLink
                href="/analyze"
                ctaId="pricing_preview_free"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-slate-600 bg-slate-950/80 px-6 py-3 text-center text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
              >
                Start free
              </HomeTrackedLink>
            </article>

            <article className="relative flex flex-col rounded-[28px] border-2 border-violet-400/45 bg-gradient-to-b from-violet-950/50 via-slate-900/90 to-slate-900/70 p-8 shadow-[0_0_80px_rgba(139,92,246,0.22),0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:z-10 lg:-mt-2 lg:mb-[-0.5rem] lg:scale-[1.02]">
              <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 justify-center">
                <span className="rounded-full border border-violet-400/40 bg-gradient-to-r from-violet-500/90 to-cyan-500/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-lg">
                  Popular
                </span>
              </div>
              <div className="mb-6 mt-3">
                <h3 className="text-lg font-semibold text-white">Pro Report</h3>
                <p className="mt-3 flex flex-wrap items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums text-white">€{PRICE_PRO_REPORT_EUR}</span>
                  <span className="text-sm font-medium text-violet-200/90">one-time</span>
                </p>
                <p className="mt-2 text-sm text-violet-200/70">Full depth for one application</p>
              </div>
              <ul className="flex flex-1 flex-col gap-3 text-sm">
                <Bullet>All suggestions &amp; ATS detail</Bullet>
                <Bullet>Cover letter + PDF export</Bullet>
              </ul>
              <HomeTrackedLink
                href="/analyze"
                ctaId="pricing_preview_pro_report"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-center text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(139,92,246,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(56,189,248,0.4)]"
              >
                Go to analyzer
              </HomeTrackedLink>
            </article>

            <article className="flex flex-col rounded-[28px] border border-slate-800 bg-slate-900/70 p-8 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Monthly Pro</h3>
                <p className="mt-3 flex flex-wrap items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums text-white">€{PRICE_MONTHLY_PRO_EUR}</span>
                  <span className="text-sm font-medium text-slate-400">/month</span>
                </p>
                <p className="mt-2 text-sm text-slate-500">For active applications</p>
              </div>
              <ul className="flex flex-1 flex-col gap-3 text-sm">
                <Bullet>Up to {MONTHLY_PRO_ANALYSES_PER_MONTH} analyses / month (UTC)</Bullet>
                <Bullet>Saved reports &amp; full exports</Bullet>
              </ul>
              <HomeTrackedLink
                href="/analyze"
                ctaId="pricing_preview_monthly_pro"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 px-6 py-3 text-center text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/55 hover:bg-cyan-500/15"
              >
                Go to analyzer
              </HomeTrackedLink>
            </article>
          </div>
        </section>

        <footer className="mt-20 border-t border-slate-800 pt-10 text-center text-xs text-slate-600 lg:mt-24">
          <p>© JobFit AI — CV and role fit tooling for applicants in Germany.</p>
          <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <HomeTrackedLink href="/analyze" ctaId="footer_analyzer" className="transition hover:text-cyan-400">
              Analyzer
            </HomeTrackedLink>
            <HomeTrackedLink href="/pro-report" ctaId="footer_pro_report" className="transition hover:text-cyan-400">
              Pro Report
            </HomeTrackedLink>
            <HomeTrackedLink href="/pricing" ctaId="footer_pricing" className="transition hover:text-cyan-400">
              Pricing &amp; FAQ
            </HomeTrackedLink>
            <Link href="/privacy" className="transition hover:text-cyan-400">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-cyan-400">
              Terms
            </Link>
            <Link href="/refund-policy" className="transition hover:text-cyan-400">
              Refunds
            </Link>
            <Link href="/imprint" className="transition hover:text-cyan-400">
              Imprint
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  )
}
