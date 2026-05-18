/**
 * Single source for `/api/checkout/pro-report` Stripe field wiring (tests assert webhook + UI contracts).
 */

export const JOBFIT_STRIPE_PRO_REPORT = 'pro_report' as const
export const JOBFIT_STRIPE_PRO_REPORT_CREDIT = 'pro_report_credit' as const

export type JobfitStripePaymentProductMeta =
  | typeof JOBFIT_STRIPE_PRO_REPORT
  | typeof JOBFIT_STRIPE_PRO_REPORT_CREDIT

/** `line_items` must use Stripe Price IDs (`price_*`), never Product IDs (`prod_*`) — enforced via env naming in callers. */

export type ProReportCheckoutStripeCoreFields = {
  jobfit_product: JobfitStripePaymentProductMeta
  /** Flow A — existing analysis unlock carries `analysisId` + `client_reference_id`. Flow B omits both. */
  client_reference_id: string | undefined
  /** Caller merges promoCode (and discounts) atop this baseline. */
  metadataBaseline: Record<string, string>
}

export function buildProReportCheckoutStripeCoreFields(analysisIdValidatedOrNull: string | null): ProReportCheckoutStripeCoreFields {
  const id = analysisIdValidatedOrNull?.trim() ?? ''
  if (id) {
    return {
      jobfit_product: JOBFIT_STRIPE_PRO_REPORT,
      client_reference_id: id,
      metadataBaseline: {
        jobfit_product: JOBFIT_STRIPE_PRO_REPORT,
        analysisId: id,
      },
    }
  }

  return {
    jobfit_product: JOBFIT_STRIPE_PRO_REPORT_CREDIT,
    client_reference_id: undefined,
    metadataBaseline: {
      jobfit_product: JOBFIT_STRIPE_PRO_REPORT_CREDIT,
    },
  }
}
