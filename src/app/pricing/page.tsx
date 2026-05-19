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
import {
  badgeRecommended,
  brandDot,
  brandMark,
  btnPrimary,
  btnSecondary,
  card,
  footerBar,
  headerBar,
  iconAccent,
  pageContainer,
  pageMain,
  pricingPlanCard,
  pricingPlanCardFeatured,
  pricingPlanFeature,
  pricingPlanPrice,
  pricingPlanPriceValue,
  pricingPlanTitle,
  sectionHeading,
  textLink,
  textMuted,
} from '@/components/ui/theme'

export const metadata: Metadata = {
  title: 'Pricing · JobFit AI',
  description: 'Free CV fit analysis, Pro Report at €4.99, or Monthly Pro at €9.99/month. Pay through Stripe when you upgrade.',
}

function CheckIcon() {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 shrink-0 ${iconAccent}`}
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
    <li className={`flex gap-2.5 ${pricingPlanFeature}`}>
      <CheckIcon />
      <span>{children}</span>
    </li>
  )
}

const planCard = pricingPlanCard

export default function PricingPage() {
  return (
    <main className={pageMain}>
      <div className={`${pageContainer} pb-20 pt-8 lg:pb-24 lg:pt-10`}>
        <header className={`mb-10 flex flex-wrap items-center justify-between gap-4 ${headerBar}`}>
          <Link href="/" className={brandMark}>
            <span className={brandDot} aria-hidden />
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
          <h1 className={`${sectionHeading} sm:text-4xl`}>
            Simple pricing
          </h1>
          <p className={`mt-3 text-sm leading-relaxed sm:text-base ${textMuted}`}>
            Start free. Pay only when you need a full report or apply to many roles in a month. Checkout is
            handled by Stripe.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
          {/* Free */}
          <article className={planCard}>
            <div className="mb-5">
              <h2 className={pricingPlanTitle}>Free</h2>
              <p className={pricingPlanPrice}>€0</p>
              <p className={`mt-1 text-xs ${textMuted}`}>No card required</p>
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
          <article className={`${pricingPlanCardFeatured} relative flex min-w-0 flex-col`}>
            <span className={`${badgeRecommended} absolute -top-2.5 left-4`}>
              Recommended
            </span>
            <div className="mb-5 pt-1">
              <h2 className={pricingPlanTitle}>Pro Report</h2>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className={pricingPlanPriceValue}>€{PRICE_PRO_REPORT_EUR}</span>
                <span className={`text-sm ${textMuted}`}>one-time</span>
              </p>
              <p className={`mt-1 text-xs ${textMuted}`}>One application, full report</p>
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
              className={`mt-3 block text-center text-xs ${textMuted} underline-offset-2 hover:text-onyx hover:underline`}
            >
              What is Pro Report?
            </Link>
          </article>

          {/* Monthly Pro */}
          <article className={planCard}>
            <div className="mb-5">
              <h2 className={pricingPlanTitle}>Monthly Pro</h2>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className={pricingPlanPriceValue}>€{PRICE_MONTHLY_PRO_EUR}</span>
                <span className={`text-sm ${textMuted}`}>/month</span>
              </p>
              <p className={`mt-1 text-xs ${textMuted}`}>Best for active job seekers</p>
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

        <p className={`mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed ${textMuted}`}>
          Prices in EUR. Taxes may apply at checkout. Your plan controls which features unlock after payment.
        </p>

        <TestimonialsSection idPrefix="pricing" compactTop className="mx-auto max-w-6xl pt-14" />

        <section className="mx-auto mt-16 max-w-2xl" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className={`text-center ${sectionHeading} text-xl`}>
            Common questions
          </h2>

          <dl className="mt-8 space-y-3">
            <div className={`${card} px-5 py-4`}>
              <dt className="text-sm font-medium text-onyx">Can I use this for German job postings?</dt>
              <dd className={`mt-2 text-sm leading-relaxed ${textMuted}`}>
                Yes. Paste German or English CV and job text. The analyzer compares what you wrote with what the
                employer asks for.
              </dd>
            </div>
            <div className={`${card} px-5 py-4`}>
              <dt className="text-sm font-medium text-onyx">Is my CV private?</dt>
              <dd className={`mt-2 text-sm leading-relaxed ${textMuted}`}>
                Your text is used only to generate your analysis. We do not train public models on it. See our{' '}
                <Link href="/privacy" className={textLink}>
                  Privacy
                </Link>{' '}
                policy for retention and your rights.
              </dd>
            </div>
            <div className={`${card} px-5 py-4`}>
              <dt className="text-sm font-medium text-onyx">Can I cancel Monthly Pro?</dt>
              <dd className={`mt-2 text-sm leading-relaxed ${textMuted}`}>
                Yes. Billing runs through Stripe. Cancel before your next renewal from the customer portal linked
                after checkout.
              </dd>
            </div>
          </dl>
        </section>

        <footer className={`mx-auto mt-16 max-w-2xl ${footerBar}`}>
          <nav className={`flex flex-wrap justify-center gap-x-4 gap-y-2 ${textMuted}`}>
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
          <Link href="/" className="mt-4 inline-block transition hover:text-onyx">
            Back to home
          </Link>
        </footer>
      </div>
    </main>
  )
}
