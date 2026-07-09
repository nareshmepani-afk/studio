import { adminDb, adminApp } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function logToDb(
  message: string, 
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
) {
  if (!adminDb) return;
  
  // Dynamically resolve environment based on the admin App project ID
  const currentEnv = adminApp?.options?.projectId === 'memory-weaver-dev' ? 'DEV-APP' : 'LIVE-PRODUCTION';

  try {
    await adminDb.collection('system_logs').add({
      message,
      severity,
      env: currentEnv,
      timestamp: Timestamp.now()
    });
  } catch (e) {
    console.error('Failed to write log to Firestore:', e);
  }
}
