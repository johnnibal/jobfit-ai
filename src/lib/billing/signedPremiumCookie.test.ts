import { afterEach, describe, expect, it, vi } from 'vitest'

describe('signedPremiumCookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('monthly entitlement roundtrips', async () => {
    vi.stubEnv('JOBFIT_USAGE_SECRET', 'test-jobfit-secret-min-16!')
    const mod = await import('./signedPremiumCookie')
    const raw = mod.signMonthlyProEntitlementCookie('cus_RoundtripTest01')
    expect(mod.verifyMonthlyProEntitlementCookie(raw)).toBe('cus_RoundtripTest01')
  })

  it('merges pro report analysis ids', async () => {
    vi.stubEnv('JOBFIT_USAGE_SECRET', 'test-jobfit-secret-min-16!')
    const mod = await import('./signedPremiumCookie')
    const id1 = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    const id2 = 'bbbbbbbb-cccc-4ddd-aeee-ffffffffffff'
    const merged = mod.appendProReportGrantCookie(undefined, id1)
    const merged2 = mod.appendProReportGrantCookie(merged, id2)
    expect(mod.verifyProReportGrantsCookie(merged2)?.sort()).toEqual([id1, id2].sort())
  })

  it('rejects tampered tokens', async () => {
    vi.stubEnv('JOBFIT_USAGE_SECRET', 'test-jobfit-secret-min-16!')
    const mod = await import('./signedPremiumCookie')
    const raw = mod.signMonthlyProEntitlementCookie('cus_TamperTest00002')
    expect(mod.verifyMonthlyProEntitlementCookie(`${raw}BAD`)).toBeNull()
  })
})
