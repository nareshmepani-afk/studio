import type { Metadata } from 'next';
import { ContactContent } from './ContactContent';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the Memory Weaver team. Production support, custom archival requests, and general enquiries.',
};

export default function ContactPage() {
  return <ContactContent />;
}
