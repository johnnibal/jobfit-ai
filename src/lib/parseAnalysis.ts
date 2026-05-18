export type ParsedAnalysisSections = {
  verdictParagraphs: string[]
  strongMatchBullets: string[]
  gapBullets: string[]
  resumeImprovementBullets: string[]
  interviewReadinessLines: string[]
  realityCheckParagraphs: string[]
  atsBullets: string[]
}

const HEADINGS = [
  { key: 'verdictParagraphs', label: 'Verdict:' },
  { key: 'strongMatchBullets', label: 'Strong Matches:' },
  { key: 'gapBullets', label: 'Gaps / Risks:' },
  { key: 'resumeImprovementBullets', label: 'Recommended Resume Improvements:' },
  { key: 'interviewReadinessLines', label: 'Interview Readiness:' },
  { key: 'realityCheckParagraphs', label: 'Reality Check:' },
  { key: 'atsBullets', label: 'ATS Keyword Checklist:' },
] as const

type SectionKey = (typeof HEADINGS)[number]['key']

function emptySections(): ParsedAnalysisSections {
  return {
    verdictParagraphs: [],
    strongMatchBullets: [],
    gapBullets: [],
    resumeImprovementBullets: [],
    interviewReadinessLines: [],
    realityCheckParagraphs: [],
    atsBullets: [],
  }
}

export function stripMatchScorePrefix(raw: string): string {
  return raw.replace(/^Match Score:\s*\d{1,3}\/100\s*\n*/i, '').trim()
}

/** True when the analyzer returned a structured fit report (not a plain error/status string). */
export function isFitAnalysisOutput(raw: string): boolean {
  return /Match Score:\s*\d{1,3}\/100/i.test(raw)
}

/**
 * Best-effort structured parse of the LLM template. Unknown shapes degrade gracefully (sections may be empty).
 */
export function parseAnalysisSections(raw: string): ParsedAnalysisSections {
  const body = stripMatchScorePrefix(raw)
  const lines = body.split('\n')

  const sections = emptySections()
  let current: SectionKey | null = null

  const bulletKeys = new Set<SectionKey>([
    'strongMatchBullets',
    'gapBullets',
    'resumeImprovementBullets',
    'atsBullets',
  ])

  for (const line of lines) {
    const trimmed = line.trim()
    const heading = HEADINGS.find((h) => h.label === trimmed)
    if (heading) {
      current = heading.key
      continue
    }

    if (!current) continue

    if (trimmed.startsWith('- ')) {
      const content = trimmed.slice(2).trim()
      if (bulletKeys.has(current)) {
        sections[current].push(content)
      } else if (current === 'interviewReadinessLines') {
        sections.interviewReadinessLines.push(content)
      } else {
        sections[current].push(content)
      }
      continue
    }

    if (!trimmed) continue

    if (bulletKeys.has(current)) {
      sections[current].push(trimmed)
      continue
    }

    sections[current].push(trimmed)
  }

  return sections
}
