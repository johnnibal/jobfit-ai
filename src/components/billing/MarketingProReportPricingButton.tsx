'use client'

import { LABEL_START_WITH_PRO_REPORT } from '@/lib/planTypes'
import { ProReportCheckoutButton } from '@/components/billing/PlanStripeCheckoutButtons'

/** Credit checkout — homepage pricing-preview (`pro_report_credit`). Label: Start with Pro Report. */
export function MarketingProReportPricingButton({
  analyticsSurface = 'homepage_pricing_preview_pro_report',
}: {
  analyticsSurface?: string
}) {
  return (
    <div className="mt-8 w-full">
      <ProReportCheckoutButton analyticsSurface={analyticsSurface}>
        {LABEL_START_WITH_PRO_REPORT}
      </ProReportCheckoutButton>
    </div>
  )
}
