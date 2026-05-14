'use server';

import { verifyRecaptchaToken } from '@/lib/fraud-defense';

export async function validateAuthAttempt(token: string, action: 'LOGIN' | 'REGISTER', email?: string) {
  console.log(`[AuthAction] Validating ${action} attempt for ${email || 'anonymous'}`);
  
  const result = await verifyRecaptchaToken(token, action, email);
  
  if (!result.isSafe) {
    console.error(`[AuthAction] Blocked high-risk ${action} attempt. Score: ${result.score}`);
    throw new Error('Security verification failed. Please try again or contact support.');
  }
  
  return { success: true, score: result.score };
}
