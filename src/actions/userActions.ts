
'use server';

import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function activateFreeDirectorPass(): Promise<{ success: boolean; message: string }> {
  const session = await getSession();

  if (!session?.uid) {
    return { success: false, message: "Unauthorized. Please log in." };
  }

  if (!adminDb) {
    return { success: false, message: "Database connection failed." };
  }

  const userRef = adminDb.collection('users').doc(session.uid);

  try {
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Prevent misuse: only allow activation if status is 'inactive'
    if (userData?.directorPassStatus && userData.directorPassStatus !== 'inactive') {
        return { success: false, message: `Your pass is already ${userData.directorPassStatus.replace('_', ' ')}.` };
    }

    // Set the pass status to active
    await userRef.update({
      directorPassStatus: 'free_host_pass_active',
      directorPassActivationDate: new Date().toISOString(),
    });

    // Important: Revalidate the paths that depend on the pass status
    revalidatePath('/studio');
    revalidatePath('/settings');

    return { success: true, message: "Free Director Pass activated successfully!" };

  } catch (error) {
    console.error("Error activating free director pass:", error);
    return { success: false, message: "An unexpected error occurred while activating your pass." };
  }
}
