import type { Metadata } from 'next'

import { LegalPageShell, LegalSection } from '@/components/legal/LegalPageShell'
import { SITE_CONTACT_EMAIL } from '@/lib/legal/placeholders'

export const metadata: Metadata = {
  title: 'Imprint (Impressum) · JobFit AI',
  description:
    'Provider information for Germany (Impressum). Replace all placeholders with legally verified company details.',
}

export default function ImprintPage() {
  return (
    <LegalPageShell
      title="Imprint"
      intro="Statutory provider identification (Impressum) for visitors from Germany. Replace every placeholder below with details your lawyer confirms."
    >
      <LegalSection id="provider" heading="Service provider">
        <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-amber-100/95">
          {/* TODO(legal): Replace with registered company or sole trader details. */}
          <strong className="font-semibold">Placeholder — not a real entry.</strong> Add legal name, legal form, and
          registration number as required.
        </p>
        <ul className="list-none space-y-2 text-slate-400">
          <li>
            <span className="text-slate-500">Legal name: </span>[TODO — e.g. Example GmbH]
          </li>
          <li>
            <span className="text-slate-500">Address: </span>[TODO — street, postcode, city, Germany]
          </li>
          <li>
            <span className="text-slate-500">Email: </span>
            <a className="text-cyan-300 underline-offset-2 hover:underline" href={`mailto:${SITE_CONTACT_EMAIL}`}>
              {SITE_CONTACT_EMAIL}
            </a>{' '}
            (replace)
          </li>
          <li>
            <span className="text-slate-500">Phone: </span>[TODO — optional if required for your entity type]
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="representatives" heading="Representatives and registration">
        <p className="text-slate-400">
          {/* TODO(legal): Managing directors (Geschäftsführer), registry court, HRB number, VAT ID, etc. */}
          [TODO — authorized representatives, commercial register, VAT identification number if applicable.]
        </p>
      </LegalSection>

      <LegalSection id="content-liability" heading="Liability for content">
        <p>
          As a service provider we are responsible for our own content on these pages under general law. We are not
          obliged to monitor third-party information we transmit or store or to investigate circumstances pointing to
          illegal activity unless required by statute.
          {/* TODO(legal): Standard Impressum liability sections after review (German template). */}
        </p>
      </LegalSection>

      <LegalSection id="disputes" heading="Dispute resolution">
        <p>
          The European Commission provides a platform for online dispute resolution (ODR):{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-300 underline-offset-2 hover:underline"
          >
            https://ec.europa.eu/consumers/odr
          </a>
          . We are <strong className="font-semibold text-slate-200">not</strong> obliged and currently{' '}
          <strong className="font-semibold text-slate-200">not</strong> willing to participate in dispute resolution before
          a consumer arbitration board, unless we state otherwise after legal advice.
          {/* TODO(legal): Update if you join a recognised body (§ 36 VSBG). */}
        </p>
      </LegalSection>

      <LegalSection id="notes" heading="Note">
        <p className="text-slate-500">
          This imprint does not confirm that any particular regulatory requirement is fully met. Verification is your
          responsibility with qualified counsel.
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
