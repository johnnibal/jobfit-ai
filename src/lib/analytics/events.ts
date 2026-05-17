/**
 * Canonical product event names — keep snake_case stable for dashboards and integrations.
 */

export type AnalyticsEventName =
  | 'homepage_cta_clicked'
  | 'analysis_started'
  | 'analysis_completed'
  | 'free_result_viewed'
  | 'locked_feature_clicked'
  | 'upgrade_modal_opened'
  | 'stripe_checkout_started'
  | 'payment_success'
  | 'pdf_exported'
  | 'cover_letter_generated'

/** Allowed homepage CTA ids (no URLs, no PII). */
export type HomepageCtaId =
  | 'header_analyze'
  | 'header_pricing'
  | 'header_pro_report'
  | 'hero_primary_analyze'
  | 'hero_secondary_pricing_anchor'
  | 'final_primary_analyze'
  | 'final_secondary_pricing_page'
  | 'footer_analyzer'
  | 'footer_pro_report'
  | 'footer_pricing'
  /** Pricing preview cards */
  | 'pricing_preview_free'
  | 'pricing_preview_pro_report'
  | 'pricing_preview_monthly_pro'
  | 'pricing_section_compare_link'
