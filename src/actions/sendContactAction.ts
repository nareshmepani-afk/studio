'use server';

import { Resend } from 'resend';
import { STUDIO_EMAILS, STUDIO_EMAIL_SENDERS } from '@/config/emailConfig';

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

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (data.message.length > 5000) {
      return { success: false, error: 'Message must be under 5,000 characters.' };
    }

    // Rate limiting: max 3 submissions per email per hour
    const now = Date.now();
    const userLimit = rateLimitMap.get(data.email);
    if (userLimit && now < userLimit.resetTime) {
      if (userLimit.count >= 3) {
        return {
          success: false,
          error: 'Too many requests. Please try again later.',
        };
      }
      userLimit.count += 1;
    } else {
      rateLimitMap.set(data.email, { count: 1, resetTime: now + 3600000 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('[sendContactAction] RESEND_API_KEY is not configured');
      return {
        success: false,
        error: `Email service is currently unavailable. Please contact ${STUDIO_EMAILS.SUPPORT} directly.`,
      };
    }

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: STUDIO_EMAIL_SENDERS.CONTACT,
      to: [STUDIO_EMAILS.SUPPORT],
      replyTo: data.email,
      subject: `[Contact] ${data.category}: ${data.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #ffffff; background-color: #000000; border: 2px solid #f59e0b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);">
          <!-- Header Banner with Logo Medallion -->
          <div style="background-color: #000000; padding: 28px 24px 18px 24px; border-bottom: 1px solid #27272a; text-align: center;">
            <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom: 12px;">
              <tr>
                <td align="center" style="width: 48px; height: 48px; background-color: #09090b; border: 1.5px solid #f59e0b; border-radius: 14px; text-align: center;">
                  <img src="https://dev.memoryweaver.studio/icon.svg" width="28" height="28" alt="Memory Weaver Logo" style="display: block; margin: 0 auto;" />
                </td>
              </tr>
            </table>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 6px;">
              CONTACT INQUIRY
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
              New Message from ${data.name}
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #a1a1aa; font-family: 'Courier New', Courier, monospace;">
              CATEGORY: <span style="color: #fbbf24; font-weight: bold;">${data.category}</span>
            </p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 24px; font-size: 14px; line-height: 1.6; background-color: #000000;">
            <!-- Message Box -->
            <div style="margin-bottom: 20px;">
              <span style="font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 1.5px; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
                PATRON MESSAGE
              </span>
              <div style="background-color: #09090b; border: 1px solid #27272a; border-left: 3px solid #f59e0b; padding: 14px 18px; border-radius: 8px; color: #e4e4e7; font-style: italic; font-family: Georgia, serif; white-space: pre-wrap;">
                "${data.message}"
              </div>
            </div>

            <!-- Metadata Table -->
            <div style="margin-bottom: 16px;">
              <span style="font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 1.5px; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
                SUBMISSION DETAILS
              </span>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background-color: #09090b; border: 1px solid #27272a; border-radius: 10px; overflow: hidden;">
                <tbody>
                  <tr style="border-bottom: 1px solid #18181b;">
                    <td style="padding: 10px 14px; color: #71717a; font-weight: 700; width: 110px;">Name</td>
                    <td style="padding: 10px 14px; color: #ffffff; font-weight: 600;">${data.name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #18181b;">
                    <td style="padding: 10px 14px; color: #71717a; font-weight: 700;">Email</td>
                    <td style="padding: 10px 14px; color: #fbbf24; font-family: monospace;"><a href="mailto:${data.email}" style="color: #fbbf24; text-decoration: none;">${data.email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 14px; color: #71717a; font-weight: 700;">Category</td>
                    <td style="padding: 10px 14px; color: #e4e4e7;">${data.category}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #09090b; border-top: 1px solid #27272a; padding: 14px; text-align: center;">
            <p style="font-size: 10px; color: #71717a; margin: 0; text-transform: uppercase; letter-spacing: 0.15em; font-family: 'Courier New', Courier, monospace;">
              Memory Weaver Studio • Confidential &amp; Bespoke Archiving
            </p>
          </div>
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
