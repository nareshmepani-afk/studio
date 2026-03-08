
import { SettingsPageContent } from '@/components/settings/SettingsPageContent';
import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';

// Force the page to be dynamically rendered
export const dynamic = 'force-dynamic';

// Revalidate this page every 60 seconds
export const revalidate = 60;

async function getUserData(uid: string) {
  console.log("TESTIMONY: Fetching user data for UID:", uid);
  if (!adminDb) {
    console.error("TESTIMONY: Database connection failed.");
    throw new Error('Database connection failed.');
  }
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();
    console.log("TESTIMONY: Fetched user data:", userData);
    return userData;
  } catch (error) {
    console.error('TESTIMONY: Error fetching user data:', error);
    return null;
  }
}

export default async function SettingsPage() {
  console.log("TESTIMONY: Settings page loading started.");
  console.log("TESTIMONY: Calling getSession() from SettingsPage.");
  const session = await getSession();
  console.log("TESTIMONY: Returned from getSession() in SettingsPage.");
  console.log("TESTIMONY: Session object in SettingsPage:", session);
  
  if (!session?.uid) {
    console.log("TESTIMONY: User not authenticated in SettingsPage, redirecting to login.");
    redirect('/login');
  }

  const userData = await getUserData(session.uid);
  
  return (
    <AuthenticatedPageWrapper>
      <SettingsPageContent 
        initialHostPassStatus={userData?.hostPassStatus || 'inactive'} 
        userEmail={session.email || ''}
        userName={session.displayName || ''}
      />
    </AuthenticatedPageWrapper>
  );
}
