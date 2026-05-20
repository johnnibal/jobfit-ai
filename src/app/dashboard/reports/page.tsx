import { Suspense } from 'react'
import ReportsDashboardClient from './ReportsDashboardClient'
import { pageMain, textMuted } from '@/components/ui/theme'

export default function DashboardReportsPage() {
  return (
    <Suspense
      fallback={
        <main className={`flex min-h-screen items-center justify-center ${pageMain}`}>
          <p className={textMuted}>Loading saved reports…</p>
        </main>
      }
    >
      <ReportsDashboardClient />
    </Suspense>
  )
}
