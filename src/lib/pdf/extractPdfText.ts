type PdfTextItem = {
  str?: string
  transform?: number[]
  width?: number
  height?: number
  hasEOL?: boolean
}

type PositionedText = {
  str: string
  x: number
  y: number
  width: number
  height: number
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function toPositionedItems(items: PdfTextItem[]): PositionedText[] {
  const positioned: PositionedText[] = []
  for (const item of items) {
    const str = item.str?.trim()
    const transform = item.transform
    if (!str || !transform || transform.length < 6) continue
    positioned.push({
      str,
      x: transform[4],
      y: transform[5],
      width: item.width ?? 0,
      height: item.height ?? 12,
    })
  }
  return positioned
}

function joinLine(items: PositionedText[]): string {
  const sorted = [...items].sort((a, b) => a.x - b.x)
  let line = sorted[0].str
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const prevEnd = prev.x + prev.width
    const gap = curr.x - prevEnd
    if (gap > 28) line += `\t${curr.str}`
    else if (gap > 6 || !line.endsWith(' ')) line += ` ${curr.str}`
    else line += curr.str
  }
  return line.trim()
}

/** Rebuild page text using x/y positions so CV sections keep line order. */
export function layoutPdfPageText(items: PdfTextItem[]): string {
  const positioned = toPositionedItems(items)
  if (positioned.length === 0) return ''

  const lineTolerance = Math.max(3, median(positioned.map((item) => item.height)) * 0.45)
  const sorted = [...positioned].sort((a, b) => b.y - a.y || a.x - b.x)

  const lineGroups: PositionedText[][] = []
  let currentLine: PositionedText[] = []
  let currentY = sorted[0].y

  for (const item of sorted) {
    if (currentLine.length === 0 || Math.abs(item.y - currentY) <= lineTolerance) {
      currentLine.push(item)
      currentY =
        currentLine.length === 1 ? item.y : currentLine.reduce((sum, part) => sum + part.y, 0) / currentLine.length
    } else {
      lineGroups.push(currentLine)
      currentLine = [item]
      currentY = item.y
    }
  }
  if (currentLine.length > 0) lineGroups.push(currentLine)

  const lineYs = lineGroups.map((group) => group.reduce((sum, part) => sum + part.y, 0) / group.length)
  const gaps: number[] = []
  for (let i = 1; i < lineYs.length; i++) {
    const gap = lineYs[i - 1] - lineYs[i]
    if (gap > 0) gaps.push(gap)
  }
  const typicalGap = median(gaps) || lineTolerance

  const lines: string[] = []
  for (let i = 0; i < lineGroups.length; i++) {
    if (i > 0) {
      const gap = lineYs[i - 1] - lineYs[i]
      if (gap > typicalGap * 1.6) lines.push('')
    }
    lines.push(joinLine(lineGroups[i]))
  }

  return lines.join('\n')
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Extract plain text from a CV PDF in the browser (pdf.js). */
export async function extractTextFromPdfFile(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = layoutPdfPageText(content.items as PdfTextItem[])
    if (pageText) pages.push(pageText)
  }

  const text = normalizeExtractedText(pages.join('\n\n'))
  if (!text) {
    throw new Error(
      'No text could be extracted from this PDF. If it is a scanned image, paste your CV text manually.'
    )
  }

  return text
}
