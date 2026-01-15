'use server';

import { Resend } from 'resend';

/**
 * Sends a password reset email using the Resend service.
 * @param email The recipient's email address.
 * @param link The password reset link to include in the email.
 */
export async function sendPasswordResetEmail(email: string, link: string): Promise<void> {
  // The RESEND_API_KEY must be set in your environment variables for this to work.
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    await resend.emails.send({
      // This now uses our verified domain to ensure deliverability.
      from: 'noreply@memoryweaver.studio',
      to: email,
      subject: 'Reset Your Memory Weaver Password',
      html: `<p>Click the link to reset your password: <a href="${link}">Reset Password</a></p>`,
    });
    console.log(`Password reset email successfully sent to ${email}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // Re-throw the error to be handled by the calling action
    throw new Error('The email sending service failed.');
  }
}
