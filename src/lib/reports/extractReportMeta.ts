/** Fit score from standardized LLM analysis output. */
export function extractFitScore(resultText: string): number | null {
  const m = resultText.match(/Match Score:\s*(\d{1,3})\/100/i)
  if (!m) return null
  const n = Number(m[1])
  if (Number.isNaN(n)) return null
  return Math.min(100, Math.max(0, n))
}

const GENERIC_SKIP =
  /^(job\s*description|stellenausschreibung|about\s+the\s+role|über\s+die\s+stelle|posted|veröffentlicht|vom\s)/i

/** Lightweight DE/EN heuristics — never invent; omit when unclear. */
export function guessJobPostingMeta(jd: string): { jobTitle: string | null; companyName: string | null } {
  const lines = jd
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^https?:\/\//i.test(l))

  let jobTitle: string | null = null
  for (const line of lines.slice(0, 10)) {
    if (line.length > 200) continue
    if (GENERIC_SKIP.test(line)) continue
    jobTitle = line.slice(0, 200)
    break
  }

  let companyName: string | null = null
  const bei = jd.match(/\b(?:bei|at)\s+([A-Za-zÀ-ÿÄÖÜäöüß0-9&][A-Za-zÀ-ÿÄÖÜäöüß0-9&\s.'+\-]{1,78})(?=[,.\n]|$)/iu)
  if (bei) companyName = bei[1].trim()

  const companyLine = jd.match(/(?:^|\n)\s*(?:company|firma|arbeitgeber|employer)\s*[:\\-]\s*(.+)/iu)
  if (!companyName?.trim() && companyLine) {
    companyName = companyLine[1].trim().slice(0, 200)
  }

  return {
    jobTitle,
    companyName: companyName?.trim() ? companyName.trim().slice(0, 200) : null,
  }
}
