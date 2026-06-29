import { Suspense } from 'react';
import RegisterContent from './RegisterContent';

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
