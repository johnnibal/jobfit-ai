'use client'

import { useEffect, useState } from 'react'
import { localBillingSandboxActive } from '@/lib/billing/localBillingSandbox'

/** True only on localhost dev; hidden on Railway, Vercel, and production deploys. */
export function useBillingSandboxEnvironment(): boolean {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(localBillingSandboxActive())
  }, [])
  return visible
}
