import Link from 'next/link'
import type { Metadata } from 'next'

import { LegalPageShell, LegalSection } from '@/components/legal/LegalPageShell'
import { SITE_CONTACT_EMAIL } from '@/lib/legal/placeholders'

export const metadata: Metadata = {
  title: 'Refund policy · JobFit AI',
  description: 'Draft refund rules for JobFit AI purchases. Replace after legal and payment review.',
}

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      title="Refund policy"
      intro="This is a placeholder policy. Stripe, consumer law where you sell, and your contract terms may require different wording."
    >
      <LegalSection id="placeholder" heading="Placeholder — not finalized">
        <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-amber-100/95">
          {/* TODO(legal): Replace entire page after counsel and finance sign-off. */}
          <strong className="font-semibold">Draft only.</strong> Do not promise refunds you cannot operationally honor.
          Align with Stripe, tax, and EU/UK consumer rules if they apply.
        </p>
      </LegalSection>

      <LegalSection id="general" heading="General approach">
        <p>
          Digital products (analysis access, exports, subscription periods) are often used immediately. Refunds may be{' '}
          <strong className="font-semibold text-slate-200">limited</strong> accordingly. We handle requests case by case and
          in line with mandatory law where it applies.
        </p>
      </LegalSection>

      <LegalSection id="pro-report" heading="Pro Report (one-time)">
        <p>
          If you believe a one-time charge was made in error (for example duplicate payment or technical failure), email us
          at{' '}
          <a className="text-cyan-300 underline-offset-2 hover:underline" href={`mailto:${SITE_CONTACT_EMAIL}`}>
            {SITE_CONTACT_EMAIL}
          </a>{' '}
          with your Stripe receipt details. We may coordinate with Stripe to reverse or refund where appropriate.
          {/* TODO(legal): Define windows: e.g. 14 days EU digital content if waiver not validly obtained. */}
        </p>
      </LegalSection>

      <LegalSection id="monthly-pro" heading="Monthly Pro (subscription)">
        <p>
          Subscription fees already charged for a period that has started may be non-refundable except where the law
          requires otherwise. Cancel before renewal to avoid the next charge (see{' '}
          <Link href="/terms" className="text-cyan-300 underline-offset-2 hover:underline">
            Terms
          </Link>
          ).
        </p>
      </LegalSection>

      <LegalSection id="how" heading="How to request a review">
        <p>
          Send: your account or customer reference if you have one, date and amount, and a short description. We aim to
          reply within a reasonable time; this is not a guaranteed SLA.
          {/* TODO(legal): Set a target response time if you want one. */}
        </p>
      </LegalSection>

      <LegalSection id="chargebacks" heading="Chargebacks">
        <p>
          If you open a payment dispute with your bank, we may share purchase records with Stripe to show delivery of the
          service. Contact us first when possible so we can resolve issues quickly.
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
