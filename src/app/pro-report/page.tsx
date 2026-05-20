import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import {
  COPY_PRO_REPORT_INCLUDES,
  COPY_PRO_REPORT_ONELINE,
  PRICE_PRO_REPORT_EUR,
} from '@/lib/planTypes'
import {
  ProReportLandingPrimaryCtas,
  ProReportLandingPricePrimaryCta,
} from '@/components/marketing/ProReportLandingCtas'
import { brandDot, brandMark, headerBar, navBtn, pageMain } from '@/components/ui/theme'

export const metadata: Metadata = {
 title: 'Pro Report · JobFit AI',
 description:
 'One paid analysis plus full CV–job report: ATS checklist, cover letter, and PDF export. €4.99 one-time (not a subscription).',
}

function CheckIcon() {
 return (
 <svg className="mt-0.5 h-5 w-5 shrink-0 text-zinc-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
 <path
 fillRule="evenodd"
 d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
 clipRule="evenodd"
 />
 </svg>
 )
}

function InclusionItem({ children }: { children: ReactNode }) {
 return (
 <li className="flex gap-3 text-sm leading-relaxed text-zinc-700">
 <CheckIcon />
 <span>{children}</span>
 </li>
 )
}

function FaqItem({ q, children }: { q: string; children: ReactNode }) {
 return (
 <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 ">
 <h3 className="font-semibold text-zinc-900">{q}</h3>
 <div className="mt-2 text-sm leading-relaxed text-zinc-600">{children}</div>
 </div>
 )
}

export default function ProReportSalesPage() {
 return (
 <main className={pageMain}>
 <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-28 lg:pt-10">
 <header className={`mb-12 ${headerBar}`}>
 <Link href="/" className={`${brandMark} shrink-0`}>
 <span className={brandDot} aria-hidden />
 JobFit AI
 </Link>
 <nav className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end" aria-label="Primary">
 <Link href="/analyze" className={navBtn}>
 Analyzer
 </Link>
 <Link href="/pricing" className={navBtn}>
 All plans
 </Link>
 </nav>
 </header>

 {/* 1–2 · Hero */}
 <section className="text-center sm:text-left">
 <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
 Pro Report · one-time
 </div>
 <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">Pro Report · full detail for one application</h1>
 <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-700 sm:mx-0">
 <span className="text-zinc-800">{COPY_PRO_REPORT_ONELINE}</span> {COPY_PRO_REPORT_INCLUDES}
 </p>

 <ProReportLandingPrimaryCtas />
 <p className="mt-4 text-xs leading-relaxed text-zinc-500">
 Paid securely via Stripe ({PRICE_PRO_REPORT_EUR} one-time). You can start from the analyzer with a free run, or{' '}
 <span className="text-zinc-600">buy now</span> to fund your next paid Pro analysis on this browser.
 </p>
 </section>

 {/* 3 · What is included */}
        <section className="mt-16 lg:mt-20" aria-labelledby="included-heading">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
 <h2 id="included-heading" className="text-xl font-semibold text-zinc-900 sm:text-2xl">
 What is included
 </h2>
 <p className="mt-2 text-sm text-zinc-600">
 When you unlock (or prepaid), everything that stays blurred on Free opens for{' '}
 <span className="text-zinc-700">one successful analysis session</span>, not a rolling subscription.
 </p>
 <ul className="mt-6 grid gap-3 sm:grid-cols-2">
 <InclusionItem>Full fit analysis</InclusionItem>
 <InclusionItem>All improvement suggestions</InclusionItem>
 <InclusionItem>Recruiter red flags</InclusionItem>
 <InclusionItem>ATS keyword checklist</InclusionItem>
 <InclusionItem>Tailored cover letter</InclusionItem>
 <InclusionItem>PDF export</InclusionItem>
 </ul>
 </div>
 </section>

 {/* 4 · Who it is for */}
 <section className="mt-14 lg:mt-16" aria-labelledby="who-heading">
 <h2 id="who-heading" className="text-xl font-semibold text-zinc-900 sm:text-2xl">
 Who it is for
 </h2>
 <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-700">
 <li className="flex gap-2">
 <span className="text-zinc-700" aria-hidden>
 ·
 </span>
 Applying for an important job
 </li>
 <li className="flex gap-2">
 <span className="text-zinc-700" aria-hidden>
 ·
 </span>
 International job seekers in Germany
 </li>
 <li className="flex gap-2">
 <span className="text-zinc-700" aria-hidden>
 ·
 </span>
 People who want to improve their CV before applying
 </li>
 </ul>
 </section>

 {/* 5–6 · Price + CTA */}
 <section className="mt-14 lg:mt-16" aria-labelledby="price-heading">
 <div
 id="price-heading"
 className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-10"
 >
 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Price</p>
 <p className="mt-3 flex flex-wrap items-baseline justify-center gap-2 tabular-nums">
 <span className="text-5xl font-bold text-zinc-900">€{PRICE_PRO_REPORT_EUR}</span>
 <span className="text-base font-medium text-zinc-700/85">one-time</span>
 </p>
 <p className="mt-2 text-sm text-zinc-500">
 {COPY_PRO_REPORT_ONELINE} · €{PRICE_PRO_REPORT_EUR} one-time · {COPY_PRO_REPORT_INCLUDES}
 </p>
 <div className="mt-8 flex justify-center">
 <ProReportLandingPricePrimaryCta />
 </div>
 </div>
 </section>

 {/* 7 · FAQ */}
 <section className="mt-16 lg:mt-20" aria-labelledby="faq-heading">
 <h2 id="faq-heading" className="text-center text-xl font-semibold text-zinc-900 sm:text-2xl">
 FAQ
 </h2>
 <div className="mt-8 space-y-4">
 <FaqItem q="Is this a subscription?">
 <p>
 No. Pro Report is a one-time €{PRICE_PRO_REPORT_EUR} payment, either for your current analyzer result
 (“unlock”), or prepaid as a browser credit so your next paid run unlocks automatically.
 </p>
 <p className="mt-2">
 Want ongoing quota and saved reports? See{' '}
 <Link href="/pricing" className="text-zinc-700 underline-offset-2 hover:underline">
 Monthly Pro on the pricing page
 </Link>
 .
 </p>
 </FaqItem>
 <FaqItem q="Can I edit the result?">
 <p>
 Yes. AI output is meant as a draft you control. Tweak suggestions and the cover letter before you send
 anything to employers.
 </p>
 </FaqItem>
 <FaqItem q="Does this guarantee a job?">
 <p>
 No. JobFit AI cannot guarantee interviews or offers. It helps you see fit and improve your materials;
 outcomes depend on many factors outside the tool.
 </p>
 </FaqItem>
 <FaqItem q="Is my CV private?">
 <p>
 Your CV and job text are used to generate your analysis. We do not use them to train public models for
 third parties unless we say so in a clear, separate notice. For details, read our{' '}
 <Link href="/privacy" className="text-zinc-700 underline-offset-2 hover:underline">
 Privacy
 </Link>{' '}
 page.
 </p>
 </FaqItem>
 </div>
 </section>

 <footer className="mt-16 border-t border-zinc-200 pt-8 text-center text-xs text-slate-600">
 <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
 <Link href="/" className="hover:text-zinc-700">
 Home
 </Link>
 <Link href="/privacy" className="hover:text-zinc-700">
 Privacy
 </Link>
 <Link href="/terms" className="hover:text-zinc-700">
 Terms
 </Link>
 <Link href="/refund-policy" className="hover:text-zinc-700">
 Refunds
 </Link>
 </nav>
 </footer>
 </div>
 </main>
 )
}
