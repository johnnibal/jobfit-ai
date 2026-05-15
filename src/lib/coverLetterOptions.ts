export const COVER_LETTER_LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'de_b1', label: 'German B1' },
  { id: 'de_b2', label: 'German B2' },
  { id: 'de_prof', label: 'Professional German' },
] as const

export type CoverLetterLanguageId = (typeof COVER_LETTER_LANGUAGES)[number]['id']

export const COVER_LETTER_TONES = [
  { id: 'formal', label: 'Formal' },
  { id: 'natural', label: 'Natural' },
  { id: 'confident', label: 'Confident' },
] as const

export type CoverLetterToneId = (typeof COVER_LETTER_TONES)[number]['id']

export function coverLetterLanguagePrompt(id: CoverLetterLanguageId): string {
  switch (id) {
    case 'en':
      return 'Write the entire letter in clear, polished English suitable for a professional job application.'
    case 'de_b1':
      return 'Write the entire letter in German at a solid B1 level: straightforward sentences, common workplace vocabulary, and correct but not overly complex grammar. Prefer shorter sentences.'
    case 'de_b2':
      return 'Write the entire letter in German at B2 level: natural connectors, varied sentence structure, and professional vocabulary while staying understandable.'
    case 'de_prof':
      return 'Write the entire letter in professional German suitable for corporate roles (standard business Deutsch), precise wording, formal register unless tone instructions conflict.'
    default:
      return 'Write in English.'
  }
}

export function coverLetterTonePrompt(id: CoverLetterToneId): string {
  switch (id) {
    case 'formal':
      return 'Tone: formal and respectful (use appropriate formal address for the chosen language, e.g. “Sie” in German). Conservative business phrasing.'
    case 'natural':
      return 'Tone: natural and conversational-professional — warm and human without slang; still interview-safe.'
    case 'confident':
      return 'Tone: confident and concise — assertive about factual strengths from the CV; never boastful or speculative.'
    default:
      return 'Tone: professional.'
  }
}

export function parseCoverLetterLanguage(raw: unknown): CoverLetterLanguageId | null {
  const id = typeof raw === 'string' ? raw.trim() : ''
  return COVER_LETTER_LANGUAGES.some((l) => l.id === id) ? (id as CoverLetterLanguageId) : null
}

export function parseCoverLetterTone(raw: unknown): CoverLetterToneId | null {
  const id = typeof raw === 'string' ? raw.trim() : ''
  return COVER_LETTER_TONES.some((t) => t.id === id) ? (id as CoverLetterToneId) : null
}
