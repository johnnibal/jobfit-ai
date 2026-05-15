/** Normalized public URL with no trailing slash. */
export function getPublicAppUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL
  if (!raw?.trim()) return null
  return raw.replace(/\/+$/, '')
}
