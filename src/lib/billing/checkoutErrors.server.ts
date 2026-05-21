import { Prisma } from '@prisma/client'
import Stripe from 'stripe'

export function isPrismaSchemaError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2021' || error.code === 'P2010' || error.code === 'P1001')
  )
}

export function checkoutErrorResponse(error: unknown) {
  if (isPrismaSchemaError(error)) {
    return {
      status: 503 as const,
      body: {
        error: 'Database schema is not ready. Run prisma migrate deploy on the server.',
        code: 'MIGRATIONS_REQUIRED' as const,
      },
    }
  }

  if (error instanceof Stripe.errors.StripeError) {
    const detail =
      error.code === 'resource_missing'
        ? 'A price ID was not found in this Stripe account/mode. Copy Price ids (price_…) from the same Live/Test mode as your secret key.'
        : error.message

    return {
      status: 502 as const,
      body: {
        error: detail,
        code: 'STRIPE_ERROR' as const,
        stripeType: error.type,
        stripeCode: error.code ?? null,
      },
    }
  }

  if (error instanceof Error && error.message.includes('JOBFIT_USAGE_SECRET')) {
    return {
      status: 503 as const,
      body: {
        error: 'Checkout signing secret is not configured.',
        code: 'CONFIG_INCOMPLETE' as const,
        missing: ['JOBFIT_USAGE_SECRET'] as const,
      },
    }
  }

  return {
    status: 500 as const,
    body: {
      error: 'Unable to start checkout. Try again shortly.',
      code: 'CHECKOUT_FAILED' as const,
    },
  }
}
