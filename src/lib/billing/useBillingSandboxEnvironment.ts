'use client'

import { useEffect, useState } from 'react'

/** True only on localhost-style hostnames; never on Railway/Vercel deploys — demo billing stays off staging/production. */
export function useBillingSandboxEnvironment(): boolean {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const h = window.location.hostname.toLowerCase()

    const isDeployedPreviewHost =
      h.includes('railway.app') ||
      h.includes('railway.dev') ||
      h.endsWith('.vercel.app') ||
      process.env.NEXT_PUBLIC_HIDE_BILLING_SANDBOX_UI === '1'

    const isLocalhostStyle =
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '[::1]' ||
      h.endsWith('.localhost')

    setVisible(isLocalhostStyle && !isDeployedPreviewHost)
  }, [])
  return visible
}
