import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for Memory Weaver Studio — public distribution, link-based access, creator copyright ownership, and content controls under the laws of England and Wales.',
};

export default function TermsPage() {
  return (
    <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-white prose-p:leading-relaxed prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white/95 prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline">
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">Terms of Service</h1>

      <p className="lead text-base sm:text-lg text-white/80 leading-relaxed mb-8">
        Welcome to Memory Weaver. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the 
        spoken memoir production suite, media mastering pipelines, and digital screening room services 
        (collectively, the &quot;Service&quot;) provided by Memory Weaver Studio (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
      </p>

      <hr className="my-8 border-white/10" />

      <h2>1. Public Distribution and Link-Based Access</h2>
      <p>
        When you elect to publish content through our digital screening platform, the Service generates 
        unique streaming web addresses (URLs) and scannable Quick Response (QR) codes associated with your presentation.
      </p>
      <ul>
        <li>
          <strong>Unauthenticated Public Access:</strong> You acknowledge that any individual possessing 
          your specific URL or scanning your physical QR code may stream and view the published presentation 
          without creating an account or authenticating.
        </li>
        <li>
          <strong>Distribution Responsibility:</strong> You retain sole discretion over the distribution, 
          transmission, and display of your generated links, physical print booklets, and theatrical posters.
        </li>
      </ul>

      <h2>2. Intellectual Property and Creator Ownership</h2>
      <p>
        You retain full, unencumbered copyright and intellectual property ownership over all original 
        materials uploaded, recorded, or generated through your account, including:
      </p>
      <ul>
        <li>Your spoken audio recordings, voice performances, and oral narratives;</li>
        <li>Written transcripts, memoirs, biographical text, and editorial drafts;</li>
        <li>Archival photographs, personal documents, and uploaded media assets;</li>
        <li>Rendered key art, chapter layouts, and printable vector documents.</li>
      </ul>
      <p>
        We claim no ownership rights over your content. You grant Memory Weaver Studio a limited, 
        non-exclusive, revocable, royalty-free licence solely to host, process, store, encode, 
        and stream your content as strictly necessary to provide the Service to you and your designated viewers.
      </p>

      <h2>3. Content Revocation, Unpublishing, and Deletion</h2>
      <p>
        You retain absolute authority over the availability of your content at all times:
      </p>
      <ul>
        <li>
          <strong>Unpublishing:</strong> You may unpublish any active presentation from your account dashboard 
          at any time. Upon unpublishing, all active public URLs and QR codes immediately cease resolving 
          to your media for third-party viewers.
        </li>
        <li>
          <strong>Permanent Deletion:</strong> You may permanently delete your recordings, transcripts, 
          and rendered assets. Deletion initiates an irrevocable purge of the associated files and 
          metadata from our primary active storage databases.
        </li>
      </ul>

      <h2>4. Screening Room Access and Library Bookmarking</h2>
      <p>
        The public screening interface allows viewers to experience published presentations. Authenticated 
        users may save public presentations to their private account library. Bookmarking a presentation 
        creates a personal viewing reference only; it does not transfer ownership, grant editorial authority, 
        or convey licensing rights to the bookmarking user.
      </p>

      <h2>5. Account Terms, Host Passes, and Vault Tiers</h2>
      <ul>
        <li><strong>Eligibility:</strong> You must be at least 16 years of age to register an account.</li>
        <li><strong>Account Security:</strong> You are responsible for safeguarding your authentication credentials.</li>
        <li>
          <strong>Director Host Passes:</strong> Complimentary promotional passes (such as the 6-Month 
          Director Host Pass) provide temporary production and cloud storage quotas as defined at 
          registration. Complimentary passes are non-transferable.
        </li>
        <li>
          <strong>Preservation Tiers:</strong> Paid access passes and generational vault plans are 
          single, non-recurring transactions unless explicitly stated otherwise during checkout.
        </li>
      </ul>

      <h2>6. Technical, Hardware, and System Requirements</h2>
      <p>
        Under the Consumer Rights Act 2015 and applicable consumer protection regulations, users and gift purchasers must take note of the following technical prerequisites prior to purchasing studio access passes:
      </p>
      <ul>
        <li>
          <strong>Recording Soundstage Display Requirements:</strong> Operating the private recording studio, interactive teleprompter, and multi-track audio workstation requires a device with a minimum viewport width of 768 pixels (such as an Apple iPad, Android tablet, laptop, or desktop computer). Handheld portrait smartphone screens are not supported for the primary creator recording interface.
        </li>
        <li>
          <strong>Peripherals &amp; Remote Lenses:</strong> Creation requires a functional camera and microphone (integrated or external). Compatible smartphones may optionally be paired via secure WebRTC session as auxiliary remote video lenses.
        </li>
        <li>
          <strong>Browser &amp; Network Specifications:</strong> The platform requires a modern, secure browser supporting HTML5, WebRTC, and MediaRecorder APIs (e.g., modern versions of Safari, Chrome, Edge, or Firefox). A stable broadband connection (recommended minimum 5 Mbps upload) is required for real-time vault synchronisation and cloud rendering.
        </li>
        <li>
          <strong>Universal Playback &amp; Screening:</strong> Published family cinema premieres, streaming reels, and generational vault archives are universally accessible across all modern mobile phones, tablets, personal computers, and Smart TV web browsers without minimum viewport constraints.
        </li>
      </ul>

      <h2>7. Acceptable Use and Community Standards</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Upload or distribute content that infringes upon third-party intellectual property or privacy rights;</li>
        <li>Publish defamatory, abusive, harassing, hateful, or unlawful materials;</li>
        <li>Circumvent rate limits, access controls, or platform authentication protocols;</li>
        <li>Deploy automated scrapers, spiders, or ingestion bots against streaming endpoints;</li>
        <li>Impersonate any individual, entity, or historical living person without lawful authorisation.</li>
      </ul>

      <h2>8. Service Availability and Storage Continuity</h2>
      <p>
        We operate the Service using enterprise-grade cloud hosting infrastructure featuring industry-standard 
        encryption in transit and at rest. While we aim for continuous uptime, the Service is provided on 
        an &quot;as available&quot; basis. In the unlikely event that the platform is permanently discontinued, 
        we will provide a minimum of 90 days&apos; written notice and automated export tools to retrieve your master archives.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by applicable law, Memory Weaver Studio and its directors, 
        employees, and partners shall not be liable for any indirect, incidental, special, consequential, 
        or punitive damages arising from your access to or inability to access the Service. Our aggregate 
        liability for any claim arising out of these Terms shall not exceed the total amount paid by you 
        to us in the twelve (12) months preceding the incident.
      </p>

      <h2>10. Governing Law and Jurisdiction</h2>
      <p>
        These Terms, and any dispute or claim arising out of or in connection with them, shall be governed 
        by and construed in accordance with the laws of England and Wales. You agree that the courts of 
        England and Wales shall have exclusive jurisdiction to settle any dispute.
      </p>

      <h2>11. Modifications to These Terms</h2>
      <p>
        We may revise these Terms from time to time. Material updates will be communicated to your registered 
        email address at least 30 days prior to taking effect. Your continued use of the Service following 
        such notice constitutes binding acceptance of the updated Terms.
      </p>

      <hr className="my-8 border-white/10" />

      <p className="text-sm text-white/40">
        If you have questions regarding these Terms, please contact our legal team at{' '}
        <a href="mailto:support@memoryweaver.studio">support@memoryweaver.studio</a>.
      </p>
    </article>
  );
}
