/** User-visible strings on `/checkout/success` and `/checkout/subscription-success` */

export const CHECKOUT_CONFIRM_LOADING_PAYMENT_TITLE = 'Verifying payment'

export const CHECKOUT_CONFIRM_LOADING_PAYMENT_BODY =
  'Contacting Stripe to confirm your purchase and activating it on this browser. This does not depend on webhooks—you can retry if anything times out.'

export const SUCCESS_PRO_REPORT_UNLOCKED_TITLE = 'Pro Report unlocked'

export const SUCCESS_PRO_REPORT_UNLOCKED_BODY =
  'This analyzer result is now Pro on this browser—cover letter, full ATS checklist, and PDF export are enabled. Saved unlock also works across refreshes. Use the analyzer link below to continue.'

/** Short headline above the requested sentence */
export const SUCCESS_PRO_REPORT_CREDIT_TITLE = 'Pro Report credit saved'

/** Exact headline message requested */
export const SUCCESS_PRO_REPORT_CREDIT_BODY =
  'Your Pro Report credit is ready. Run one analysis to generate your full report.'

export const SUCCESS_SUBSCRIPTION_LOADING_BODY =
  'Syncing Monthly Pro from Stripe—works even if webhook delivery was delayed—and setting billing cookies.'

export const SUCCESS_MONTHLY_PRO_ACTIVE_TITLE = 'Monthly Pro is active'

export const SUCCESS_MONTHLY_PRO_ACTIVE_BODY =
  'Your subscription is linked to this browser. Full reports, ATS checklist, exports, and saved reports unlock while billing stays active. Redirecting…'
