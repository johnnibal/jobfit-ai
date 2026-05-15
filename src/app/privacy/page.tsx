import type { Metadata } from 'next'

import { LegalPageShell, LegalSection } from '@/components/legal/LegalPageShell'
import { SITE_CONTACT_EMAIL } from '@/lib/legal/placeholders'

export const metadata: Metadata = {
  title: 'Privacy · JobFit AI',
  description:
    'How JobFit AI handles your CV, job text, and billing data. Plain-language summary — not a certified legal document.',
}

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy"
      intro="Plain-language summary of how we treat information you enter in JobFit AI. This page is not offered as proof of any specific law or regulation."
    >
      <LegalSection id="who" heading="Who this applies to">
        <p>
          This notice is for visitors and customers of JobFit AI who use the analyzer, optional email capture, or paid
          plans (Pro Report and Monthly Pro via Stripe).
        </p>
      </LegalSection>

      <LegalSection id="cv-data" heading="CV, job description, and analysis">
        <p>
          To run a match analysis, you paste or upload text (for example CV content and a job posting). That content is sent
          to our systems to generate scores and suggestions. We do{' '}
          <strong className="font-semibold text-slate-200">not</strong> use this text to train public or shared machine
          learning models for third parties unless we tell you otherwise in a separate, clear notice.
          {/* TODO(legal): Confirm retention period, logs, subprocessors, and any model-training policy with engineering. */}
        </p>
        <p>
          <strong className="font-semibold text-slate-200">Do not</strong> paste information you are not allowed to share
          (for example highly sensitive personal data of others, or employer-confidential material) unless you have
          permission.
        </p>
      </LegalSection>

      <LegalSection id="ai" heading="AI-generated output">
        <p>
          Scores, checklists, cover-letter drafts, and other outputs are generated automatically. They may be incomplete,
          outdated, or unsuitable for your situation. They are <strong className="font-semibold text-slate-200">guidance
          only</strong> and do <strong className="font-semibold text-slate-200">not</strong> guarantee interviews, offers,
          or any job outcome.
        </p>
        <p>
          You should <strong className="font-semibold text-slate-200">review every CV, letter, and suggestion</strong>{' '}
          before you send it to an employer or recruiter. You remain responsible for what you submit.
        </p>
      </LegalSection>

      <LegalSection id="billing" heading="Payments and account identifiers">
        <p>
          Paid features are handled by <strong className="font-semibold text-slate-200">Stripe</strong>. We may store
          identifiers such as Stripe customer or session ids linked to your browser or account flow to provide access to
          purchased reports and subscriptions.
          {/* TODO(legal): List Stripe data categories and link to Stripe privacy policy as required. */}
        </p>
      </LegalSection>

      <LegalSection id="email" heading="Email and marketing">
        <p>
          If you choose to submit your email with consent, we store it only for the purposes described at collection (for
          example sending a report or product updates you agreed to). We do not sell your email as a separate product.
          {/* TODO(legal): Align with actual email provider, double opt-in where required, unsubscribe process. */}
        </p>
      </LegalSection>

      <LegalSection id="rights" heading="Your choices">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, or restrict certain processing of
          personal data. Contact us at the address below and we will respond in line with applicable law.
          {/* TODO(legal): Add EU/UK-specific sections and response timelines after counsel review. */}
        </p>
        <p className="text-slate-500">
          Nothing on this page claims that our practices have been audited or certified unless we publish a separate,
          verified statement.
        </p>
      </LegalSection>

      <LegalSection id="contact" heading="Contact">
        <p>
          Privacy-related requests:{' '}
          <a className="text-cyan-300 underline-offset-2 hover:underline" href={`mailto:${SITE_CONTACT_EMAIL}`}>
            {SITE_CONTACT_EMAIL}
          </a>
          . {/* TODO(legal): Add DPO or EU representative if mandatory. */}
        </p>
      </LegalSection>

      <LegalSection id="changes" heading="Updates">
        <p>
          We may update this page when our product or vendors change.{' '}
          {/* TODO(legal): Add version and “last updated” date after approval. */}
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
