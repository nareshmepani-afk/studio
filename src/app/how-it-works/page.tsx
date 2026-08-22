import type { Metadata } from 'next';
import { HowItWorksContent } from './HowItWorksContent';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Discover the 5-Act spoken memoir production methodology. From voice capture in the Scriptorium to cinematic Smart TV streaming and generational archival preservation.',
};

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Create a Spoken Memoir with Memory Weaver',
  description:
    'A 5-Act production methodology for preserving family stories as cinematic spoken memoirs.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Act I — The Scriptorium',
      text: 'Craft your narrative using guided prompts and AI-assisted prose refinement. Write the story only you can tell.',
    },
    {
      '@type': 'HowToStep',
      name: 'Act II — The Soundstage',
      text: 'Record your spoken voice with cinematic teleprompter guidance, sensory soundscapes, and multi-camera support.',
    },
    {
      '@type': 'HowToStep',
      name: 'Act III — The Editing Suite',
      text: 'Review AI-synthesised narrative options, fine-tune your director\'s cut, and approve the final cinematic take.',
    },
    {
      '@type': 'HowToStep',
      name: 'Act IV — The Screening Room',
      text: 'Publish to the Family Cinema with a unique QR code poster. Stream on mobile, desktop, or Smart TV with zero login required.',
    },
    {
      '@type': 'HowToStep',
      name: 'Act V — The Archive',
      text: 'Preserve your memoir in a generational cloud vault with vector print booklet exports for physical keepsakes.',
    },
  ],
};

export default function HowItWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <HowItWorksContent />
    </>
  );
}
