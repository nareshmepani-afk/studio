import type { Metadata } from 'next';
import { PricingContent } from './PricingContent';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Preserve your family stories with Memory Weaver. Start free with a 6-Month Director Host Pass and 5 GB cloud vault. Affordable archival plans powered by Purchasing Power Parity.',
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Memory Weaver free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Every new Director receives a complimentary 6-Month Director Host Pass with full studio access and 5 GB of 4K cloud storage. No credit card required.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does dynamic pricing work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Memory Weaver uses a Coffee Index AI to calculate fair local pricing based on Purchasing Power Parity (PPP). Your price is approximately 3.5 local coffees per month for the Director Pass, ensuring affordability worldwide.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I stream my memoir on a Smart TV?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Published memoirs generate a unique QR code and streaming link. Anyone scanning the QR or opening the link can watch on mobile, desktop, or Smart TV with zero account creation required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who owns my voice recordings and content?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You retain 100% copyright ownership of your spoken voice, transcripts, and uploaded media. Memory Weaver never uses your content to train AI models.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when my pass expires?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your stories remain safely stored and viewable. You simply cannot create new recordings or publish new memoirs until you renew. No data is ever deleted upon expiry.',
      },
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PricingContent />
    </>
  );
}
