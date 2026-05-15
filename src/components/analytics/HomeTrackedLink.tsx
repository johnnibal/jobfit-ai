'use client'

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import type { HomepageCtaId } from '@/lib/analytics/events'
import { trackEvent } from '@/lib/analytics/track'

type Props = ComponentProps<typeof Link> & {
  ctaId: HomepageCtaId
  children: ReactNode
}

/** Homepage-only: fires `homepage_cta_clicked` with `cta_id` (no PII). */
export function HomeTrackedLink({ href, ctaId, onClick, children, ...rest }: Props) {
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        trackEvent('homepage_cta_clicked', { cta_id: ctaId })
        onClick?.(e)
      }}
    >
      {children}
    </Link>
  )
}
