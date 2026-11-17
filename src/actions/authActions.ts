'use server';

import { verifyRecaptchaToken } from '@/lib/fraud-defense';
import { resolveProjectId, isStagingProject } from '@/config/environment';
import { adminDb } from '@/lib/firebase-admin';
import {
  evaluatePrelaunchAccess,
  isValidEmailAddress,
  type PrelaunchStatus,
} from '@/lib/prelaunch';
import { logToDb } from '@/utils/telemetry/dbLogger';

export interface ValidateAuthAttemptOptions {
  name?: string;
  voucherCode?: string | null;
}

export interface ValidateAuthAttemptResult {
  success: boolean;
  score: number;
  code?: 'PRELAUNCH_RESTRICTED';
  addedToList?: boolean;
  alreadyListed?: boolean;
  message?: string;
}

export async function validateAuthAttempt(
  token: string,
  action: 'LOGIN' | 'REGISTER',
  email?: string,
  options?: ValidateAuthAttemptOptions
): Promise<ValidateAuthAttemptResult> {
  const logMessagePrefix = `[AuthAction] ${action} attempt for ${email || 'anonymous'}`;
  await logToDb(`${logMessagePrefix} - Initiating validation...`, 'INFO');
  console.log(`[AuthAction] Validating ${action} attempt for ${email || 'anonymous'}`);
  
  // SECURITY: the bypass is decided by the server-resolved Firebase project (staging only), NEVER by
  // request headers (Host / X-Forwarded-Host / X-Original-Host are client-spoofable and would otherwise
  // let a caller impersonate dev.memoryweaver.studio against a production backend). Fails closed when unknown.
  const projectId = resolveProjectId();
  const isStagingBypassAllowed = isStagingProject(projectId);

  let score = 1.0;

  if (isStagingBypassAllowed && token === 'BYPASS_STAGE_RECAPTCHA') {
    await logToDb(`${logMessagePrefix} - Bypassed reCAPTCHA verification on staging.`, 'INFO');
    console.log(`[AuthAction] Bypassing reCAPTCHA verification on staging.`);
  } else {
    const result = await verifyRecaptchaToken(token, action, email);

    if (!result.isSafe) {
      await logToDb(`${logMessagePrefix} - Blocked high-risk attempt. Score: ${result.score}`, 'ERROR');
      console.error(`[AuthAction] Blocked high-risk ${action} attempt. Score: ${result.score}`);
      throw new Error('Security verification failed. Please try again or contact support.');
    }

    score = result.score;
    await logToDb(`${logMessagePrefix} - Verification check passed successfully. Score: ${result.score}`, 'INFO');
  }

  // Unit suites that only test reCAPTCHA logic without mocking Firestore adminDb skip DB gating cleanly.
  const shouldSkipUnmockedVitestGate = process.env.VITEST === 'true' && !adminDb;
  if (!shouldSkipUnmockedVitestGate) {
    const prelaunch = await evaluatePrelaunchAccess({
      email,
      name: options?.name,
      voucherCode: options?.voucherCode,
      source: 'SELF_SIGNUP',
      recordIfBlocked: action === 'REGISTER',
    });

    if (!prelaunch.allowed) {
      await logToDb(
        `${logMessagePrefix} - Held at Pre-Launch gate (${prelaunch.mode}).`,
        'INFO'
      );
      return {
        success: false,
        score,
        code: 'PRELAUNCH_RESTRICTED',
        addedToList: Boolean(prelaunch.addedToList),
        alreadyListed: Boolean(prelaunch.alreadyListed),
        message: prelaunch.message,
      };
    }
  }

  return { success: true, score };
}

export async function joinPrelaunchListAction(params: {
  email: string;
  name?: string;
}): Promise<{
  success: boolean;
  status?: PrelaunchStatus | 'ADMIN' | 'PUBLIC_MODE';
  addedToList?: boolean;
  alreadyListed?: boolean;
  message: string;
}> {
  if (!isValidEmailAddress(params.email || '')) {
    return {
      success: false,
      message: 'Please enter a valid email address first.',
    };
  }

  const evaluation = await evaluatePrelaunchAccess({
    email: params.email,
    name: params.name,
    source: 'SELF_SIGNUP',
    recordIfBlocked: true,
  });

  if (evaluation.allowed) {
    if (evaluation.reason === 'TESTER') {
      return {
        success: true,
        status: 'TESTER',
        message: 'Your email already has active Tester access — please sign in to enter Studio.',
      };
    }
    if (evaluation.reason === 'ADMIN') {
      return {
        success: true,
        status: 'ADMIN',
        message: 'This administrator account already has full access — please sign in.',
      };
    }
    return {
      success: true,
      status: 'PUBLIC_MODE',
      message: 'Open registration is currently live — you can register immediately without a waitlist.',
    };
  }

  return {
    success: true,
    status: 'WAITLIST',
    addedToList: Boolean(evaluation.addedToList),
    alreadyListed: Boolean(evaluation.alreadyListed),
    message:
      evaluation.message ||
      'You are on the Memory Weaver Pre-Launch List. We will notify you as soon as your Tester access or launch opens.',
  };
}
