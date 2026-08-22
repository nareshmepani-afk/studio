import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterContent from './RegisterContent';

export const metadata: Metadata = {
  title: 'Register',
  description:
    'Create your Memory Weaver account and claim your complimentary 6-Month Director Host Pass. Begin preserving your family stories today.',
};

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
