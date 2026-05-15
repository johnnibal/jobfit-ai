import { PRO_REPORT_LIST_PRICE_EUR } from '@/lib/planTypes'

type PromoCode = 'LAUNCH50' | 'STUDENT30'

type PromoDefinition = {
  percentOff: number
  stripeCouponEnvKey: string
}

const PROMOS: Record<PromoCode, PromoDefinition> = {
  LAUNCH50: { percentOff: 50, stripeCouponEnvKey: 'STRIPE_PROMO_COUPON_LAUNCH50' },
  STUDENT30: { percentOff: 30, stripeCouponEnvKey: 'STRIPE_PROMO_COUPON_STUDENT30' },
}

const PROMO_EXPIRES_ISO: Partial<Record<PromoCode, string | undefined>> = {
  LAUNCH50: process.env.STRIPE_PROMO_EXPIRES_LAUNCH50,
  STUDENT30: process.env.STRIPE_PROMO_EXPIRES_STUDENT30,
}

function stripeCouponIdFromEnv(envKey: string): string | undefined {
  const raw = process.env[envKey]?.trim()
  return raw && raw.startsWith('cou_') ? raw : undefined
}

function promoExpired(code: PromoCode): boolean {
  const iso = PROMO_EXPIRES_ISO[code]?.trim()
  if (!iso) return false
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return false
  return Date.now() > t
}

export function normalizeProReportPromoInput(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export type ProReportPromoResult =
  | {
      ok: true
      canonicalCode: PromoCode
      percentOff: number
      stripeCouponId: string
      originalEur: number
      discountedEur: number
    }
  | { ok: false; reason: 'unknown' | 'expired' | 'not_configured' }

function isPromoCode(key: string): key is PromoCode {
  return key === 'LAUNCH50' || key === 'STUDENT30'
}

/** Resolve promo for server-side validation and Stripe Checkout (never trust client prices). */
export function resolveProReportPromo(raw?: string | null): ProReportPromoResult {
  if (!raw?.trim()) return { ok: false, reason: 'unknown' }

  const key = normalizeProReportPromoInput(raw)
  if (!isPromoCode(key)) return { ok: false, reason: 'unknown' }

  const def = PROMOS[key]
  if (promoExpired(key)) return { ok: false, reason: 'expired' }

  const stripeCouponId = stripeCouponIdFromEnv(def.stripeCouponEnvKey)
  if (!stripeCouponId) return { ok: false, reason: 'not_configured' }

  const originalEur = PRO_REPORT_LIST_PRICE_EUR
  const discountedEur = Math.round(originalEur * (100 - def.percentOff)) / 100

  return {
    ok: true,
    canonicalCode: key,
    percentOff: def.percentOff,
    stripeCouponId,
    originalEur,
    discountedEur,
  }
}
