
    'use server';

    import * as admin from 'firebase-admin';
    import { getAuth } from 'firebase-admin/auth';

    // Initialize the app if it's not already initialized
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
      try {
        await getAuth().deleteUser(uid);
        console.log(`Successfully deleted user with UID: ${uid}`);
        return { success: true, message: 'User deleted successfully.' };
      } catch (error: any) {
        console.error(`Error deleting user with UID: ${uid}`, error);
        return { success: false, message: error.message };
      }
    }
    