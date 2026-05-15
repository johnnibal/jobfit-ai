import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout canceled · JobFit AI',
  description: 'No charge was made.',
}

export default function CheckoutCancelPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.12),_transparent_32%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-8 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
            Canceled
          </div>
          <h1 className="text-2xl font-semibold text-white">No charge made</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            You closed checkout before paying. Your free analysis is unchanged — return whenever you are ready to unlock
            Pro Report.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/analyze"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
            >
              Back to analyzer
            </Link>
            <Link
              href="/pricing"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-600 bg-slate-950 px-6 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              View pricing
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
