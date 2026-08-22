import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for Memory Weaver — the Published Autobiography distribution model, creator copyright retention, and master content controls.',
};

export default function TermsPage() {
  return (
    <div>
      <h1>Terms of Service</h1>
      <p className="lead text-lg text-white/60">
        Welcome to Memory Weaver. These terms govern your use of our spoken memoir production
        suite and family cinema distribution platform.
      </p>

      <hr className="my-8 border-white/10" />

      <h2>1. The Published Autobiography Model</h2>
      <p>
        Memory Weaver operates on a <strong>Published Autobiography</strong> distribution paradigm,
        not a corporate DRM or gated file access model. When you publish a memoir to the Family
        Cinema:
      </p>
      <ul>
        <li>
          A <strong>unique streaming link and high-resolution QR code</strong> are generated for
          your memoir.
        </li>
        <li>
          Anyone with the link or QR code can watch immediately on mobile, desktop, or Smart TV
          with <strong>zero account creation or login wall</strong>.
        </li>
        <li>
          You control distribution by sharing your link or printing your QR poster — just as a
          published author controls where their book is sold.
        </li>
      </ul>

      <h2>2. Creator Copyright & Intellectual Property</h2>
      <p>
        You retain <strong>100% copyright ownership</strong> over all content you create on
        Memory Weaver, including:
      </p>
      <ul>
        <li>Your spoken voice recordings and audio performances</li>
        <li>Written narratives, prose, and memoir text</li>
        <li>Uploaded photographs, videos, and archival media</li>
        <li>Generated poster artwork and cinematic thumbnails</li>
      </ul>
      <p>
        Memory Weaver claims no intellectual property rights over your content. We are granted a
        limited, non-exclusive licence solely to host, store, and stream your content as part of
        the service you have requested.
      </p>

      <h2>3. The Master Kill Switch</h2>
      <p>
        As the Director of your memoir, you maintain absolute sovereign control over your
        published content:
      </p>
      <ul>
        <li>
          <strong>Unpublish:</strong> Instantly removes your memoir from the public Family Cinema.
          All existing streaming links and QR codes become inactive immediately. No viewer can
          access the content after unpublishing.
        </li>
        <li>
          <strong>Delete:</strong> Permanently removes all associated data — video recordings,
          transcripts, poster artwork, and metadata — from our servers. This action is
          irreversible.
        </li>
      </ul>
      <p>
        You do not need to manage individual access lists or revoke permissions one by one. A
        single action controls all access globally.
      </p>

      <h2>4. Family Cinema & Guest Access</h2>
      <p>
        The Family Cinema is the public screening room where published memoirs are available for
        viewing. Key terms:
      </p>
      <ul>
        <li>
          <strong>Guest Viewers</strong> can watch published memoirs without creating an account.
          They may leave reactions and questions via the guest interaction system.
        </li>
        <li>
          <strong>Claiming a Memoir</strong> (for logged-in family members) functions as
          &quot;Add to My Family Bookshelf&quot; — a persistent bookmark in their personal
          screening room. Claiming does not transfer ownership or grant editing rights.
        </li>
        <li>
          Guest viewing passes may be required for accessing certain shared family archives.
        </li>
      </ul>

      <h2>5. Account Terms</h2>
      <ul>
        <li>You must be at least 16 years of age to create an account.</li>
        <li>You are responsible for maintaining the security of your account credentials.</li>
        <li>
          One complimentary 6-Month Director Host Pass may be claimed per account. This pass
          cannot be transferred.
        </li>
        <li>
          Paid passes (31-Day Director Pass, Generational Vault) are non-recurring, single
          payments. No automatic renewals.
        </li>
      </ul>

      <h2>6. Acceptable Use</h2>
      <p>You agree not to use Memory Weaver to:</p>
      <ul>
        <li>Upload content that infringes on others&apos; intellectual property rights</li>
        <li>Publish content containing hate speech, harassment, or illegal material</li>
        <li>Attempt to circumvent access controls or security measures</li>
        <li>Use automated systems to scrape, mirror, or redistribute content</li>
        <li>Impersonate another person or misrepresent your identity</li>
      </ul>

      <h2>7. Service Availability & Data Preservation</h2>
      <p>
        We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. Your
        data is stored on Google Cloud infrastructure with industry-standard redundancy and
        encryption. In the event of service discontinuation, we will provide at least 90 days&apos;
        notice and data export tools.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        Memory Weaver is provided &quot;as is&quot; without warranties of any kind. To the maximum
        extent permitted by law, we shall not be liable for any indirect, incidental, special,
        or consequential damages arising from your use of the service. Our total liability shall
        not exceed the amount you have paid to us in the 12 months preceding any claim.
      </p>

      <h2>9. Governing Law</h2>
      <p>
        These terms are governed by the laws of <strong>England and Wales</strong>. Any disputes
        shall be subject to the exclusive jurisdiction of the courts of England and Wales.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>
        We may update these terms from time to time. Material changes will be notified via email
        to your registered address at least 30 days before taking effect. Continued use of the
        service after changes take effect constitutes acceptance of the updated terms.
      </p>

      <hr className="my-8 border-white/10" />

      <p className="text-sm text-white/40">
        If you have questions about these terms, please contact us at{' '}
        <a href="mailto:support@memoryweaver.studio">support@memoryweaver.studio</a>.
      </p>
    </div>
  );
}
