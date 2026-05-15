/**
 * Database `User.id` when the request is authenticated.
 * Hook up NextAuth / Clerk / session cookies here — until then quotas use anonymous sessions only.
 */
export async function getAuthenticatedJobFitUserId(): Promise<string | null> {
  return null
}
