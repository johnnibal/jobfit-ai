import { describe, expect, it } from 'vitest'
import {
  buildProReportCheckoutStripeCoreFields,
  JOBFIT_STRIPE_PRO_REPORT,
  JOBFIT_STRIPE_PRO_REPORT_CREDIT,
} from './proReportStripeCheckoutFields'

const SAMPLE_UUID_V4 = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee'

describe('buildProReportCheckoutStripeCoreFields', () => {
  it('Flow A — unlock existing analysis tags pro_report + analysisId + client_reference_id', () => {
    const f = buildProReportCheckoutStripeCoreFields(SAMPLE_UUID_V4)
    expect(f.jobfit_product).toBe(JOBFIT_STRIPE_PRO_REPORT)
    expect(f.client_reference_id).toBe(SAMPLE_UUID_V4)
    expect(f.metadataBaseline).toEqual({
      jobfit_product: JOBFIT_STRIPE_PRO_REPORT,
      analysisId: SAMPLE_UUID_V4,
    })
  })

  it('Flow B — prepaid credit uses pro_report_credit and omits analysis identity', () => {
    const f = buildProReportCheckoutStripeCoreFields(null)
    expect(f.jobfit_product).toBe(JOBFIT_STRIPE_PRO_REPORT_CREDIT)
    expect(f.client_reference_id).toBeUndefined()
    expect(f.metadataBaseline).toEqual({
      jobfit_product: JOBFIT_STRIPE_PRO_REPORT_CREDIT,
    })
    expect(Object.prototype.hasOwnProperty.call(f.metadataBaseline, 'analysisId')).toBe(false)
  })

  it('trim — empty trimmed string behaves like prepaid credit', () => {
    const f = buildProReportCheckoutStripeCoreFields('   ')
    expect(f.jobfit_product).toBe(JOBFIT_STRIPE_PRO_REPORT_CREDIT)
    expect(f.client_reference_id).toBeUndefined()
  })
})
