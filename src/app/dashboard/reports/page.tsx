import { Suspense } from 'react'
import ReportsDashboardClient from './ReportsDashboardClient'

export default function DashboardReportsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          Loading saved reports…
        </main>
      }
    >
      <ReportsDashboardClient />
    </Suspense>
  )
}
