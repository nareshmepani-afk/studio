'use server';

import { verifyRecaptchaToken } from '@/lib/fraud-defense';
import { headers } from 'next/headers';
import { logToDb } from '@/utils/telemetry/dbLogger';

export async function validateAuthAttempt(token: string, action: 'LOGIN' | 'REGISTER', email?: string) {
  const logMessagePrefix = `[AuthAction] ${action} attempt for ${email || 'anonymous'}`;
  await logToDb(`${logMessagePrefix} - Initiating validation...`, 'INFO');
  console.log(`[AuthAction] Validating ${action} attempt for ${email || 'anonymous'}`);
  
  const headersList = await headers();
  const host = headersList.get('x-original-host') || headersList.get('x-forwarded-host') || headersList.get('host') || '';
  
  const isStagingBypassAllowed = 
    host.includes('dev.memoryweaver.studio') || 
    host.includes('memory-weaver-dev') || 
    host.includes('localhost') || 
    host.includes('127.0.0.1');

  if (isStagingBypassAllowed && token === 'BYPASS_STAGE_RECAPTCHA') {
    await logToDb(`${logMessagePrefix} - Bypassed reCAPTCHA verification on staging.`, 'INFO');
    console.log(`[AuthAction] Bypassing reCAPTCHA verification on staging.`);
    return { success: true, score: 1.0 };
  }

  const result = await verifyRecaptchaToken(token, action, email);
  
  if (!result.isSafe) {
    await logToDb(`${logMessagePrefix} - Blocked high-risk attempt. Score: ${result.score}`, 'ERROR');
    console.error(`[AuthAction] Blocked high-risk ${action} attempt. Score: ${result.score}`);
    throw new Error('Security verification failed. Please try again or contact support.');
  }
  
  await logToDb(`${logMessagePrefix} - Verification check passed successfully. Score: ${result.score}`, 'INFO');
  return { success: true, score: result.score };
}
