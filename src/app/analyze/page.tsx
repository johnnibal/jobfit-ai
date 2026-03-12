'use client'

import { useState } from 'react'

function extractMatchScore(result: string | null) {
  if (!result) return null

  const match = result.match(/Match Score:\s*(\d{1,3})\/100/i)
  if (!match) return null

  const score = Number(match[1])
  return Number.isNaN(score) ? null : Math.min(100, Math.max(0, score))
}

function stripMatchScoreLine(result: string) {
  return result.replace(/^Match Score:\s*\d{1,3}\/100\s*\n*/i, '').trim()
}

function isResultSectionHeading(line: string) {
  return [
    'Verdict:',
    'Strong Matches:',
    'Gaps / Risks:',
    'Recommended Resume Improvements:',
    'Interview Readiness:',
    'Reality Check:',
  ].includes(line.trim())
}




export default function AnalyzePage() {
  const [cv, setCv] = useState('')
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const matchScore = extractMatchScore(result)
  const formattedResult = result ? stripMatchScoreLine(result) : null

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const typedarray = new Uint8Array(reader.result as ArrayBuffer)
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise
      let extractedText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = (content.items as any[])
          .map((item) => (typeof item?.str === 'string' ? item.str : ''))
          .join(' ')

        extractedText += pageText + '\n\n'
      }

      setCv(extractedText)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv, jd }),
    })

    const data = await res.json()
    setResult(data.message)
    setLoading(false)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.18),_transparent_30%)]" />
      <div className="absolute left-10 top-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-12 right-12 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl" />

      <section className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-900/70 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            AI-powered fit scoring
          </div>

          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Analyze your
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
              {' '}
              CV against the role
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Upload your resume, paste the job description, and let JobFit.AI highlight alignment,
            gaps, and opportunities to improve your application.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-8"
          >
            <div className="grid gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Upload CV (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-cyan-400 file:to-violet-500 file:px-5 file:py-3 file:font-semibold file:text-slate-950 hover:file:brightness-110"
                />
                <p className="mt-3 text-sm text-slate-400">
                  Upload a PDF to auto-fill your CV text, then edit it if needed.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  CV Text
                </label>
                <textarea
                  value={cv}
                  onChange={(e) => setCv(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Paste your resume text or upload a PDF..."
                  required
                />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                  Job Description
                </label>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                  placeholder="Paste the job description here..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-7 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(56,189,248,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Analyzing your fit...' : 'Analyze Match'}
              </button>
            </div>
          </form>

          <aside className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-100">What you get</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Fit Score</div>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Understand how closely your background matches the role requirements.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Skill Gaps</div>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  See which tools, experiences, or keywords are missing from your profile.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Tailoring Tips</div>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Use the feedback to refine your resume before applying.
                </p>
              </div>
            </div>

            {result ? (
              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-cyan-300">AI Result</h3>
                  {matchScore !== null ? (
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-cyan-400 bg-slate-900 shadow-[0_0_25px_rgba(34,211,238,0.18)]">
                      <div className="absolute inset-[-6px] rounded-full border border-cyan-400/30">
                        <div className="h-full w-full animate-pulse rounded-full border border-cyan-400/20" />
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                          FIT
                        </div>
                        <div className="text-lg font-bold text-cyan-300">{matchScore}%</div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {formattedResult ? (
                  <div className="mt-4 space-y-2 text-sm leading-7 text-slate-300">
                    {formattedResult.split('\n').map((line, index) => {
                      const trimmedLine = line.trim()

                      if (!trimmedLine) {
                        return <div key={index} className="h-2" />
                      }

                      if (isResultSectionHeading(trimmedLine)) {
                        return (
                          <div key={index} className="mt-4 flex items-center gap-2 first:mt-0">
                            <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                            <span className="font-semibold text-cyan-200">{trimmedLine}</span>
                          </div>
                        )
                      }

                      if (trimmedLine.startsWith('- ')) {
                        return (
                          <div key={index} className="pl-4 text-slate-300">
                            {trimmedLine}
                          </div>
                        )
                      }

                      return (
                        <p key={index} className="text-slate-300">
                          {trimmedLine}
                        </p>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-sm leading-7 text-slate-400">
                Your result will appear here after the analysis runs.
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}
