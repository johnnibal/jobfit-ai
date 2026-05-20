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
  badgeRecommended,
  brandDot,
  brandMark,
  btnPrimary,
  btnSecondary,
  btnSecondaryFull,
  navBtn,
  card,
  cardPadding,
  footerBar,
  headerBar,
  heroHeadline,
  heroSubheadline,
  iconAccent,
  pageContainer,
  pageMain,
  pricingPlanCard,
  pricingPlanCardFeatured,
  pricingPlanFeature,
  pricingPlanPrice,
  pricingPlanTitle,
  sectionHeading,
  textLink,
  textMuted,
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
    <li className={`flex gap-2.5 ${pricingPlanFeature}`}>
      <CheckIcon />
      <span>{children}</span>
    </li>
  )
}

export default function Home() {
  return (
    <main className={pageMain}>
      <div className={`${pageContainer} pb-20 lg:pb-24`}>
        <header className={headerBar}>
          <Link href="/" className={`${brandMark} shrink-0`}>
            <span className={brandDot} aria-hidden />
            JobFit AI
          </Link>
          <nav className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end" aria-label="Primary">
            <HomeTrackedLink href="/analyze" ctaId="header_analyze" className={navBtn}>
              Analyze
            </HomeTrackedLink>
            <HomeTrackedLink href="/pricing" ctaId="header_pricing" className={navBtn}>
              Pricing
            </HomeTrackedLink>
          </nav>
        </header>

        <section className="pb-14 pt-[88px] text-center lg:pb-[56px]">
          <h1 className={heroHeadline}>
            Know if your CV <span className="text-brick">fits the job</span> before you apply
          </h1>
          <p className={heroSubheadline}>
            Compare your CV with a job posting, find gaps, and improve your application before you apply.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <HomeTrackedLink href="/analyze" ctaId="hero_primary_analyze" className={btnPrimary}>
              Analyze My CV
            </HomeTrackedLink>
            <HomeTrackedLink href="/pricing" ctaId="hero_secondary_pricing" className={btnSecondary}>
              View Pricing
            </HomeTrackedLink>
          </div>
          <p className={`mt-5 ${textMuted}`}>Free tier available. No card required to try the analyzer.</p>
          <div className="mt-12 sm:mt-16">
            <HeroMatchIllustration />
          </div>
        </section>

        <section className="mt-16 lg:mt-20" aria-labelledby="germany-heading">
          <h2 id="germany-heading" className={`${sectionHeading} text-center`}>
            Built for job seekers in Germany
          </h2>
          <div className={`${card} ${cardPadding} mt-7 sm:mt-8`}>
            <ul className="grid gap-4 sm:grid-cols-2">
              <Bullet>German and English CV and job text supported</Bullet>
              <Bullet>Highlights terms German postings often emphasize</Bullet>
              <Bullet>Honest suggestions based on your CV, not invented claims</Bullet>
              <Bullet>Secure checkout through Stripe when you upgrade</Bullet>
            </ul>
          </div>
        </section>

        <section id="pricing-preview" className="mt-20 scroll-mt-24 lg:mt-24" aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" className={sectionHeading}>
            Pricing preview
          </h2>
          <p className={`mt-3 max-w-2xl text-base ${textMuted}`}>
            Start free. Full details on the{' '}
            <HomeTrackedLink href="/pricing" ctaId="pricing_section_compare_link" className={textLink}>
              pricing page
            </HomeTrackedLink>
            .
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            <article className={`${pricingPlanCard} flex flex-col`}>
              <h3 className={pricingPlanTitle}>Free</h3>
              <p className={pricingPlanPrice}>€0</p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                <Bullet>1 free analysis per day</Bullet>
                <Bullet>Basic score and preview</Bullet>
              </ul>
              <HomeTrackedLink href="/analyze" ctaId="pricing_preview_free" className={`${btnSecondaryFull} mt-6 h-[42px]`}>
                Start free
              </HomeTrackedLink>
            </article>

            <article className={`${pricingPlanCardFeatured} relative flex flex-col`}>
              <span className={`${badgeRecommended} absolute -top-2.5 left-4`}>Recommended</span>
              <h3 className={`${pricingPlanTitle} pt-1`}>Pro Report</h3>
              <p className={pricingPlanPrice}>
                €{PRICE_PRO_REPORT_EUR}
                <span className="ml-2 text-sm font-normal text-dim">one-time</span>
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

            <article className={`${pricingPlanCard} flex flex-col`}>
              <h3 className={pricingPlanTitle}>Monthly Pro</h3>
              <p className={pricingPlanPrice}>
                €{PRICE_MONTHLY_PRO_EUR}
                <span className="ml-2 text-sm font-normal text-dim">/month</span>
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

        <footer className={`mt-20 ${footerBar}`}>
          <p>JobFit AI: CV and role fit tooling for applicants in Germany.</p>
          <nav className={`mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 ${textMuted}`}>
            <HomeTrackedLink href="/analyze" ctaId="footer_analyzer" className="transition hover:text-onyx">
              Analyzer
            </HomeTrackedLink>
            <HomeTrackedLink href="/pricing" ctaId="footer_pricing" className="transition hover:text-onyx">
              Pricing
            </HomeTrackedLink>
            <Link href="/privacy" className="transition hover:text-onyx">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-onyx">
              Terms
            </Link>
            <Link href="/refund-policy" className="transition hover:text-onyx">
              Refunds
            </Link>
            <Link href="/imprint" className="transition hover:text-onyx">
              Imprint
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  )
}
