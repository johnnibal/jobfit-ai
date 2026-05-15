/**
 * Testimonials visibility (no real quotes ship by default).
 *
 * Env: `NEXT_PUBLIC_JOBFIT_TESTIMONIALS`
 * - `off` | `false` | `0` | `hidden` — hide the section everywhere.
 * - `placeholder` | `demo` | `example` | `true` | `1` — show clearly labeled example cards (any environment).
 * - `published` — show {@link PUBLISHED_TESTIMONIALS} only if that list is non-empty (real quotes you add yourself).
 *
 * If unset: **development** shows placeholders; **production** hides the section (opt-in for real or demo copy).
 */

export type Testimonial = {
  name: string
  role: string
  country: string
  quote: string
  /** 1–5; shown as stars in the UI */
  rating: 1 | 2 | 3 | 4 | 5
}

/** Example rows for layout only — not real people or feedback. */
export const PLACEHOLDER_TESTIMONIALS: readonly Testimonial[] = [
  {
    name: 'Example name (not a real person)',
    role: 'Example role field — placeholder text only',
    country: 'Example country field',
    quote:
      'This is placeholder copy for layout and accessibility testing. It is not a quote from a customer. Replace with approved testimonials when you have them.',
    rating: 5,
  },
  {
    name: 'Second example slot',
    role: 'Another fictitious role label',
    country: '—',
    quote:
      'Example feedback only. Do not treat this text as social proof. Star ratings here are illustrative.',
    rating: 4,
  },
]

/**
 * Add real testimonials here only with permission to publish (and set `NEXT_PUBLIC_JOBFIT_TESTIMONIALS=published`).
 * Until then, leave this empty so production never shows believable fake quotes.
 */
export const PUBLISHED_TESTIMONIALS: readonly Testimonial[] = []

function normalizeEnv(): string {
  return typeof process.env.NEXT_PUBLIC_JOBFIT_TESTIMONIALS === 'string'
    ? process.env.NEXT_PUBLIC_JOBFIT_TESTIMONIALS.trim().toLowerCase()
    : ''
}

export type TestimonialsSectionMode = 'hidden' | 'placeholder' | 'published'

export function getTestimonialsSectionMode(): TestimonialsSectionMode {
  const v = normalizeEnv()
  if (v === 'published' && PUBLISHED_TESTIMONIALS.length > 0) return 'published'
  if (v === 'off' || v === 'false' || v === '0' || v === 'hidden') return 'hidden'
  if (
    v === 'placeholder' ||
    v === 'demo' ||
    v === 'example' ||
    v === 'true' ||
    v === '1'
  ) {
    return 'placeholder'
  }
  if (process.env.NODE_ENV === 'development') return 'placeholder'
  return 'hidden'
}

export function getTestimonialsSectionItems(): readonly Testimonial[] | null {
  const mode = getTestimonialsSectionMode()
  if (mode === 'hidden') return null
  if (mode === 'published') return PUBLISHED_TESTIMONIALS
  return PLACEHOLDER_TESTIMONIALS
}

export function testimonialsShowPlaceholderBanner(): boolean {
  return getTestimonialsSectionMode() === 'placeholder'
}
