import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Memory Weaver. Learn how we protect your data, our zero-AI-training guarantee, and your rights under UK GDPR.',
};

export default function PrivacyPage() {
  return (
    <div>
      <h1>Privacy Policy</h1>
      <p className="lead text-lg text-white/60">
        This Privacy Policy explains how Memory Weaver collects, uses, and protects your personal data.
      </p>

      <hr className="my-8 border-white/10" />

      <h2>1. Introduction & Data Controller</h2>
      <p>
        Memory Weaver ("we", "us", "our") is the data controller responsible for your personal information. We are based in the United Kingdom and are committed to protecting your privacy in accordance with the UK Data Protection Act 2018 and the UK General Data Protection Regulation (UK GDPR).
      </p>

      <div className="my-8 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-6 shadow-lg shadow-amber-500/5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-amber-500/20 p-2">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="m-0 text-xl font-medium text-amber-400">Zero-AI-Training Guarantee</h3>
        </div>
        <p className="m-0 text-amber-100/90 leading-relaxed font-medium">
          Your voice recordings, private transcripts, and uploaded imagery are NEVER used to train third-party artificial intelligence or machine learning foundation models. Your stories belong to you.
        </p>
      </div>

      <h2>2. Data We Collect</h2>
      <p>We collect and process the following categories of personal data:</p>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, password, and profile details.</li>
        <li><strong>Content Data:</strong> Voice recordings, media uploads (photos, videos), and text inputs for your memoirs.</li>
        <li><strong>Usage Analytics:</strong> Information on how you interact with our platform to improve user experience.</li>
        <li><strong>Device Information:</strong> IP address, browser type, operating system, and unique device identifiers.</li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <p>We process your personal data under the following lawful bases:</p>
      <ul>
        <li><strong>Contractual Necessity:</strong> To provide our services, manage your account, and deliver customer support.</li>
        <li><strong>Consent:</strong> When you voluntarily opt-in to marketing communications or analytics tracking.</li>
        <li><strong>Legitimate Interest:</strong> To improve our platform, ensure security, and prevent fraud.</li>
      </ul>

      <h2>4. Data Sharing & Third-Party Processors</h2>
      <p>
        We do not sell your personal data. We share data only with trusted third-party processors who assist us in operating our service. These include:
      </p>
      <ul>
        <li><strong>Firebase & Google Cloud Platform:</strong> For secure hosting and data storage.</li>
        <li><strong>Resend:</strong> For transactional email delivery.</li>
        <li><strong>Stream.io:</strong> For real-time video communication infrastructure.</li>
        <li><strong>Google reCAPTCHA:</strong> For anti-bot protection and security.</li>
      </ul>

      <h2>5. Your Rights Under UK GDPR</h2>
      <p>You have the following rights regarding your personal data:</p>
      <ul>
        <li><strong>Right of Access:</strong> Request a copy of your personal data.</li>
        <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data.</li>
        <li><strong>Right to Erasure (Right to be Forgotten):</strong> Request deletion of your data.</li>
        <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
        <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing.</li>
        <li><strong>Right to Restriction:</strong> Request limited processing of your data.</li>
        <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
      </ul>

      <h2>6. Data Retention</h2>
      <p>We retain your data for as long as necessary to fulfil the purposes outlined in this policy:</p>
      <ul>
        <li>Account data is retained while your account remains active.</li>
        <li>Voice recordings and content are retained until you choose to delete them.</li>
        <li>Analytics data is retained for up to 26 months.</li>
        <li>When you delete your account or content, data is purged from our active systems and backups within 30 days.</li>
      </ul>

      <h2>7. International Data Transfers</h2>
      <p>
        Your data is primarily stored within Google Cloud UK/EU regions. Where data is transferred outside the UK or EEA, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses, to protect your privacy.
      </p>

      <h2>8. Children's Privacy</h2>
      <p>
        Our service is not directed at children under the age of 16. We do not knowingly collect personal data from children under 16 without parental consent.
      </p>

      <h2>9. Contact the Data Protection Officer</h2>
      <p>
        If you have any questions, concerns, or wish to exercise your rights, please contact our Data Protection Officer at: <a href="mailto:support@memoryweaver.studio">support@memoryweaver.studio</a>.
      </p>

      <h2>10. Complaints</h2>
      <p>
        If you believe we have not adequately addressed your concerns, you have the right to lodge a complaint with the Information Commissioner's Office (ICO), the UK supervisory authority for data protection.
      </p>

      <hr className="my-8 border-white/10" />

      <p className="text-sm text-white/40">
        We may update this Privacy Policy periodically. We will notify you of any significant changes via email or an in-app notification.
      </p>
    </div>
  );
}
