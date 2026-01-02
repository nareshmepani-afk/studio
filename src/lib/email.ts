'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, link: string) {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click <a href="${link}">here</a> to reset your password.</p>`,
    });
  } catch (error) {
    console.error(error);
  }
}
