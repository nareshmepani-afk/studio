'use server';

import { verifyRecaptchaToken } from '@/lib/fraud-defense';

import { headers } from 'next/headers';

export async function validateAuthAttempt(token: string, action: 'LOGIN' | 'REGISTER', email?: string) {
  console.log(`[AuthAction] Validating ${action} attempt for ${email || 'anonymous'}`);
  
  const headersList = await headers();
  const host = headersList.get('x-original-host') || headersList.get('x-forwarded-host') || headersList.get('host') || '';
  
  const isStagingBypassAllowed = 
    host.includes('dev.memoryweaver.studio') || 
    host.includes('memory-weaver-dev') || 
    host.includes('localhost') || 
    host.includes('127.0.0.1');

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
