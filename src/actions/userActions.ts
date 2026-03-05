
'use server';

import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function activateFreeHostPass(): Promise<{ success: boolean; message: string }> {
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
    if (userData?.hostPassStatus && userData.hostPassStatus !== 'inactive') {
        return { success: false, message: `Your pass is already ${userData.hostPassStatus.replace('_', ' ')}.` };
    }

    // Set the pass status to active
    await userRef.update({
      hostPassStatus: 'free_host_pass_active',
      hostPassActivationDate: new Date().toISOString(),
    });

    // Important: Revalidate the paths that depend on the host pass status
    revalidatePath('/prompts');
    revalidatePath('/settings');

    return { success: true, message: "Free Host Pass activated successfully!" };

  } catch (error) {
    console.error("Error activating free host pass:", error);
    return { success: false, message: "An unexpected error occurred while activating your pass." };
  }
}
