'use server';

import { Resend } from 'resend';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface ContactFormData {
  name: string;
  email: string;
  category: string;
  message: string;
}

export async function sendContactAction(
  data: ContactFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.name || !data.email || !data.category || !data.message) {
      return { success: false, error: 'All fields are required.' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    if (data.message.length > 5000) {
      return { success: false, error: 'Message must be under 5,000 characters.' };
    }

    const now = Date.now();
    const record = rateLimitMap.get(data.email);
    if (record && now < record.resetTime) {
      if (record.count >= 5) {
        return {
          success: false,
          error: 'Too many submissions. Please try again later.',
        };
      }
      record.count += 1;
    } else {
      rateLimitMap.set(data.email, { count: 1, resetTime: now + 3600000 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('[sendContactAction] RESEND_API_KEY is not configured');
      return {
        success: false,
        error: 'Email service is currently unavailable. Please contact support@memoryweaver.studio directly.',
      };
    }

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: 'Memory Weaver Contact <noreply@memoryweaver.studio>',
      to: ['support@memoryweaver.studio'],
      replyTo: data.email,
      subject: `[Contact] ${data.category}: ${data.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold; color: #666;">Name</td><td style="padding: 8px;">${data.name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #666;">Email</td><td style="padding: 8px;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #666;">Category</td><td style="padding: 8px;">${data.category}</td></tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
            <p style="color: #666; font-size: 12px; margin-bottom: 8px;">MESSAGE</p>
            <p style="white-space: pre-wrap;">${data.message}</p>
          </div>
          <p style="margin-top: 24px; color: #999; font-size: 11px;">Sent from memoryweaver.studio/contact</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[sendContactAction] Failed:', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again or email us directly.',
    };
  }
}
