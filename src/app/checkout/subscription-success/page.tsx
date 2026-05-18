import { Suspense } from 'react'
import type { Metadata } from 'next'
import SubscriptionSuccessClient from './SubscriptionSuccessClient'
import { card, cardPadding, pageMain } from '@/components/ui/theme'

export const metadata: Metadata = {
  title: 'Subscription confirmed · JobFit AI',
  description: 'Your Monthly Pro subscription is being activated.',
}

function Fallback() {
  return (
    <main className={pageMain}>
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
        <div className={`${card} ${cardPadding}`}>
          <p className="text-sm text-zinc-500">Loading…</p>
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
