'use client'

import Link from 'next/link'

import { LABEL_BUY_PRO_REPORT } from '@/lib/planTypes'
import { ProReportCheckoutButton } from '@/components/billing/PlanStripeCheckoutButtons'

/** Primary Stripe CTAs — credit checkout plus optional Monthly Pro (pricing compare). */
export function ProReportLandingPrimaryCtas() {
  const wide =
    'mt-8 inline-flex w-full min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-8 py-3.5 font-semibold text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 sm:mx-auto sm:w-auto sm:min-w-[240px]'

  return (
    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap">
      <ProReportCheckoutButton
        analyticsSurface="pro_report_landing_primary"
        className="w-full sm:w-auto"
        buttonClassName={wide}
      >
        {LABEL_BUY_PRO_REPORT}
      </ProReportCheckoutButton>
      <Link
        href="/pricing"
        className="inline-flex w-full items-center justify-center rounded-full border border-slate-600 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-slate-500 sm:w-auto"
      >
        Compare with Monthly Pro
      </Link>
    </div>
  )
}

export function ProReportLandingPricePrimaryCta() {
  const wide =
    'mt-8 inline-flex w-full min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-8 py-3.5 font-semibold text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 sm:mx-auto sm:w-auto sm:min-w-[240px]'

  return (
    <ProReportCheckoutButton
      analyticsSurface="pro_report_landing_price_band"
      className=""
      buttonClassName={wide}
    >
      {LABEL_BUY_PRO_REPORT}
    </ProReportCheckoutButton>
  )
}
