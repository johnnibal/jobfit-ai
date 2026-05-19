import { FREE_VISIBLE_SUGGESTION_COUNT } from '@/lib/planTypes'
import { parseAnalysisSections, stripMatchScorePrefix } from '@/lib/parseAnalysis'
import { extractFitScore } from '@/lib/reports/extractReportMeta'
import {
  LOCKED_ANALYSIS_SECTIONS,
  type AnalysisPreviewPayload,
  type AnalyzePreviewResponse,
  type AnalyzeSuccessResponse,
} from '@/lib/analyze/analysisResponseTypes'

const SUMMARY_MAX_CHARS = 320

function truncateSummary(text: string, max = SUMMARY_MAX_CHARS): string {
  const normalized = text.trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max).trimEnd()}…`
}

/** Build server-side free-tier preview — never includes premium section content. */
export function buildFreeAnalysisPreview(fullMessage: string): AnalysisPreviewPayload {
  const sections = parseAnalysisSections(fullMessage)
  const fitScore = extractFitScore(fullMessage)

  let summary = sections.verdictParagraphs.join(' ').trim()
  if (!summary) {
    const stripped = stripMatchScorePrefix(fullMessage).trim()
    summary =
      stripped
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 0 && !/:$/.test(l)) ?? ''
  }

  const allSuggestions = sections.resumeImprovementBullets
  const suggestions = allSuggestions.slice(0, FREE_VISIBLE_SUGGESTION_COUNT)

  return {
    fitScore,
    summary: truncateSummary(summary),
    suggestions,
    lockedPreview: {
      totalSuggestionCount: allSuggestions.length,
      hiddenSections: [...LOCKED_ANALYSIS_SECTIONS],
    },
  }
}

export function buildPreviewAnalyzeResponse(
  analysisId: string,
  fullMessage: string
): AnalyzePreviewResponse {
  const preview = buildFreeAnalysisPreview(fullMessage)
  return {
    analysisId,
    fullReportAccess: false,
    accessTier: 'free',
    fitScore: preview.fitScore,
    summary: preview.summary,
    suggestions: preview.suggestions,
    lockedPreview: preview.lockedPreview,
  }
}

export function buildFullAnalyzeResponse(
  analysisId: string,
  message: string,
  accessTier: 'pro_report' | 'monthly_pro'
): AnalyzeSuccessResponse {
  return {
    analysisId,
    fullReportAccess: true,
    accessTier,
    message,
  }
}

/** Reconstruct minimal display text for the results UI from a preview payload (no premium sections). */
export function buildPreviewDisplayMessage(preview: AnalysisPreviewPayload): string {
  const scoreLine = preview.fitScore != null ? `Match Score: ${preview.fitScore}/100\n\n` : ''
  const suggestionLines = preview.suggestions.map((s) => `- ${s}`).join('\n')
  return `${scoreLine}Verdict:\n${preview.summary}\n\nRecommended Resume Improvements:\n${suggestionLines}`.trim()
}

/** Parse a successful /api/analyze or /api/analyze/result JSON body for the client. */
export function parseAnalyzeSuccessBody(data: Record<string, unknown>): {
  analysisId: string
  displayMessage: string
  fullReportAccess: boolean
  lockedPreview: AnalysisPreviewPayload['lockedPreview'] | null
} | null {
  const analysisId = typeof data.analysisId === 'string' ? data.analysisId.trim() : ''
  if (!analysisId) return null

  if (data.fullReportAccess === true && typeof data.message === 'string' && data.message.trim()) {
    return {
      analysisId,
      displayMessage: data.message.trim(),
      fullReportAccess: true,
      lockedPreview: null,
    }
  }

  if (data.fullReportAccess !== false) return null

  const summary = typeof data.summary === 'string' ? data.summary.trim() : ''
  const suggestions = Array.isArray(data.suggestions)
    ? data.suggestions.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : []
  const fitScore =
    typeof data.fitScore === 'number' && Number.isFinite(data.fitScore)
      ? Math.min(100, Math.max(0, Math.round(data.fitScore)))
      : null

  const lockedRaw = data.lockedPreview
  const lockedPreview =
    lockedRaw &&
    typeof lockedRaw === 'object' &&
    lockedRaw !== null &&
    typeof (lockedRaw as { totalSuggestionCount?: unknown }).totalSuggestionCount === 'number'
      ? {
          totalSuggestionCount: Math.max(
            0,
            Math.floor((lockedRaw as { totalSuggestionCount: number }).totalSuggestionCount)
          ),
          hiddenSections: [...LOCKED_ANALYSIS_SECTIONS],
        }
      : {
          totalSuggestionCount: suggestions.length,
          hiddenSections: [...LOCKED_ANALYSIS_SECTIONS],
        }

  const preview: AnalysisPreviewPayload = {
    fitScore,
    summary,
    suggestions: suggestions.slice(0, FREE_VISIBLE_SUGGESTION_COUNT),
    lockedPreview,
  }

  if (!preview.summary && preview.suggestions.length === 0 && preview.fitScore == null) {
    return null
  }

  return {
    analysisId,
    displayMessage: buildPreviewDisplayMessage(preview),
    fullReportAccess: false,
    lockedPreview: preview.lockedPreview,
  }
}

/** Test helper: true when raw LLM output contains section content not present in preview. */
export function fullMessageContainsPremiumSectionsBeyondPreview(
  fullMessage: string,
  preview: AnalysisPreviewPayload
): boolean {
  const sections = parseAnalysisSections(fullMessage)
  if (sections.gapBullets.some((b) => b.trim().length > 0)) return true
  if (sections.strongMatchBullets.some((b) => b.trim().length > 0)) return true
  if (sections.interviewReadinessLines.some((b) => b.trim().length > 0)) return true
  if (sections.realityCheckParagraphs.some((b) => b.trim().length > 0)) return true
  if (sections.atsBullets.some((b) => b.trim().length > 0)) return true
  if (sections.resumeImprovementBullets.length > preview.suggestions.length) return true
  return false
}
