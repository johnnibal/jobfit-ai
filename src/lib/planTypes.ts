/** Monetization plan tier (billing product). Placeholder until Stripe connects. */
export type BillingPlan = 'free' | 'pro_report' | 'monthly_pro'

/** Canonical limits — swap server-side enforcement later without UI churn. */
export const FREE_ANALYSES_PER_DAY = 1
/** Monthly Pro subscription: analyses allowed per calendar month (UTC). */
export const MONTHLY_PRO_ANALYSES_PER_MONTH = 50

/** List price shown in checkout / UI (must stay aligned with Stripe Pro Report Price). */
export const PRO_REPORT_LIST_PRICE_EUR = 4.99

export const PRICE_PRO_REPORT_EUR = PRO_REPORT_LIST_PRICE_EUR.toFixed(2)

/** Primary Pro Report checkout CTA (always show when upsell is visible — not behind feature flags). */
export const UNLOCK_PRO_REPORT_CTA_LABEL = `Unlock Pro Report for €${PRICE_PRO_REPORT_EUR}`

export const PRICE_MONTHLY_PRO_EUR = '9.99'

export const FREE_VISIBLE_SUGGESTION_COUNT = 3
