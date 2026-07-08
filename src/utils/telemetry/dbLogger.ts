import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function logToDb(
  message: string, 
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
) {
  if (!adminDb) return;
  
  // Dynamically attach the host scope context
  const currentEnv = process.env.NEXT_PUBLIC_BYPASS_CAPTCHA === 'true' && 
                     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'memory-weaver-8rk9t' 
                     ? 'DEV-APP' 
                     : 'LIVE-PRODUCTION';

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
