import type { NextResponse } from 'next/server'
import { JOBFIT_ANON_COOKIE } from '@/lib/usage/anonymousCookie'

export function applyAnonymousSessionCookie(res: NextResponse, signedToken: string | null): void {
  if (!signedToken?.trim()) return
  res.cookies.set(JOBFIT_ANON_COOKIE, signedToken.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 400,
  })
}
