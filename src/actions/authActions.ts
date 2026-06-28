'use server';

import { verifyRecaptchaToken } from '@/lib/fraud-defense';

export async function validateAuthAttempt(token: string, action: 'LOGIN' | 'REGISTER', email?: string) {
  console.log(`[AuthAction] Validating ${action} attempt for ${email || 'anonymous'}`);
  
  const isStagingBypassAllowed = 
    process.env.NEXT_PUBLIC_BYPASS_CAPTCHA === 'true' && 
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'memory-weaver-8rk9t';

  if (isStagingBypassAllowed && token === 'BYPASS_STAGE_RECAPTCHA') {
    console.log(`[AuthAction] Bypassing reCAPTCHA verification on staging.`);
    return { success: true, score: 1.0 };
  }

  const result = await verifyRecaptchaToken(token, action, email);
  
  if (!result.isSafe) {
    console.error(`[AuthAction] Blocked high-risk ${action} attempt. Score: ${result.score}`);
    throw new Error('Security verification failed. Please try again or contact support.');
  }
  
  return { success: true, score: result.score };
}
