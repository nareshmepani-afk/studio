'use server';

import { Resend } from 'resend';
import { STUDIO_EMAILS, STUDIO_EMAIL_SENDERS } from '@/config/emailConfig';
import { renderEmailWrapper } from '@/lib/emailTemplates';

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

    const contentHtml = `
      <!-- Message Box -->
      <div style="margin-bottom: 20px;">
        <span class="mw-text-muted" style="font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 1.5px; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
          PATRON MESSAGE
        </span>
        <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="background-color: #000000; border: 1px solid #27272a; border-left: 3px solid #f59e0b; border-radius: 8px;">
          <tr>
            <td class="mw-text-muted" bgcolor="#000000" style="padding: 14px 18px; color: #e4e4e7; font-style: italic; font-family: Georgia, serif; font-size: 14px; line-height: 22px; white-space: pre-wrap;">
              "${data.message}"
            </td>
          </tr>
        </table>
      </div>

      <!-- Metadata Table -->
      <div style="margin-bottom: 16px;">
        <span class="mw-text-muted" style="font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 1.5px; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
          SUBMISSION DETAILS
        </span>
        <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background-color: #000000; border: 1px solid #27272a; border-radius: 10px; overflow: hidden;">
          <tbody>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700; width: 110px;">Name</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #ffffff; font-weight: 600;">${data.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">Email</td>
              <td class="mw-text-gold" bgcolor="#000000" style="padding: 10px 14px; color: #fbbf24; font-family: monospace;"><a href="mailto:${data.email}" style="color: #fbbf24; text-decoration: none;">${data.email}</a></td>
            </tr>
            <tr>
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">Category</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #e4e4e7;">${data.category}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const html = renderEmailWrapper({
      title: `NEW MESSAGE FROM ${data.name.toUpperCase()}`,
      subtitle: `CATEGORY: ${data.category}`,
      categoryBadge: 'CONTACT INQUIRY',
      contentHtml,
      ctaText: 'REPLY TO INQUIRY ↗',
      ctaUrl: `mailto:${data.email}`,
    });

    await resend.emails.send({
      from: STUDIO_EMAIL_SENDERS.CONTACT,
      to: [STUDIO_EMAILS.SUPPORT],
      replyTo: data.email,
      subject: `[Contact] ${data.category}: ${data.name}`,
      html,
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
