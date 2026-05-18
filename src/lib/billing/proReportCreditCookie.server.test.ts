import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Pro Report pending credit cookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('mints cookie and parses verified credit row id roundtrip', async () => {
    vi.stubEnv('JOBFIT_ENTITLEMENT_SECRET', 'test-jobfit-pr-pc-secret-16!')
    const mod = await import('./proReportCreditCookie.server')
    const creditRowId = 'clxyz012345creditrowidstub'
    const raw = mod.mintProReportPendingCreditCookieValue(creditRowId)
    expect(mod.parseVerifiedProReportPendingCreditId(raw)).toBe(creditRowId)
  })

  it('rejects tampered payloads', async () => {
    vi.stubEnv('JOBFIT_ENTITLEMENT_SECRET', 'test-jobfit-pr-pc-secret-23!')
    const mod = await import('./proReportCreditCookie.server')
    const raw = mod.mintProReportPendingCreditCookieValue('cred-id-one')
    expect(mod.parseVerifiedProReportPendingCreditId(`${raw}bad`)).toBeNull()
  })
})
