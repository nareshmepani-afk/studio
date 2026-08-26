import type { Metadata } from 'next';
import { CookiesContent } from './CookiesContent';

export const metadata: Metadata = {
  title: 'Cookie & Local Storage Policy',
  description:
    'Cookie & Local Storage Policy for Memory Weaver Studio — UK PECR and GDPR compliance, technical cookie inventory, browser caching, and interactive consent controls.',
};

export default function CookiesPage() {
  return <CookiesContent />;
}
