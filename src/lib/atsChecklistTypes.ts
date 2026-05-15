/** Structured ATS checklist returned by `/api/ats-checklist` (premium only). */

export type AtsKeywordEvidence = {
  phrase: string
  /** Short evidence tied to CV text — omit if unknown */
  cvEvidenceNote?: string
}

export type AtsPlacementHint = {
  keyword: string
  suggestion: string
}

export type AtsAuthenticityWarning = {
  keyword: string
  warning: string
}

export type AtsChecklistPremium = {
  requiredFoundInCv: AtsKeywordEvidence[]
  requiredMissingFromCv: AtsKeywordEvidence[]
  niceToHave: AtsKeywordEvidence[]
  suggestedPlacements: AtsPlacementHint[]
  authenticityWarnings: AtsAuthenticityWarning[]
}

function trimStr(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length ? t : null
}

function parseEvidenceArray(raw: unknown, keys: ('phrase' | 'keyword')[]): AtsKeywordEvidence[] {
  if (!Array.isArray(raw)) return []
  const out: AtsKeywordEvidence[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      const p = trimStr(item)
      if (p) out.push({ phrase: p })
      continue
    }
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    let phrase: string | null = null
    for (const k of keys) {
      phrase = trimStr(rec[k])
      if (phrase) break
    }
    if (!phrase) continue
    const cvEvidenceNote = trimStr(rec.cvEvidenceNote) ?? trimStr(rec.evidenceNote) ?? trimStr(rec.note) ?? undefined
    out.push(cvEvidenceNote ? { phrase, cvEvidenceNote } : { phrase })
  }
  return out
}

function parsePlacementArray(raw: unknown): AtsPlacementHint[] {
  if (!Array.isArray(raw)) return []
  const out: AtsPlacementHint[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const keyword = trimStr(rec.keyword) ?? trimStr(rec.phrase)
    const suggestion = trimStr(rec.suggestion) ?? trimStr(rec.placement) ?? trimStr(rec.idea)
    if (keyword && suggestion) out.push({ keyword, suggestion })
  }
  return out
}

function parseWarningArray(raw: unknown): AtsAuthenticityWarning[] {
  if (!Array.isArray(raw)) return []
  const out: AtsAuthenticityWarning[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const keyword = trimStr(rec.keyword) ?? trimStr(rec.phrase)
    const warning = trimStr(rec.warning) ?? trimStr(rec.reason)
    if (keyword && warning) out.push({ keyword, warning })
  }
  return out
}

/** Best-effort parse from LLM JSON — drops invalid entries; returns null if unusable. */
export function parseAtsChecklistPremium(raw: unknown): AtsChecklistPremium | null {
  if (!raw || typeof raw !== 'object') return null
  const rec = raw as Record<string, unknown>

  const requiredFoundInCv = parseEvidenceArray(rec.requiredFoundInCv, ['phrase', 'keyword'])
  const requiredMissingFromCv = parseEvidenceArray(rec.requiredMissingFromCv, ['phrase', 'keyword'])
  const niceToHave = parseEvidenceArray(rec.niceToHave, ['phrase', 'keyword'])
  const suggestedPlacements = parsePlacementArray(rec.suggestedPlacements)
  const authenticityWarnings = parseWarningArray(rec.authenticityWarnings)

  const total =
    requiredFoundInCv.length +
    requiredMissingFromCv.length +
    niceToHave.length +
    suggestedPlacements.length +
    authenticityWarnings.length

  if (total === 0) return null

  return {
    requiredFoundInCv,
    requiredMissingFromCv,
    niceToHave,
    suggestedPlacements,
    authenticityWarnings,
  }
}
