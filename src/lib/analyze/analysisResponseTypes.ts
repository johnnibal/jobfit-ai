/** Sections withheld from free-tier /api/analyze responses. */
export const LOCKED_ANALYSIS_SECTIONS = [
  'strong_matches',
  'gaps',
  'interview_readiness',
  'reality_check',
  'ats_checklist',
] as const

export type LockedAnalysisSection = (typeof LOCKED_ANALYSIS_SECTIONS)[number]

export type LockedPreviewMetadata = {
  totalSuggestionCount: number
  hiddenSections: readonly LockedAnalysisSection[]
}

export type AnalysisPreviewPayload = {
  fitScore: number | null
  summary: string
  suggestions: string[]
  lockedPreview: LockedPreviewMetadata
}

export type AnalyzeAccessTier = 'free' | 'pro_report' | 'monthly_pro'

export type AnalyzeFullResponse = {
  analysisId: string
  fullReportAccess: true
  accessTier: 'pro_report' | 'monthly_pro'
  message: string
}

export type AnalyzePreviewResponse = {
  analysisId: string
  fullReportAccess: false
  accessTier: 'free'
  fitScore: number | null
  summary: string
  suggestions: string[]
  lockedPreview: LockedPreviewMetadata
}

export type AnalyzeSuccessResponse = AnalyzeFullResponse | AnalyzePreviewResponse
