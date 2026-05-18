import { Suspense } from 'react'
import type { Metadata } from 'next'
import CheckoutSuccessClient from './CheckoutSuccessClient'

export const metadata: Metadata = {
  title: 'Payment successful · JobFit AI',
  description: 'Your JobFit AI Pro Report checkout completed.',
}

import { card, cardPadding, pageMain } from '@/components/ui/theme'

function SuccessFallback() {
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  )
}
