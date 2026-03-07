
import { SettingsPageContent } from '@/components/settings/SettingsPageContent';
import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';

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
  const session = await getSession();
  console.log("TESTIMONY: Session object:", session);
  
  if (!session?.uid) {
    console.log("TESTIMONY: User not authenticated, redirecting to login.");
    redirect('/login');
  } else {
    console.log("TESTIMONY: User authenticated with UID:", session.uid);
    const userData = await getUserData(session.uid);
    
    return (
      <SettingsPageContent 
        initialHostPassStatus={userData?.hostPassStatus || 'inactive'} 
        userEmail={session.email || ''}
        userName={session.displayName || ''}
      />
    );
  }
}
