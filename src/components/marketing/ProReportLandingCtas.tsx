'use client'

import Link from 'next/link'

import { LABEL_BUY_PRO_REPORT } from '@/lib/planTypes'
import { ProReportCheckoutButton } from '@/components/billing/PlanStripeCheckoutButtons'
import { btnPrimary, btnSecondary } from '@/components/ui/theme'

/** Primary Stripe CTAs — credit checkout plus optional Monthly Pro (pricing compare). */
export function ProReportLandingPrimaryCtas() {
  const wide = `${btnPrimary} mt-8 min-h-[48px] px-8 py-3.5 sm:mx-auto sm:w-auto sm:min-w-[240px]`

  return (
    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap">
      <ProReportCheckoutButton
        analyticsSurface="pro_report_landing_primary"
        className="w-full sm:w-auto"
        buttonClassName={wide}
      >
        {LABEL_BUY_PRO_REPORT}
      </ProReportCheckoutButton>
      <Link href="/pricing" className={`${btnSecondary} mt-0 sm:w-auto`}>
        Compare with Monthly Pro
      </Link>
    </div>
  )
}

export function ProReportLandingPricePrimaryCta() {
  const wide = `${btnPrimary} mt-8 min-h-[48px] px-8 py-3.5 sm:mx-auto sm:w-auto sm:min-w-[240px]`

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
