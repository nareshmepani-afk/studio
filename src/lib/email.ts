'use server';

import { Resend } from 'resend';
import { renderPasswordResetEmail } from '@/lib/emailTemplates';
import { STUDIO_EMAIL_SENDERS } from '@/config/emailConfig';

/**
 * Sends a password reset email using the Resend service.
 * @param email The recipient's email address.
 * @param link The password reset link to include in the email.
 */
export async function sendPasswordResetEmail(email: string, link: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, html } = renderPasswordResetEmail({
    email,
    resetLink: link,
    expiresInMinutes: 60,
  });
  
  try {
    await resend.emails.send({
      from: STUDIO_EMAIL_SENDERS.STUDIO,
      to: email,
      subject,
      html,
    });
    console.log(`Password reset email successfully sent to ${email}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // Re-throw the error to be handled by the calling action
    throw new Error('The email sending service failed.');
  }
}
