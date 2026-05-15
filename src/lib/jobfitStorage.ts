const STORAGE_KEY = 'jobfit_entitlements_v1'

export type JobFitStoredEntitlements = {
  /** Calendar day in UTC `YYYY-MM-DD` for daily quota reset (Free tier). */
  quotaDayUtc: string
  analysesUsedOnQuotaDay: number
  /** Calendar month `YYYY-MM` for Monthly Pro quota. */
  subscriptionQuotaMonthUtc: string
  subscriptionAnalysesUsedInMonth: number
  /** Legacy localStorage field — billing is driven by HttpOnly cookies; do not rely on this for authorization. */
  stripeCustomerId: string | null
  /** Demo ONLY when cookie-backed Monthly Pro is inactive — real status comes from `/api/billing/session`. */
  monthlyProActive: boolean
  monthlyProExpiresAtIso: string | null
  proReportCredits: string[]
  fullyUnlockedAnalysisIds: string[]
}

export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function utcMonthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7)
}

export function analysesUsedTodaySnapshot(e: JobFitStoredEntitlements): number {
  return e.quotaDayUtc === utcDayKey() ? e.analysesUsedOnQuotaDay : 0
}

/** Used analyses in current UTC month when Monthly Pro applies (Stripe or demo). */
export function quotaUsedSnapshot(e: JobFitStoredEntitlements, monthlyProActive: boolean): number {
  if (monthlyProActive) {
    const month = utcMonthKey()
    return e.subscriptionQuotaMonthUtc === month ? e.subscriptionAnalysesUsedInMonth : 0
  }
  return analysesUsedTodaySnapshot(e)
}

export function defaultEntitlements(): JobFitStoredEntitlements {
  return {
    quotaDayUtc: utcDayKey(),
    analysesUsedOnQuotaDay: 0,
    subscriptionQuotaMonthUtc: utcMonthKey(),
    subscriptionAnalysesUsedInMonth: 0,
    stripeCustomerId: null,
    monthlyProActive: false,
    monthlyProExpiresAtIso: null,
    proReportCredits: [],
    fullyUnlockedAnalysisIds: [],
  }
}

function normalizeStored(raw: unknown): JobFitStoredEntitlements {
  const base = defaultEntitlements()
  if (!raw || typeof raw !== 'object') return base

  const o = raw as Record<string, unknown>
  const quotaDayUtc = typeof o.quotaDayUtc === 'string' ? o.quotaDayUtc : base.quotaDayUtc
  let analysesUsedOnQuotaDay =
    typeof o.analysesUsedOnQuotaDay === 'number' ? o.analysesUsedOnQuotaDay : base.analysesUsedOnQuotaDay

  if (quotaDayUtc !== utcDayKey()) {
    analysesUsedOnQuotaDay = 0
  }

  const subscriptionQuotaMonthUtc =
    typeof o.subscriptionQuotaMonthUtc === 'string' ? o.subscriptionQuotaMonthUtc : base.subscriptionQuotaMonthUtc
  let subscriptionAnalysesUsedInMonth =
    typeof o.subscriptionAnalysesUsedInMonth === 'number'
      ? o.subscriptionAnalysesUsedInMonth
      : base.subscriptionAnalysesUsedInMonth

  if (subscriptionQuotaMonthUtc !== utcMonthKey()) {
    subscriptionAnalysesUsedInMonth = 0
  }

  const stripeCustomerId =
    typeof o.stripeCustomerId === 'string' && o.stripeCustomerId.startsWith('cus_')
      ? o.stripeCustomerId
      : typeof o.stripeCustomerId === 'string'
        ? null
        : base.stripeCustomerId

  const monthlyProActive = typeof o.monthlyProActive === 'boolean' ? o.monthlyProActive : base.monthlyProActive

  let monthlyProExpiresAtIso = base.monthlyProExpiresAtIso
  if ('monthlyProExpiresAtIso' in o) {
    const v = o.monthlyProExpiresAtIso
    if (typeof v === 'string' || v === null) {
      monthlyProExpiresAtIso = v
    }
  }

  const proReportCredits = Array.isArray(o.proReportCredits)
    ? o.proReportCredits.filter((x): x is string => typeof x === 'string')
    : base.proReportCredits

  const fullyUnlockedAnalysisIds = Array.isArray(o.fullyUnlockedAnalysisIds)
    ? o.fullyUnlockedAnalysisIds.filter((x): x is string => typeof x === 'string')
    : base.fullyUnlockedAnalysisIds

  return {
    quotaDayUtc: quotaDayUtc === utcDayKey() ? quotaDayUtc : utcDayKey(),
    analysesUsedOnQuotaDay: quotaDayUtc === utcDayKey() ? analysesUsedOnQuotaDay : 0,
    subscriptionQuotaMonthUtc: subscriptionQuotaMonthUtc === utcMonthKey() ? subscriptionQuotaMonthUtc : utcMonthKey(),
    subscriptionAnalysesUsedInMonth:
      subscriptionQuotaMonthUtc === utcMonthKey() ? subscriptionAnalysesUsedInMonth : 0,
    stripeCustomerId,
    monthlyProActive,
    monthlyProExpiresAtIso,
    proReportCredits,
    fullyUnlockedAnalysisIds,
  }
}

