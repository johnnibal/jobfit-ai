import { describe, expect, it } from 'vitest'
import {
  buildFreeAnalysisPreview,
  buildFullAnalyzeResponse,
  buildPreviewAnalyzeResponse,
  fullMessageContainsPremiumSectionsBeyondPreview,
  parseAnalyzeSuccessBody,
} from '@/lib/analyze/buildAnalysisPreview'

export const SAMPLE_FULL_ANALYSIS = `Match Score: 87/100

Verdict:
Strong alignment on backend skills with room to sharpen cloud evidence.

Strong Matches:
- Python experience across three roles
- SQL and data modeling

Gaps / Risks:
- Missing Kubernetes production experience
- No German fluency listed

Recommended Resume Improvements:
- Add metrics to your top backend bullet
- Mention API design explicitly
- Highlight team leadership scope
- Add cloud certifications if held
- Quantify deployment frequency impact

Interview Readiness:
You can discuss Python confidently but prepare for questions on orchestration gaps.

Reality Check:
Solid partial fit — apply with tailored CV edits.

ATS Keyword Checklist:
- Python: Present — listed in CV stack
- Kubernetes: Missing — not evidenced in CV
- REST APIs: Partial — implied but not named
`.trim()

describe('buildFreeAnalysisPreview', () => {
  it('returns fit score, summary, and at most 3 suggestions', () => {
    const preview = buildFreeAnalysisPreview(SAMPLE_FULL_ANALYSIS)
    expect(preview.fitScore).toBe(87)
    expect(preview.summary.length).toBeGreaterThan(10)
    expect(preview.suggestions).toHaveLength(3)
    expect(preview.lockedPreview.totalSuggestionCount).toBe(5)
    expect(preview.lockedPreview.hiddenSections).toContain('gaps')
  })

  it('does not embed premium section content in preview fields', () => {
    const preview = buildFreeAnalysisPreview(SAMPLE_FULL_ANALYSIS)
    const blob = JSON.stringify(preview).toLowerCase()
    expect(blob).not.toContain('kubernetes production')
    expect(blob).not.toContain('interview readiness')
    expect(blob).not.toContain('ats keyword')
  })
})

describe('analyze API response shapes', () => {
  it('free preview response omits full message and premium sections', () => {
    const body = buildPreviewAnalyzeResponse('11111111-1111-4111-8111-111111111111', SAMPLE_FULL_ANALYSIS)
    expect(body.fullReportAccess).toBe(false)
    expect(body.accessTier).toBe('free')
    expect('message' in body).toBe(false)
    expect(body.suggestions).toHaveLength(3)
    const previewFields = buildFreeAnalysisPreview(SAMPLE_FULL_ANALYSIS)
    expect(fullMessageContainsPremiumSectionsBeyondPreview(SAMPLE_FULL_ANALYSIS, previewFields)).toBe(
      true
    )
  })

  it('pro/monthly full response includes complete message', () => {
    const body = buildFullAnalyzeResponse(
      '22222222-2222-4222-8222-222222222222',
      SAMPLE_FULL_ANALYSIS,
      'monthly_pro'
    )
    expect(body.fullReportAccess).toBe(true)
    expect(body.message).toContain('Gaps / Risks:')
    expect(body.message).toContain('ATS Keyword Checklist:')
  })

  it('parseAnalyzeSuccessBody handles preview and full payloads', () => {
    const previewRaw = buildPreviewAnalyzeResponse(
      '33333333-3333-4333-8333-333333333333',
      SAMPLE_FULL_ANALYSIS
    )
    const previewParsed = parseAnalyzeSuccessBody(previewRaw as unknown as Record<string, unknown>)
    expect(previewParsed?.fullReportAccess).toBe(false)
    expect(previewParsed?.displayMessage).toContain('Match Score: 87/100')
    expect(previewParsed?.displayMessage).not.toContain('Gaps / Risks')

    const fullRaw = buildFullAnalyzeResponse(
      '44444444-4444-4444-8444-444444444444',
      SAMPLE_FULL_ANALYSIS,
      'pro_report'
    )
    const fullParsed = parseAnalyzeSuccessBody(fullRaw as unknown as Record<string, unknown>)
    expect(fullParsed?.fullReportAccess).toBe(true)
    expect(fullParsed?.displayMessage).toContain('Kubernetes')
  })
})
