import { Suspense } from 'react'
import type { Metadata } from 'next'
import SubscriptionSuccessClient from './SubscriptionSuccessClient'

export const metadata: Metadata = {
  title: 'Subscription confirmed · JobFit AI',
  description: 'Your Monthly Pro subscription is being activated.',
}

function Fallback() {
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

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <SubscriptionSuccessClient />
    </Suspense>
  )
}