export function readEntitlements(): JobFitStoredEntitlements {
  if (typeof window === 'undefined') return defaultEntitlements()

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    const n = normalizeStored(parsed)
    const expiresOk =
      !n.monthlyProExpiresAtIso || new Date(n.monthlyProExpiresAtIso).getTime() > Date.now()
    return {
      ...n,
      monthlyProActive: n.monthlyProActive && expiresOk,
    }
  } catch {
    return defaultEntitlements()
  }
}

export function writeEntitlements(next: JobFitStoredEntitlements): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function recordAnalysisConsumed(
  prev: JobFitStoredEntitlements,
  monthlyProActive: boolean
): JobFitStoredEntitlements {
  if (monthlyProActive) {
    const month = utcMonthKey()
    const sameMonth = prev.subscriptionQuotaMonthUtc === month
    return {
      ...prev,
      subscriptionQuotaMonthUtc: month,
      subscriptionAnalysesUsedInMonth: sameMonth ? prev.subscriptionAnalysesUsedInMonth + 1 : 1,
    }
  }

  const today = utcDayKey()
  const sameDay = prev.quotaDayUtc === today
  return {
    ...prev,
    quotaDayUtc: today,
    analysesUsedOnQuotaDay: sameDay ? prev.analysesUsedOnQuotaDay + 1 : 1,
  }
}

export function demoGrantProReportCredit(prev: JobFitStoredEntitlements): JobFitStoredEntitlements {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `credit_${Date.now()}_${Math.random().toString(16).slice(2)}`
  return {
    ...prev,
    proReportCredits: [...prev.proReportCredits, id],
  }
}

export function consumeProReportCreditForAnalysis(
  prev: JobFitStoredEntitlements,
  analysisId: string
): JobFitStoredEntitlements | null {
  if (prev.proReportCredits.length === 0) return null
  const [, ...rest] = prev.proReportCredits
  return {
    ...prev,
    proReportCredits: rest,
    fullyUnlockedAnalysisIds: [...prev.fullyUnlockedAnalysisIds, analysisId],
  }
}

export function mergeProUnlockFromPayment(prev: JobFitStoredEntitlements, analysisId: string): JobFitStoredEntitlements {
  if (prev.fullyUnlockedAnalysisIds.includes(analysisId)) return prev
  return {
    ...prev,
    fullyUnlockedAnalysisIds: [...prev.fullyUnlockedAnalysisIds, analysisId],
  }
}

export function setStripeCustomerId(prev: JobFitStoredEntitlements, customerId: string): JobFitStoredEntitlements {
  const trimmed = customerId.trim()
  if (!trimmed.startsWith('cus_')) return prev
  return { ...prev, stripeCustomerId: trimmed }
}

export function demoSetMonthlyPro(
  prev: JobFitStoredEntitlements,
  active: boolean,
  expiresAtIso?: string | null
): JobFitStoredEntitlements {
  return {
    ...prev,
    monthlyProActive: active,
    monthlyProExpiresAtIso: active ? expiresAtIso ?? null : null,
  }
}
