import twilio, { Twilio } from 'twilio';

/**
 * 🛰️ Twilio Client Singleton
 *
 * Milestone: MW-90 Twilio Resilient Messaging Subsystem
 * Constitutional Invariant: Rule 20 British English, Rule 5 Zero Localhost
 *
 * Lazy-initialised client singleton. Avoids fatal runtime exceptions during Next.js
 * static site prerendering and compilation when environment credentials are unset.
 */
let twilioInstance: Twilio | null = null;

export function getTwilioClient(): Twilio | null {
  if (twilioInstance) {
    return twilioInstance;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[Twilio] Credentials not initialised: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing.');
    }
    return null;
  }

  twilioInstance = twilio(accountSid, authToken);
  return twilioInstance;
}

export type TwilioClient = Twilio;
