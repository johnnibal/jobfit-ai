import AnalyzePageClient from './AnalyzePageClient'

type AnalyzePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

export default async function AnalyzePage({ searchParams }: AnalyzePageProps) {
  const params = await searchParams

  return (
    <AnalyzePageClient
      initialReportId={firstParam(params.report)}
      initialSavedRedirect={firstParam(params.saved) === '1'}
    />
  )
}
