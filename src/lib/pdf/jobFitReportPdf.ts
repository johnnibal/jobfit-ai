export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type JobFitPdfInput = {
  matchScore: number | null
  summary: string
  matchingSkills: string[]
  missingSkills: string[]
  suggestions: string[]
  atsKeywords: string[]
  coverLetter: string | null
  generatedAt: Date
}

function bulletBlock(items: string[]): string {
  if (!items.length) {
    return '<p class="muted">No structured lines were extracted from this analysis.</p>'
  }
  return `<ul>${items.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
}

function section(title: string, inner: string): string {
  return `<section class="pdf-section"><h2>${escapeHtml(title)}</h2>${inner}</section>`
}

export function buildJobFitReportPdfHtml(input: JobFitPdfInput): string {
  const dateStr = input.generatedAt.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const scoreInner =
    input.matchScore !== null
      ? `<div class="score-row"><div class="score-pill"><span class="score-num">${input.matchScore}</span><span class="score-denom">/100</span></div></div>`
      : '<p class="muted">Score could not be parsed from this analysis.</p>'

  const coverBlock = input.coverLetter
    ? section(
        'Cover letter',
        `<div class="letter-body">${escapeHtml(input.coverLetter).replace(/\n/g, '<br/>')}</div>`
      )
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>JobFit AI — Application report</title>
<style>
  @page { margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px;
    font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #0f172a;
    background: #fff;
  }
  .wrap { max-width: 680px; margin: 0 auto; }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    padding-bottom: 16px;
    margin-bottom: 22px;
    border-bottom: 2px solid #0ea5e9;
  }
  .brand {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: #0891b2;
  }
  .brand-tag {
    margin-top: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #64748b;
  }
  .meta {
    font-size: 10pt;
    color: #64748b;
    text-align: right;
  }
  .score-row { margin-top: 4px; }
  .score-pill {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 999px;
    background: linear-gradient(135deg, #ecfeff 0%, #f5f3ff 100%);
    border: 1px solid #bae6fd;
  }
  .score-num { font-size: 32px; font-weight: 800; color: #0e7490; line-height: 1; }
  .score-denom { font-size: 14px; font-weight: 700; color: #64748b; }
  .pdf-section {
    margin-bottom: 22px;
    page-break-inside: avoid;
  }
  .pdf-section h2 {
    margin: 0 0 10px;
    padding-left: 10px;
    border-left: 3px solid #7c3aed;
    font-size: 10.5pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #1e293b;
  }
  .summary {
    margin: 0;
    color: #334155;
    font-size: 11pt;
  }
  ul {
    margin: 0;
    padding-left: 20px;
  }
  li {
    margin-bottom: 8px;
    color: #334155;
  }
  .letter-body {
    margin: 0;
    padding: 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    font-size: 10.5pt;
    color: #1e293b;
    white-space: pre-wrap;
  }
  footer.disclaimer {
    margin-top: 28px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 9.5pt;
    color: #64748b;
    font-style: italic;
    line-height: 1.45;
  }
  .muted { color: #94a3b8; font-style: italic; margin: 0; }

  @media print {
    body { padding: 0; }
    .brand { color: #0e7490 !important; }
  }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <div class="brand">JobFit AI</div>
      <div class="brand-tag">Application fit report</div>
    </div>
    <div class="meta">${escapeHtml(dateStr)}</div>
  </header>

  ${section('Fit score', scoreInner)}
  ${section('Summary', `<p class="summary">${escapeHtml(input.summary).replace(/\n/g, '<br/>')}</p>`)}
  ${section('Matching skills', bulletBlock(input.matchingSkills))}
  ${section('Missing skills', bulletBlock(input.missingSkills))}
  ${section('Improvement suggestions', bulletBlock(input.suggestions))}
  ${section('ATS keyword checklist', bulletBlock(input.atsKeywords))}
  ${coverBlock}

  <footer class="disclaimer">${escapeHtml('AI-generated career guidance. Review before sending.')}</footer>
</div>
</body>
</html>`
}
