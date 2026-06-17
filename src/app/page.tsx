import { headers, cookies } from 'next/headers';
import LandingPageContent from './LandingPageContent';
import AdminPage from './admin/page';
import AdminLoginPage from './admin/login/page';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const headersList = await headers();
  const host = headersList.get('x-original-host') || headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const isAdmin = host.startsWith('admin.');

  if (isAdmin) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return <AdminLoginPage />;
    }
    return <AdminPage />;
  }

  return <LandingPageContent />;
}
