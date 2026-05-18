/** Monetization plan tier (billing product). Placeholder until Stripe connects. */
export type BillingPlan = 'free' | 'pro_report' | 'monthly_pro'

/** Canonical limits — swap server-side enforcement later without UI churn. */
export const FREE_ANALYSES_PER_DAY = 1
/** Monthly Pro subscription: analyses allowed per calendar month (UTC). */
export const MONTHLY_PRO_ANALYSES_PER_MONTH = 50

/** List price shown in checkout / UI (must stay aligned with Stripe Pro Report Price). */
export const PRO_REPORT_LIST_PRICE_EUR = 4.99

export const PRICE_PRO_REPORT_EUR = PRO_REPORT_LIST_PRICE_EUR.toFixed(2)

/** Unlock path: checkout attaches to the current analyzer result (`analysisId`). */
export const LABEL_UNLOCK_PRO_REPORT = `Unlock Pro Report for €${PRICE_PRO_REPORT_EUR}`
/** Credit path: one prepaid run that unlocks the next successful analysis on this browser. */
export const LABEL_BUY_PRO_REPORT = `Buy Pro Report for €${PRICE_PRO_REPORT_EUR}`
/** Alternate marketing headline CTA — starts credit checkout. */
export const LABEL_START_WITH_PRO_REPORT = 'Start with Pro Report'

/** @deprecated Prefer LABEL_UNLOCK_PRO_REPORT or LABEL_BUY_PRO_REPORT for clarity */
export const UNLOCK_PRO_REPORT_CTA_LABEL = LABEL_UNLOCK_PRO_REPORT

export const PRICE_MONTHLY_PRO_EUR = '9.99'

/** Monthly Pro Stripe checkout primary CTA. */
export const LABEL_SUBSCRIBE_MONTHLY_PRO = `Subscribe Monthly Pro · €${PRICE_MONTHLY_PRO_EUR}/mo`

/** Short differentiation copy — used pricing / analyzer / modal. */
export const COPY_FREE_TIER_PRIMARY_LINE = `${FREE_ANALYSES_PER_DAY} free analysis per day`
export const COPY_PRO_REPORT_ONELINE =
  'One paid analysis + full report for one application'
export const COPY_PRO_REPORT_INCLUDES =
  'Includes full CV suggestions, ATS keyword checklist, tailored cover letter, and PDF export'

export const COPY_MONTHLY_PRO_TAGLINE = 'For active job seekers'
export const COPY_MONTHLY_PRO_INCLUDES_LONG = `${MONTHLY_PRO_ANALYSES_PER_MONTH} analyses per month, saved reports, cover letters, ATS checklist, and PDF exports`

/** Empty Insights column — prepaid Pro wording. */
export const COPY_INSIGHTS_EMPTY_PAID_PRO_RUN = `Run a paid Pro Report analysis for €${PRICE_PRO_REPORT_EUR}`

export const FREE_VISIBLE_SUGGESTION_COUNT = 3
