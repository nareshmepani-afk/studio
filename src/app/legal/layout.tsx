import type { Metadata } from 'next';
import { LegalLayoutContent } from './LegalLayoutContent';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LegalLayoutContent>{children}</LegalLayoutContent>;
}
