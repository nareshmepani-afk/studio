import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

/**
 * verifyRecaptchaToken
 * Backend utility to verify a reCAPTCHA Enterprise token.
 * 
 * @param token The token from the client.
 * @param action The expected action name (e.g. 'publish').
 * @param userId Optional userId for Account Defender correlation.
 * @returns Risk score and assessment data.
 */
export async function verifyRecaptchaToken(token: string, action: string, userId?: string) {
  const projectID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'memory-weaver-8rk9t';
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const apiKey = process.env.GOOGLE_RECAPTCHA_API_KEY;

  if (!projectID || !siteKey) {
    console.warn('[FraudDefense] Missing PROJECT_ID or SITE_KEY. Skipping verification.');
    return { score: 1.0, isSafe: true, message: 'Verification skipped (Config missing)' };
  }

  try {
    // If we have an API Key, we can use it for authentication with the client
    // Otherwise it will look for Application Default Credentials (ADC)
    const client = new RecaptchaEnterpriseServiceClient(
      apiKey ? { apiKey } : {}
    );

    const projectPath = client.projectPath(projectID);

    const [assessment] = await client.createAssessment({
      parent: projectPath,
      assessment: {
        event: {
          token: token,
          siteKey: siteKey,
          expectedAction: action,
          hashedAccountId: userId ? Buffer.from(userId).toString('base64') : undefined,
        },
      },
    });

    if (!assessment.tokenProperties?.valid) {
      console.error(`[FraudDefense] Invalid token: ${assessment.tokenProperties?.invalidReason}`);
      return { score: 0, isSafe: false, message: `Invalid token: ${assessment.tokenProperties?.invalidReason}` };
    }

    if (assessment.tokenProperties.action !== action) {
      console.error(`[FraudDefense] Action mismatch: expected ${action}, got ${assessment.tokenProperties.action}`);
      return { score: 0, isSafe: false, message: 'Action mismatch' };
    }

    const score = assessment.riskAnalysis?.score || 0;
    
    // Logic: In development, we might want to be lenient, but 0.3 is the standard "High Risk" threshold.
    // If the score is below 0.3, it is likely automated or fraudulent.
    const isSafe = score >= 0.3;

    if (!isSafe) {
      console.warn(`[FraudDefense] High-risk activity detected. Score: ${score}. Assessment: ${assessment.name}`);
    }

    return { 
      score, 
      isSafe, 
      reasons: assessment.riskAnalysis?.reasons || [],
      assessmentName: assessment.name 
    };

  } catch (error) {
    console.error('[FraudDefense] Assessment creation failed:', error);
    // Fail safe in development? Or fail hard? 
    // Usually better to fail safe during dev but log the error.
    return { score: 1.0, isSafe: true, message: 'Verification failed (Service error)' };
  }
}
