import { Suspense } from 'react'
import AnalyzePageClient from './AnalyzePageClient'

export default function AnalyzePage() {
 return (
 <Suspense
 fallback={
 <main className="flex min-h-screen items-center justify-center bg-page text-dim">
 Loading analyzer…
 </main>
 }
 >
 <AnalyzePageClient />
 </Suspense>
 )
}
