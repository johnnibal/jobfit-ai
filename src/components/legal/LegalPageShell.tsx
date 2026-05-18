import Link from 'next/link'
import type { ReactNode } from 'react'

import { SITE_CONTACT_EMAIL } from '@/lib/legal/placeholders'

const legalNav = [
 { href: '/privacy', label: 'Privacy' },
 { href: '/terms', label: 'Terms' },
 { href: '/refund-policy', label: 'Refunds' },
 { href: '/imprint', label: 'Imprint' },
] as const

type Props = {
 title: string
 /** Short line under the H1 (optional). */
 intro?: ReactNode
 children: ReactNode
}

/** Shared chrome for policy pages — simple layout, consistent with Pricing. */
export function LegalPageShell({ title, intro, children }: Props) {
 return (
 <main className="min-h-screen bg-zinc-50 text-zinc-900">
 <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-28 lg:pt-14">
 <header className="mb-10 border-b border-zinc-200/80 pb-8">
 <Link
 href="/"
 className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-700"
 >
 <span aria-hidden className="text-lg">
 ←
 </span>
 JobFit AI home
 </Link>
 <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500" aria-label="Legal pages">
 {legalNav.map(({ href, label }) => (
 <Link key={href} href={href} className="transition hover:text-zinc-800">
 {label}
 </Link>
 ))}
 <Link href="/pricing" className="transition hover:text-zinc-800">
 Pricing
 </Link>
 </nav>
 </header>

 <article>
 <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{title}</h1>
 {intro ? <p className="mt-4 text-sm leading-relaxed text-zinc-600">{intro}</p> : null}
 {/* TODO(legal): Have counsel review all copy below for your entity, markets, and Stripe setup. */}
 <div className="mt-10 space-y-8 text-sm leading-relaxed text-zinc-700">{children}</div>
 </article>

 <footer className="mt-16 border-t border-zinc-200 pt-8 text-center text-xs text-slate-600">
 <p>
 Questions? Write to{' '}
 <a
 href={`mailto:${SITE_CONTACT_EMAIL}`}
 className="text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline"
 >
 {SITE_CONTACT_EMAIL}
 </a>
 .
 </p>
 <p className="mt-2">Replace placeholder contact details after legal sign-off.</p>
 </footer>
 </div>
 </main>
 )
}

export function LegalSection({
 id,
 heading,
 children,
}: {
 id: string
 heading: string
 children: ReactNode
}) {
 return (
 <section id={id} aria-labelledby={`${id}-heading`}>
 <h2 id={`${id}-heading`} className="text-lg font-semibold text-zinc-700/95">
 {heading}
 </h2>
 <div className="mt-3 space-y-3">{children}</div>
 </section>
 )
}
