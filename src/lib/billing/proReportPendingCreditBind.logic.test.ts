import { describe, expect, it } from 'vitest'

import {
  classifyProReportCreditAnonymousBind,
  type ProReportCreditBindClass,
} from '@/lib/billing/proReportPendingCreditBind.logic'

const want = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const stored = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

function expectClassification(
  input: Parameters<typeof classifyProReportCreditAnonymousBind>[0],
  expected: ProReportCreditBindClass
): void {
  expect(classifyProReportCreditAnonymousBind(input)).toBe(expected)
}

describe('classifyProReportCreditAnonymousBind', () => {
  it('rejects consumed rows', () => {
    expectClassification(
      {
        consumedAt: new Date(),
        storedAnonymousSessionId: null,
        requestedAnonymousSessionId: want,
      },
      'already_consumed'
    )
  })

  it('already bound OK when ids match', () => {
    expectClassification(
      { consumedAt: null, storedAnonymousSessionId: want, requestedAnonymousSessionId: want },
      'already_bound_ok'
    )
  })

  it('needs bind when unpaid row has no stored anon yet', () => {
    expectClassification(
      {
        consumedAt: null,
        storedAnonymousSessionId: null,
        requestedAnonymousSessionId: want,
      },
      'needs_anonymous_bind'
    )
    expectClassification(
      {
        consumedAt: undefined,
        storedAnonymousSessionId: undefined,
        requestedAnonymousSessionId: want,
      },
      'needs_anonymous_bind'
    )
  })

  it('mismatch when different browser-scoped anon is already pinned', () => {
    expectClassification(
      { consumedAt: null, storedAnonymousSessionId: stored, requestedAnonymousSessionId: want },
      'anonymous_session_mismatch'
    )
  })

  it('matches after trimming whitespace on stored anon', () => {
    expectClassification(
      { consumedAt: null, storedAnonymousSessionId: ` ${want} `, requestedAnonymousSessionId: want },
      'already_bound_ok'
    )
  })
})
