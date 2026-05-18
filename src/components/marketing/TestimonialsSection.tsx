import {
 getTestimonialsSectionItems,
 testimonialsShowPlaceholderBanner,
 type Testimonial,
} from '@/lib/marketing/testimonials'

function StarRow({ rating, illustrative }: { rating: Testimonial['rating']; illustrative: boolean }) {
 return (
 <div
 className="flex gap-0.5 text-amber-300/95"
 aria-label={
 illustrative ? `Illustrative rating ${rating} of 5 (not real customer data)` : `Rating ${rating} of 5`
 }
 >
 {[1, 2, 3, 4, 5].map((n) => (
 <span key={n} className="text-lg leading-none" aria-hidden>
 {n <= rating ? '★' : '☆'}
 </span>
 ))}
 </div>
 )
}

type Props = {
 /** Unique id prefix for `aria-labelledby` (avoid duplicate ids across pages). */
 idPrefix: string
 className?: string
 /** When true, skip default `mt-20 lg:mt-24` so the parent can control fold / spacing (e.g. pricing page). */
 compactTop?: boolean
}

export function TestimonialsSection({ idPrefix, className = '', compactTop = false }: Props) {
 const items = getTestimonialsSectionItems()
 if (!items || items.length === 0) return null

 const showBanner = testimonialsShowPlaceholderBanner()
 const titleId = `${idPrefix}-testimonials-title`

 return (
 <section
 className={`${compactTop ? '' : 'mt-20 lg:mt-24'} ${className}`.trim()}
 aria-labelledby={titleId}
 >
 <div className="mx-auto max-w-3xl text-center">
 <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
 What job seekers say
 </h2>
 {showBanner ? (
 <p
 className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900/95"
 role="note"
 >
 Example feedback · layout placeholder (not real customer quotes)
 </p>
 ) : (
 <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600">
 From people using JobFit AI for applications in Germany and beyond.
 </p>
 )}
 </div>

 <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2">
 {items.map((t, idx) => (
 <blockquote
 key={`${idPrefix}-${idx}`}
 className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
 >
 <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200/80 pb-4">
 <div className="text-left">
 <cite className="not-italic">
 <span className="block text-sm font-semibold text-zinc-900">{t.name}</span>
 <span className="mt-1 block text-xs text-zinc-500">{t.role}</span>
 <span className="mt-1 block text-[11px] font-medium uppercase tracking-wider text-slate-600">
 {t.country}
 </span>
 </cite>
 </div>
 <StarRow rating={t.rating} illustrative={showBanner} />
 </div>
 <p className="mt-4 flex-1 text-left text-sm leading-relaxed text-zinc-700">
 <span className="text-zinc-700/90" aria-hidden>
 “
 </span>
 {t.quote}
 <span className="text-zinc-700/90" aria-hidden>
 ”
 </span>
 </p>
 </blockquote>
 ))}
 </div>
 </section>
 )
}
