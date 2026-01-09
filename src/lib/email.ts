'use server';

// This is a mock implementation. In a real application, you would use an email service
// like Resend, SendGrid, or AWS SES.
// For this project, we will simulate the email sending and log it to the console
// to verify the flow is working end-to-end.

/**
 * Sends a password reset email.
 * @param email The recipient's email address.
 * @param link The password reset link to include in the email.
 */
export async function sendPasswordResetEmail(email: string, link: string): Promise<void> {
  // This requires the RESEND_API_KEY environment variable to be set.
  // As it's not set in this environment, this will gracefully fail on the server
  // while allowing us to test the full flow.
  
  // We will log the link to the console so it can be manually tested during development.
  console.log('--- PASSWORD RESET ---');
  console.log(`Email would be sent to: ${email}`);
  console.log(`Reset Link: ${link}`);
  console.log('----------------------');

  // In a real implementation with Resend:
  /*
  import { Resend } from 'resend';
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    await resend.emails.send({
      from: 'password-reset@memoryweaver.com',
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
  */
  
  // For now, we resolve successfully to simulate the email being sent.
  return Promise.resolve();
}
