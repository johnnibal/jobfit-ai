/** Stripe statuses that grant Monthly Pro product access (paid / trial). */
export function subscriptionGrantsMonthlyPro(status: string): boolean {
  return status === 'active' || status === 'trialing'
}
