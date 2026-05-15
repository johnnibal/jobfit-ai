import { Suspense } from 'react'
import type { Metadata } from 'next'
import CheckoutSuccessClient from './CheckoutSuccessClient'

export const metadata: Metadata = {
  title: 'Payment successful · JobFit AI',
  description: 'Your JobFit AI Pro Report checkout completed.',
}

function SuccessFallback() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-8">
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  )
}
