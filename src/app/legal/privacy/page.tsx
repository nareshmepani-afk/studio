import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Memory Weaver Studio — UK GDPR compliance, Zero-AI-Training Guarantee, data retention schedules, and subprocessor transparency.',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-white prose-p:leading-relaxed prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white/95 prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline">
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">Privacy Policy</h1>

      {/* The Zero-AI-Training Guarantee Callout */}
      <div className="my-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 backdrop-blur-sm shadow-xl shadow-amber-500/5 not-prose">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full bg-amber-500/20 p-2 text-amber-400">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-amber-400 text-base font-semibold uppercase tracking-wider m-0">
            The Zero-AI-Training Guarantee
          </h3>
        </div>
        <p className="text-zinc-200 text-sm leading-relaxed m-0">
          Your voice recordings, private transcripts, uploaded family media, and personal oral memoirs are{' '}
          <strong className="text-white font-semibold">never used to train, retrain, or improve public or third-party artificial intelligence foundation models</strong>.{' '}
          All automated processing is performed through secure, isolated enterprise API pipelines with zero-data-retention agreements. Your life story belongs exclusively to you and your family.
        </p>
      </div>

      <h2>1. Data Controller &amp; Overview</h2>
      <p>
        Memory Weaver Studio (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is the Data Controller responsible for your personal data. 
        We operate in the United Kingdom and manage all personal data strictly in compliance with the{' '}
        <strong>UK General Data Protection Regulation (UK GDPR)</strong> and the <strong>Data Protection Act 2018</strong>.
      </p>

      <h2>2. Categories of Personal Data We Process</h2>
      <p>We collect and process the following categories of data when you use the Service:</p>
      <ul>
        <li>
          <strong>Account &amp; Identity Data:</strong> Full name, email address, encrypted authentication tokens, 
          profile image, and account preferences.
        </li>
        <li>
          <strong>Oral History &amp; Creative Media:</strong> Spoken audio recordings, AI-generated transcriptions, 
          written narrative drafts, biographical details, uploaded family photographs, video assets, and mastered 4K presentation reels.
        </li>
        <li>
          <strong>Non-Biometric Processing Notice:</strong> Audio recordings are collected and processed solely for narrative transcription, audio normalization, and archival presentation playback. We do not extract biometric identifiers, facial geometry, or unique voiceprints for biometric identification purposes.
        </li>
        <li>
          <strong>Technical &amp; Device Data:</strong> Internet Protocol (IP) address, browser client details, operating system, and session telemetry required for video streaming optimization.
        </li>
        <li>
          <strong>Aggregated Analytics:</strong> Privacy-friendly usage telemetry collected strictly with your consent via our Cookie Consent Dock.
        </li>
      </ul>

      <h2>3. Lawful Bases for Processing</h2>
      <p>Under UK GDPR Article 6, we process your personal data under the following lawful bases:</p>
      <ul>
        <li>
          <strong>Performance of a Contract:</strong> To provision your Studio account, process spoken audio into mastered memoirs, generate vector print booklets, and maintain your private screening room.
        </li>
        <li>
          <strong>Legitimate Interests:</strong> To protect platform integrity, prevent spam or abuse, enforce rate limits on shared screening links, and maintain cloud infrastructure security.
        </li>
        <li>
          <strong>Explicit Consent:</strong> To initialize analytics telemetry cookies and send optional production newsletters or marketing updates. You may withdraw consent at any time.
        </li>
      </ul>

      <h2>4. Third-Party Subprocessors &amp; Data Sharing</h2>
      <p>
        We do not sell, rent, or trade your personal data. We transfer data strictly to vetted third-party 
        infrastructure partners (&quot;Subprocessors&quot;) bound by stringent Data Processing Agreements (DPAs):
      </p>

      <div className="overflow-x-auto my-6 not-prose">
        <table className="min-w-full text-left text-sm text-zinc-300 border border-zinc-800 rounded-xl overflow-hidden">
          <thead className="bg-zinc-900 text-zinc-100 font-semibold border-b border-zinc-800">
            <tr>
              <th className="p-3.5">Subprocessor</th>
              <th className="p-3.5">Processing Purpose</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5">Transfer Safeguard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-neutral-950/60">
            <tr className="hover:bg-white/[0.02]">
              <td className="p-3.5 font-mono text-xs text-amber-400">Google Cloud Platform &amp; Firebase</td>
              <td className="p-3.5 text-zinc-300">Encrypted Cloud Storage, Firestore Databases, Identity Auth</td>
              <td className="p-3.5 text-zinc-400">UK / EU / US</td>
              <td className="p-3.5 text-zinc-400">UK International Data Transfer Addendum / SCCs</td>
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-3.5 font-mono text-xs text-amber-400">Enterprise AI Inference Partners</td>
              <td className="p-3.5 text-zinc-300">Automated Audio Transcription &amp; Thematic Narrative Structuring</td>
              <td className="p-3.5 text-zinc-400">US / EU</td>
              <td className="p-3.5 text-zinc-400">Zero-Data-Retention Enterprise API Terms &amp; SCCs</td>
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-3.5 font-mono text-xs text-amber-400">Resend Inc.</td>
              <td className="p-3.5 text-zinc-300">Transactional Email Dispatch (Host Passes, Screening Invites)</td>
              <td className="p-3.5 text-zinc-400">US</td>
              <td className="p-3.5 text-zinc-400">Standard Contractual Clauses (SCCs)</td>
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-3.5 font-mono text-xs text-amber-400">Stream.io</td>
              <td className="p-3.5 text-zinc-300">Real-Time Video Delivery Infrastructure</td>
              <td className="p-3.5 text-zinc-400">EU / US</td>
              <td className="p-3.5 text-zinc-400">Standard Contractual Clauses (SCCs)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>5. Your Rights Under UK GDPR</h2>
      <p>You hold the following enforceable rights regarding your personal information:</p>
      <ul>
        <li><strong>Right of Access:</strong> Request a full copy of all personal data and transcripts held in your account.</li>
        <li><strong>Right to Rectification:</strong> Edit and correct incomplete or inaccurate narrative information.</li>
        <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request the complete deletion of your account, media, transcripts, and storage allocations.</li>
        <li><strong>Right to Data Portability:</strong> Export your narrative manuscripts, audio tracks, and key art in structured, portable formats.</li>
        <li><strong>Right to Object &amp; Restrict:</strong> Object to specific data processing operations or restrict processing while disputes are investigated.</li>
      </ul>

      <h2>6. Data Retention &amp; Deletion Schedules</h2>
      <ul>
        <li><strong>Active Productions:</strong> Your narrative media and archival recordings are retained for as long as your account remains active.</li>
        <li><strong>User-Initiated Deletion:</strong> When you delete a memory or close your account, all primary media files and transcripts are irrevocably purged from active databases immediately, with complete expulsion from encrypted backup rotations within 30 days.</li>
        <li><strong>Telemetry &amp; Analytics:</strong> Aggregated analytics data collected with consent is retained for a maximum duration of 14 months before automated deletion.</li>
      </ul>

      <h2>7. International Data Transfers</h2>
      <p>
        While our primary customer data clusters are anchored in UK and EU cloud regions, select processing operations (such as transactional email dispatch and enterprise API transcription) utilize infrastructure located in the United States. All overseas data transfers are governed by UK-approved <strong>Standard Contractual Clauses (SCCs)</strong> and the <strong>UK International Data Transfer Addendum</strong> to guarantee equivalent levels of protection.
      </p>

      <h2>8. Protection of Minors</h2>
      <p>
        The Service is designed for adult storytellers and family biographers aged 16 and older. We do not knowingly collect or solicit personal data from children under the age of 16. If we discover that personal information of a child under 16 has been collected without verified parental consent, we will promptly delete the data.
      </p>

      <h2>9. Data Protection Officer &amp; Enquiries</h2>
      <p>
        To exercise any of your statutory rights, or to submit queries regarding our data protection safeguards, please contact our Data Protection Lead:
      </p>
      <p className="font-mono text-amber-400 bg-neutral-900/60 p-4 rounded-xl border border-white/10 not-prose">
        Email: support@memoryweaver.studio<br />
        Subject Line: Data Subject Access Request / Privacy Enquiry
      </p>

      <h2>10. Supervisory Authority &amp; Complaints</h2>
      <p>
        You have the right to lodge a complaint at any time with the UK supervisory authority for data privacy:
      </p>
      <div className="text-sm text-zinc-300 bg-neutral-900/60 p-4 rounded-xl border border-white/10 not-prose">
        <strong className="text-white">Information Commissioner&apos;s Office (ICO)</strong><br />
        Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF<br />
        Helpline: 0303 123 1113 | Website:{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">
          ico.org.uk
        </a>
      </div>
    </article>
  );
}
