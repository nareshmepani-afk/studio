
import { SettingsPageContent } from '@/components/settings/SettingsPageContent';
import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Force the page to be dynamically rendered
export const dynamic = 'force-dynamic';

async function getUserData(uid: string) {
  console.log("TESTIMONY: Fetching user data for UID:", uid);
  
  // Guard against uninitialized admin SDK to prevent 500 errors
  if (!adminDb) {
    console.warn("TESTIMONY: Database connection (adminDb) is unavailable.");
    return null;
  }

  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    return userDoc.data() || null;
  } catch (error) {
    console.error('TESTIMONY: Error fetching user data:', error);
    return null;
  }
}

export default async function SettingsPage() {
  const session = await getSession();
  
  if (!session?.uid) {
    redirect('/login');
  }

  const userData = await getUserData(session.uid);
  
  // If the backend is failing, show a friendly error instead of crashing the whole app
  if (!userData && !adminDb) {
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>System Error</AlertTitle>
            <AlertDescription>
              We're having trouble connecting to the memory vault. This usually happens during maintenance or if configuration is incomplete. Please check back later.
            </AlertDescription>
          </Alert>
        </div>
      </AuthenticatedPageWrapper>
    );
  }
  
  return (
    <AuthenticatedPageWrapper>
      <SettingsPageContent 
        initialDirectorPassStatus={userData?.directorPassStatus || 'inactive'} 
        userEmail={session.email || ''}
        userName={session.displayName || ''}
      />
    </AuthenticatedPageWrapper>
  );
}
