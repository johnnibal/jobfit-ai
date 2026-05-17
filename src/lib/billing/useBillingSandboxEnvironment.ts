'use client'

import { useEffect, useState } from 'react'

/** True only when local Next dev or localhost — hide demo billing UI on Railway/production deploys. */
export function useBillingSandboxEnvironment(): boolean {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const h = window.location.hostname
    const isLocal =
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '[::1]' ||
      h.endsWith('.localhost')
    setVisible(process.env.NODE_ENV === 'development' || isLocal)
  }, [])
  return visible
}
