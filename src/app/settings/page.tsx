
import { SettingsPageContent } from '@/components/settings/SettingsPageContent';
import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';

// Force the page to be dynamically rendered
export const dynamic = 'force-dynamic';

// Revalidate this page every 60 seconds
export const revalidate = 60;

async function getUserData(uid: string) {
  if (!adminDb) {
    throw new Error('Database connection failed.');
  }
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    return userDoc.data();
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export default async function SettingsPage() {
  const session = await getSession();
  
  if (!session?.uid) {
    // This case should ideally be handled by middleware
    // redirect('/login');
    return (
        <div className="container mx-auto py-8 px-4 text-center">
            <h1 className="font-headline text-3xl mb-2">Unauthorized</h1>
            <p className="text-muted-foreground">You must be logged in to view this page.</p>
        </div>
    );
  }

  const userData = await getUserData(session.uid);
  
  return (
    <SettingsPageContent 
      initialHostPassStatus={userData?.hostPassStatus || 'inactive'} 
      userEmail={session.email || ''}
      userName={session.displayName || ''}
    />
  );
}
