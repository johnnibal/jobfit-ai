import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Checkout canceled · JobFit AI',
 description: 'No charge was made.',
}

export default function CheckoutCancelPage() {
 return (
 <main className="min-h-screen bg-zinc-50 text-zinc-900">
 <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
 <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm ">
 <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
 Canceled
 </div>
 <h1 className="text-2xl font-semibold text-zinc-900">No charge made</h1>
 <p className="mt-3 text-sm leading-relaxed text-zinc-600">
 You closed checkout before paying. Your free analysis is unchanged. Return whenever you are ready to unlock
 Pro Report.
 </p>
 <div className="mt-8 flex flex-col gap-3 sm:flex-row">
 <Link
 href="/analyze"
 className="inline-flex flex-1 min-h-[44px] items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
 >
 Back to analyzer
 </Link>
 <Link
 href="/pricing"
 className="inline-flex flex-1 min-h-[44px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
 >
 View pricing
 </Link>
 </div>
 </div>
 </div>
 </main>
 )
}
