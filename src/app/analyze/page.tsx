'use client'

import { useState } from 'react'


import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`




export default function AnalyzePage() {
  const [cv, setCv] = useState('')
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
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
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">JobFit Analyzer</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* PDF Upload */}
        <div>
          <label className="block font-medium mb-1">Upload CV (PDF)</label>
          <input
  type="file"
  accept="application/pdf"
  onChange={handlePdfUpload} // ✅ this removes the warning
  className="
             file:rounded file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white file:font-medium file:px-4 file:py-2 file:rounded file:border-0 
             hover:file:bg-black/80 transition cursor-pointer"  
/>

        </div>

        {/* CV Textarea (can be manually edited) */}
        <div>
          <label className="block font-medium mb-1">CV Text (editable)</label>
          <textarea
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            rows={6}
            className="w-full border rounded p-2"
            placeholder="Paste or upload your resume..."
            required
          />
        </div>

        {/* Job Description */}
        <div>
          <label className="block font-medium mb-1">Job Description</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={6}
            className="w-full border rounded p-2"
            placeholder="Paste the job description here..."
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {/* AI Result */}
      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">AI Result:</h2>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </main>
  )
}
