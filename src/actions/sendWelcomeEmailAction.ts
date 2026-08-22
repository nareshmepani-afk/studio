'use server';

import { Resend } from 'resend';
import { headers } from 'next/headers';

interface WelcomeEmailParams {
  email: string;
  name: string;
  claimedMemoryId?: string;
  claimedMemoryTitle?: string;
}

export async function sendWelcomeEmailAction(params: WelcomeEmailParams) {
  const { email, name, claimedMemoryId, claimedMemoryTitle } = params;

  if (!process.env.RESEND_API_KEY) {
    console.warn('[sendWelcomeEmailAction] RESEND_API_KEY is not set in environment. Skipping welcome email.');
    return { success: false, message: 'Email service not configured.' };
  }

  try {
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'dev.memoryweaver.studio';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const studioUrl = `${baseUrl}/studio`;
    const cinemaUrl = claimedMemoryId ? `${baseUrl}/cinema?id=${claimedMemoryId}` : `${baseUrl}/cinema`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailHtml = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Welcome to Memory Weaver Studio</title>
  <style>
    :root {
      color-scheme: dark;
      supported-color-schemes: dark;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #020617 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
    }
    .cta-btn {
      background-color: #f59e0b !important;
      color: #020617 !important;
      text-decoration: none !important;
      font-weight: 800 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0f172a; border: 2px solid #f59e0b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #020617; padding: 36px 32px 24px 32px; border-bottom: 2px solid #1e293b; text-align: center;">
              <div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #f59e0b; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px;">
                🎬 Memory Weaver Studio // Production Suite
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; text-transform: uppercase;">
                Production Hub Initialised
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8; font-family: monospace;">
                Host Pass Active • 6-Month Complimentary Studio Access
              </p>
            </td>
          </tr>

          <!-- Welcome Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #f8fafc;">
                Greetings Director <strong>${name || 'Storyteller'}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                Your personal cinematic studio has been provisioned. You now have full access to our Hollywood-grade autobiographical preservation tools to capture, refine, and broadcast living family oral histories.
              </p>

              <!-- Credentials Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617; border: 1px solid #334155; border-radius: 16px; margin-bottom: 28px; padding: 20px;">
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b;">
                    <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Tier Status</span>
                    <strong style="font-size: 14px; color: #ffffff;">🌟 6-Month Director Host Pass (Complimentary)</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px;">
                    <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #10b981; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Storage Allocation</span>
                    <strong style="font-size: 14px; color: #ffffff;">📦 5.0 GB 4K Cloud Master Vault</strong>
                  </td>
                </tr>
              </table>

              <!-- 3-Step Production Kickstart -->
              <h3 style="margin: 0 0 16px 0; font-size: 13px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; font-family: monospace;">
                🚀 The 3-Step Production Kickstart:
              </h3>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; background-color: #020617; border: 1px solid #1e293b; border-radius: 16px; padding: 16px;">
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; line-height: 20px; color: #e2e8f0;">
                    <strong style="color: #f59e0b;">1. Act I (Scriptorium):</strong> Capture your authentic spoken monologue or choose a family spark prompt to ignite your narrative memory.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; line-height: 20px; color: #e2e8f0; border-top: 1px solid #1e293b;">
                    <strong style="color: #f59e0b;">2. Acts III &amp; IV (Soundstage):</strong> Record your video take with live teleprompter guidance and AI sensory soundtrack synchronisation.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; line-height: 20px; color: #e2e8f0; border-top: 1px solid #1e293b;">
                    <strong style="color: #f59e0b;">3. Act V (Cinema Premiere):</strong> Generate 4K movie posters, invite family with private passcodes, or stream directly to Smart TVs.
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${studioUrl}" class="cta-btn" style="display: inline-block; background-color: #f59e0b; color: #020617; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; padding: 16px 36px; border-radius: 12px; text-align: center; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);">
                      🎙️ Enter Your Production Studio
                    </a>
                  </td>
                </tr>
                ${claimedMemoryId ? `
                <tr>
                  <td align="center">
                    <a href="${cinemaUrl}" style="display: inline-block; background-color: #1e293b; color: #f8fafc; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; padding: 12px 28px; border-radius: 12px; text-align: center; border: 1px solid #475569;">
                      🎬 Watch Claimed Memory ${claimedMemoryTitle ? `("${claimedMemoryTitle}")` : ''}
                    </a>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #020617; padding: 24px 32px; border-top: 2px solid #1e293b; text-align: center; font-size: 11px; color: #94a3b8; line-height: 18px;">
              <p style="margin: 0 0 8px 0; font-family: monospace; font-weight: bold; color: #cbd5e1;">
                Memory Weaver Studio • Preserving Family Legacies in 4K
              </p>
              <p style="margin: 0;">
                Need assistance? Press <code style="background-color: #1e293b; color: #f59e0b; padding: 3px 7px; border-radius: 6px; font-weight: bold; border: 1px solid #334155;">Ctrl + /</code> (or <code style="background-color: #1e293b; color: #f59e0b; padding: 3px 7px; border-radius: 6px; font-weight: bold; border: 1px solid #334155;">⌘ + /</code> on Mac) anywhere in the Studio to open instant remote support &amp; feedback.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await resend.emails.send({
      from: 'studio@memoryweaver.studio',
      to: email,
      subject: '🎬 Welcome to Memory Weaver Studio — Production Hub Initialised',
      html: emailHtml,
    });

    console.log(`[sendWelcomeEmailAction] Welcome email sent successfully to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('[sendWelcomeEmailAction] Error sending welcome email:', error);
    return { success: false, error: error?.message || 'Failed to send welcome email.' };
  }
}
