/** Shared JobFit UI tokens — exact layout specs from design direction. */

const cardShadow = 'shadow-[0_1px_2px_rgba(12,18,12,0.05),0_6px_20px_rgba(12,18,12,0.06)]'

export const pageMain = 'min-h-screen bg-page text-onyx antialiased'

/** max-width 1120px; 16px mobile / 24px desktop padding */
export const pageContainer = 'mx-auto w-full max-w-[1120px] px-4 lg:px-6'

export const analyzerPageContainer = 'mx-auto w-full max-w-[1180px] px-4 lg:px-6 pt-10 sm:pt-12'

export const card = `rounded-[18px] border border-ash/90 bg-white ${cardShadow}`

export const cardPadding = 'p-6'

export const btnPrimary =
  'inline-flex h-11 cursor-pointer items-center justify-center rounded-[10px] bg-onyx px-[22px] text-sm font-medium text-white transition hover:bg-[#1a221a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export const btnPrimaryBrick =
  'inline-flex h-11 cursor-pointer items-center justify-center rounded-[10px] bg-brick px-[22px] text-sm font-medium text-white transition hover:bg-[#a00110] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export const btnPrimaryFull = `${btnPrimary} w-full`

export const btnSecondary =
  'inline-flex h-11 cursor-pointer items-center justify-center rounded-[10px] border border-ash bg-white px-[22px] text-sm font-medium text-onyx transition hover:bg-ash/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick/15 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export const btnSecondaryFull = `${btnSecondary} w-full`

export const analyzerFormCard = card

export const analyzerFormHeading = 'text-lg font-semibold text-onyx'

export const analyzerFormSubheading = 'mt-1.5 text-sm leading-relaxed text-dim'

export const analyzerFormLabel = 'block text-sm font-medium text-onyx'

export const analyzerFormHint = 'mt-1 text-sm leading-relaxed text-dim'

export const analyzerFormSubmit = btnPrimaryFull

export const cardFeatured =
  `rounded-[18px] border border-ash/90 bg-white ${cardShadow} border-t-2 border-t-brick`

export const btnGhost =
  'inline-flex h-10 cursor-pointer items-center justify-center rounded-[10px] px-4 text-sm font-medium text-dim transition hover:bg-ash/15 hover:text-onyx disabled:cursor-not-allowed disabled:opacity-50'

export const alertWarning =
  'rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900'

export const alertError =
  'rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800'

export const alertInfo =
  'rounded-[14px] border border-ash/90 bg-ash/10 px-4 py-3 text-sm leading-relaxed text-onyx'

export const badgeNeutral =
  'inline-flex items-center rounded-md border border-ash/90 bg-white px-2.5 py-0.5 text-xs font-medium text-dim'

export const badge = badgeNeutral

export const badgeRecommended =
  'inline-flex items-center rounded-md border border-brick/35 bg-white px-2.5 py-0.5 text-xs font-medium text-brick'

export const navLink = 'text-sm font-medium text-dim transition hover:text-onyx'

export const textBody = 'text-sm leading-relaxed text-dim'

export const sectionHeading = 'text-[22px] font-semibold tracking-tight text-onyx'

export const heroHeadline =
  'mx-auto max-w-[720px] text-[30px] font-bold leading-[1.1] tracking-tight text-onyx sm:text-[36px] lg:text-[48px]'

export const heroSubheadline =
  'mx-auto mt-5 max-w-[620px] text-[17px] leading-relaxed text-dim lg:text-[18px]'

export const labelCaps = 'text-xs font-semibold uppercase tracking-[0.12em] text-dim'

export const formFieldGroup = 'space-y-5'

export const resultSection = 'border-b border-ash/40 pb-6 last:border-b-0 last:pb-0'

export const scoreCard =
  `flex items-center justify-between gap-4 rounded-[14px] border border-ash/90 bg-white px-5 py-4 ${cardShadow}`

export const scoreValueAccent = 'text-4xl font-semibold tabular-nums tracking-tight text-brick'

export const lockedPanel =
  'rounded-[14px] border border-dashed border-ash bg-ash/10 px-4 py-5 text-center'

export const inputSurface =
  'w-full rounded-[10px] border border-ash/90 bg-white px-4 py-3 text-sm text-onyx outline-none transition placeholder:text-dim/55 focus:border-brick/40 focus:ring-2 focus:ring-brick/10'

export const textLink =
  'font-medium text-onyx underline-offset-2 transition hover:text-dim hover:underline'

export const brandMark =
  'inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-onyx transition hover:text-dim'

export const brandDot = 'h-2 w-2 shrink-0 rounded-full bg-brick'

export const iconAccent = 'text-dim'

export const textMuted = 'text-sm leading-relaxed text-dim'

export const bulletText = 'text-[15px] leading-relaxed text-dim'

export const headerBar = 'flex h-[72px] items-center justify-between border-b border-ash/90'

export const footerBar = 'border-t border-ash/90 pt-10 text-center text-sm text-dim'

export const insightCardSubtle = 'rounded-[14px] border border-ash/80 bg-ash/10 px-4 py-3.5'

export const insightHeading = 'text-[15px] font-semibold text-onyx'

export const heroFrame =
  'relative mx-auto w-full max-w-[820px] overflow-visible rounded-[20px] border border-ash/90 bg-[#F4F7F6] p-6 shadow-[0_1px_2px_rgba(12,18,12,0.04),0_8px_24px_rgba(12,18,12,0.05)] sm:p-10 md:p-12'

export const heroMiniCard =
  `relative z-10 w-full max-w-[220px] rounded-[14px] border border-ash/90 bg-white p-4 ${cardShadow} sm:w-[220px] sm:p-5`

export const heroMiniCardTitle = 'text-sm font-semibold tracking-tight text-onyx'

export const heroSkillTag =
  'rounded-full border border-ash/80 bg-white px-2.5 py-0.5 text-xs font-medium text-dim'

export const heroFitScoreBubble =
  `absolute right-1 -top-6 z-20 rounded-lg border border-ash/90 border-b-[3px] border-b-brick/30 bg-white px-2.5 py-1.5 ${cardShadow} sm:right-2 sm:-top-7`

export const pricingPlanCard =
  `flex min-w-0 flex-col rounded-[18px] border border-ash/90 bg-white p-6 sm:p-8 ${cardShadow}`

export const pricingPlanCardFeatured =
  `${cardFeatured} flex min-w-0 flex-col p-6 sm:p-8`

export const insightCard = `rounded-[18px] border border-ash/90 bg-white p-5 sm:p-6 ${cardShadow}`

export const pricingPlanTitle = 'text-base font-semibold text-onyx'

export const pricingPlanPrice = 'mt-3 text-[32px] font-semibold tabular-nums leading-none text-onyx'

export const pricingPlanPriceValue = 'text-[32px] font-semibold tabular-nums leading-none text-onyx'

export const pricingPlanFeature = 'text-sm leading-relaxed text-dim'

export const pricingPlanBtn = 'mt-6 h-[42px]'
