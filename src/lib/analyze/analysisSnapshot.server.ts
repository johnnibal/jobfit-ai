import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/monetizationUsage.server'

/** Dev fallback when DATABASE_URL is unset — not shared across server instances. */
const memorySnapshots = new Map<string, string>()

export async function persistAnalysisSnapshot(analysisId: string, resultText: string): Promise<void> {
  const trimmedId = analysisId.trim()
  const text = resultText.trim()
  if (!trimmedId || !text) return

  if (isDatabaseConfigured()) {
    await prisma.analysisSnapshot.upsert({
      where: { analysisId: trimmedId },
      create: { analysisId: trimmedId, resultText: text },
      update: { resultText: text },
    })
    return
  }

  memorySnapshots.set(trimmedId, text)
}

export async function loadAnalysisSnapshot(analysisId: string): Promise<string | null> {
  const trimmedId = analysisId.trim()
  if (!trimmedId) return null

  if (isDatabaseConfigured()) {
    const row = await prisma.analysisSnapshot.findUnique({
      where: { analysisId: trimmedId },
      select: { resultText: true },
    })
    return row?.resultText?.trim() ? row.resultText : null
  }

  const mem = memorySnapshots.get(trimmedId)
  return mem?.trim() ? mem : null
}

/** Test-only reset for in-memory snapshots. */
export function clearMemoryAnalysisSnapshotsForTests(): void {
  memorySnapshots.clear()
}
