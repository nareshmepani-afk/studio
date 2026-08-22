import type { Metadata } from 'next';
import { CookiesContent } from './CookiesContent';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Cookie Policy for Memory Weaver. Transparent breakdown of essential and analytics cookies, with interactive preference management.',
};

export default function CookiesPage() {
  return <CookiesContent />;
}
