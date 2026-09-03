'use server';

import { Resend } from 'resend';
import { headers } from 'next/headers';
import { STUDIO_EMAILS, STUDIO_EMAIL_SENDERS } from '@/config/emailConfig';

interface StudioTransitionEmailParams {
  email: string;
  targetPath?: string;
  memoryTitle?: string;
}

export async function sendStudioTransitionAction(params: StudioTransitionEmailParams) {
  const { email, targetPath, memoryTitle } = params;

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Please provide a valid email address.' };
  }

  try {
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'dev.memoryweaver.studio';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const studioUrl = targetPath ? `${baseUrl}${targetPath}` : `${baseUrl}/studio`;

    if (!process.env.RESEND_API_KEY) {
      console.warn('[sendStudioTransitionAction] RESEND_API_KEY is not set. Simulating link dispatch.');
      return { 
        success: true, 
        simulated: true, 
        link: studioUrl,
        message: 'Studio transition link generated successfully.' 
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark only" />
  <title>Your Memory Weaver Studio Link</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 40px 10px; background-color: #030712; color: #F3F4F6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0B0F19; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
    <tr>
      <td height="4" style="background: linear-gradient(90deg, #F59E0B, #B45309, #F59E0B);"></td>
    </tr>
    <tr>
      <td style="padding: 40px 32px; text-align: center;">
        <div style="display: inline-block; padding: 12px; border-radius: 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); margin-bottom: 24px;">
          <span style="font-size: 28px;">🎬</span>
        </div>
        
        <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">
          Step Onto the Soundstage
        </h1>
        
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9CA3AF;">
          You requested this transition link from your mobile device to open your Memory Weaver soundstage on an iPad, laptop, or desktop computer.
        </p>

        ${memoryTitle ? `
        <div style="background: rgba(17, 24, 39, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 14px; margin-bottom: 24px;">
          <span style="font-size: 11px; font-family: monospace; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Active Memoir</span>
          <span style="font-size: 15px; font-weight: 600; color: #FFFFFF;">${memoryTitle}</span>
        </div>
        ` : ''}

        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 32px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background: #F59E0B; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);">
              <a href="${studioUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 14px; font-weight: 700; color: #030712; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 12px;">
                Open Studio Soundstage ↗
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0 0; font-size: 11px; color: #6B7280; line-height: 1.5;">
          The private recording workstation, teleprompter, and multi-track audio scrubbers are designed for tablet or computer screens with horizontal width of 768px or greater.
        </p>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 10px; color: #4B5563; font-family: monospace; word-break: break-all;">
          Direct URL: <a href="${studioUrl}" style="color: #F59E0B; text-decoration: underline;">${studioUrl}</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await resend.emails.send({
      from: STUDIO_EMAIL_SENDERS.STUDIO,
      to: email,
      subject: '🎬 Your Memory Weaver Soundstage Link — Open on Tablet or PC',
      html: emailHtml,
    });

    return { 
      success: true, 
      link: studioUrl,
      message: 'Studio transition link sent! Check your inbox on your tablet or laptop.' 
    };
  } catch (error: any) {
    console.error('[sendStudioTransitionAction] Error sending transition email:', error);
    return { 
      success: false, 
      message: error?.message || 'Failed to dispatch email. Please copy the direct link below.' 
    };
  }
}
