import { headers } from 'next/headers';
import { Suspense } from 'react';
import LoginContent from './LoginContent';
import AdminLoginPage from '../admin/login/page';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const headersList = await headers();
  const host = headersList.get('x-original-host') || headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const isAdmin = host.startsWith('admin.');

  if (isAdmin) {
    return <AdminLoginPage />;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
