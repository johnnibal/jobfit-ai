import { afterEach, describe, expect, it, vi } from 'vitest'

describe('proReportEntitlementToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('mints and verifies entitlement for matching analysis only', async () => {
    vi.stubEnv('JOBFIT_ENTITLEMENT_SECRET', 'test-entitlement-secret-min-16!')
    const mod = await import('./proReportEntitlementToken.server')
    const id = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    const other = 'bbbbbbbb-cccc-4ddd-aeee-ffffffffffff'
    const raw = mod.appendProReportEntitlementCookie(undefined, id)
    expect(mod.proReportEntitlementCoversAnalysis(raw, id)).toBe(true)
    expect(mod.proReportEntitlementCoversAnalysis(raw, other)).toBe(false)
    expect(mod.listActiveProReportEntitlementAnalysisIds(raw)).toEqual([id])
  })

  it('merges multiple analyses into one cookie', async () => {
    vi.stubEnv('JOBFIT_ENTITLEMENT_SECRET', 'test-entitlement-secret-merge-!')
    const mod = await import('./proReportEntitlementToken.server')
    const id1 = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    const id2 = 'bbbbbbbb-cccc-4ddd-aeee-ffffffffffff'
    const a = mod.appendProReportEntitlementCookie(undefined, id1)
    const b = mod.appendProReportEntitlementCookie(a, id2)
    const ids = mod.listActiveProReportEntitlementAnalysisIds(b).sort()
    expect(ids).toEqual([id1, id2].sort())
  })

  it('rejects tampered cookies', async () => {
    vi.stubEnv('JOBFIT_ENTITLEMENT_SECRET', 'test-entitlement-secret-tamper!')
    const mod = await import('./proReportEntitlementToken.server')
    const id = 'cccccccc-dddd-4eee-a111-999999999999'
    const raw = mod.appendProReportEntitlementCookie(undefined, id)
    expect(mod.proReportEntitlementCoversAnalysis(`${raw}x`, id)).toBe(false)
  })
})
