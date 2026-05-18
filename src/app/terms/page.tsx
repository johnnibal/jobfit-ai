import type { Metadata } from 'next'

import { LegalPageShell, LegalSection } from '@/components/legal/LegalPageShell'
import { SITE_CONTACT_EMAIL } from '@/lib/legal/placeholders'

export const metadata: Metadata = {
  title: 'Terms of use · JobFit AI',
  description:
    'Terms for using JobFit AI, including AI limitations, payments, and cancellations. Draft for review, not legal advice.',
}

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of use"
      intro="These terms describe how you may use JobFit AI. They are written to be readable; a lawyer should confirm they fit your company and product before you rely on them."
    >
      <LegalSection id="service" heading="The service">
        <p>
          JobFit AI provides software that compares CV text with job posting text and produces scores, suggestions,
          checklists, and optional exports. Features depend on your plan (free, Pro Report, or Monthly Pro).
        </p>
      </LegalSection>

      <LegalSection id="not-advice" heading="Not career, legal, or tax advice">
        <p>
          Output is <strong className="font-semibold text-zinc-900">informational</strong> and may be wrong or incomplete.
          It is not professional career, legal, immigration, or tax advice. For those topics, consult a qualified person.
        </p>
      </LegalSection>

      <LegalSection id="ai-outcomes" heading="AI guidance: no guaranteed results">
        <p>
          Suggestions and scores are generated automatically. They do <strong className="font-semibold text-zinc-900">
            not
          </strong>{' '}
          guarantee that you will pass screening, get an interview, or receive a job offer. Market conditions, employer
          preferences, and other factors always apply.
        </p>
      </LegalSection>

      <LegalSection id="review" heading="You review before sending">
        <p>
          You are responsible for checking any CV, cover letter, or email you send to third parties. Proofread for
          accuracy, tone, and facts. Do not misrepresent your experience.
        </p>
      </LegalSection>

      <LegalSection id="pro-report" heading="Pro Report (one-time payment)">
        <p>
          Pro Report is a <strong className="font-semibold text-zinc-900">one-time</strong> purchase for deeper analysis
          and related features for a specific analysis run, billed through Stripe at the price shown at checkout. Access is
          tied to the purchase and our technical rules (for example analysis id and Stripe records).
          {/* TODO(legal): Describe exact deliverables, territorial tax, and VAT/sales tax handling with Stripe. */}
        </p>
        <p>
          Unless a separate refund promise applies (see our refund policy), charges are generally final after successful
          checkout. {/* TODO(legal): Match Refund policy cross-link and consumer cancellation rights (EU/DE). */}
        </p>
      </LegalSection>

      <LegalSection id="monthly-pro" heading="Monthly Pro (subscription)">
        <p>
          Monthly Pro is a <strong className="font-semibold text-zinc-900">recurring subscription</strong> billed via
          Stripe until cancelled. Your plan page and Stripe receipt state the billing interval and price.
        </p>
        <p>
          You may <strong className="font-semibold text-zinc-900">cancel</strong> before the next renewal using the
          customer portal or cancellation path we provide (often linked from the app or email from Stripe). Cancelling
          stops future charges; it does not automatically refund past billing periods unless required by law or our refund
          policy.
          {/* TODO(legal): Mandatory consumer wording for EU/DE subscription cancellation (instructions, timing). */}
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" heading="Acceptable use">
        <p>
          Do not misuse the service (for example automated abuse, probing security, infringing others&apos; rights, or
          violating employment or confidentiality duties). We may suspend access for serious breaches.
          {/* TODO(legal): Expand prohibited uses and enforcement with counsel. */}
        </p>
      </LegalSection>

      <LegalSection id="limitation" heading="Limitation of liability (summary)">
        <p className="text-slate-400">
          {/* TODO(legal): Replace with counsel-approved clause. */}
          To the fullest extent permitted by applicable law, JobFit AI and its operators are not liable for indirect or
          consequential losses arising from your use of the service or reliance on AI output. Some jurisdictions do not
          allow certain exclusions; in those cases limits apply only as far as the law permits.
        </p>
      </LegalSection>

      <LegalSection id="law" heading="Governing law and disputes">
        <p className="text-slate-400">
          {/* TODO(legal): Choose governing law and venue (often Germany/EU if you operate there); add mediation or arbitration if needed. */}
          The law and courts that apply to disputes depend on where your business is incorporated and where customers are
          located. Replace this paragraph after legal advice.
        </p>
      </LegalSection>

      <LegalSection id="contact-terms" heading="Contact">
        <p>
          <a className="text-zinc-700 underline-offset-2 hover:underline" href={`mailto:${SITE_CONTACT_EMAIL}`}>
            {SITE_CONTACT_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
