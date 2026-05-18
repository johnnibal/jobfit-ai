import { Suspense } from 'react'
import ReportsDashboardClient from './ReportsDashboardClient'

export default function DashboardReportsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500">
          Loading saved reports…
        </main>
      }
    >
      <ReportsDashboardClient />
    </Suspense>
  )
}
