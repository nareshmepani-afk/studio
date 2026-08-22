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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark only" />
  <meta name="supported-color-schemes" content="dark only" />
  <title>Welcome to Memory Weaver Studio</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    :root {
      color-scheme: dark only;
      supported-color-schemes: dark only;
    }
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #000000 !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    /* Outlook.com / Hotmail Dark Mode Override Protection */
    [data-ogsc] .mw-bg { background-color: #000000 !important; }
    [data-ogsc] .mw-card { background-color: #080d1a !important; border-color: #f59e0b !important; }
    [data-ogsc] .mw-header { background-color: #020617 !important; }
    [data-ogsc] .mw-box { background-color: #030712 !important; border-color: #1e293b !important; }
    [data-ogsc] .mw-text-white { color: #ffffff !important; }
    [data-ogsc] .mw-text-gold { color: #f59e0b !important; }
    [data-ogsc] .mw-text-emerald { color: #10b981 !important; }
    [data-ogsc] .mw-text-muted { color: #94a3b8 !important; }
    [data-ogsc] .mw-btn { background-color: #f59e0b !important; color: #000000 !important; }

    [data-ogsb] .mw-bg { background-color: #000000 !important; }
    [data-ogsb] .mw-card { background-color: #080d1a !important; }
    [data-ogsb] .mw-header { background-color: #020617 !important; }
    [data-ogsb] .mw-box { background-color: #030712 !important; }
    [data-ogsb] .mw-btn { background-color: #f59e0b !important; }
  </style>
</head>
<body class="mw-bg" style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <!-- Full Screen Wrapper -->
  <table class="mw-bg" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; width: 100%; margin: 0; padding: 40px 16px;">
    <tr>
      <td align="center" valign="top">
        <!-- Main Card Container -->
        <table class="mw-card" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #080d1a; border: 2px solid #f59e0b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95);">
          
          <!-- Header Banner (Obsidian Top) -->
          <tr>
            <td class="mw-header" style="background-color: #020617; padding: 36px 32px 24px 32px; border-bottom: 2px solid #1e293b; text-align: center;">
              <div class="mw-text-gold" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px;">
                🎬 MEMORY WEAVER STUDIO // PRODUCTION SUITE
              </div>
              <h1 class="mw-text-white" style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; text-transform: uppercase;">
                PRODUCTION HUB INITIALISED
              </h1>
              <p class="mw-text-muted" style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8; font-family: 'Courier New', Courier, monospace;">
                Host Pass Active • 6-Month Complimentary Studio Access
              </p>
            </td>
          </tr>

          <!-- Welcome Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p class="mw-text-white" style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #ffffff;">
                Greetings Director <strong class="mw-text-gold" style="color: #f59e0b;">${name || 'Storyteller'}</strong>,
              </p>
              <p class="mw-text-muted" style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                Your personal cinematic studio has been provisioned. You now have full access to our Hollywood-grade autobiographical preservation tools to capture, refine, and broadcast living family oral histories.
              </p>

              <!-- Credentials Box -->
              <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030712; border: 1px solid #1e293b; border-radius: 16px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b;">
                    <span class="mw-text-gold" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Tier Status</span>
                    <strong class="mw-text-white" style="font-size: 14px; color: #ffffff;">🌟 6-Month Director Host Pass (Complimentary)</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px;">
                    <span class="mw-text-emerald" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Storage Allocation</span>
                    <strong class="mw-text-white" style="font-size: 14px; color: #ffffff;">📦 5.0 GB 4K Cloud Master Vault</strong>
                  </td>
                </tr>
              </table>

              <!-- 3-Step Production Kickstart -->
              <h3 class="mw-text-gold" style="margin: 0 0 16px 0; font-size: 13px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; font-family: 'Courier New', Courier, monospace;">
                🚀 The 3-Step Production Kickstart:
              </h3>

              <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; background-color: #030712; border: 1px solid #1e293b; border-radius: 16px;">
                <tr>
                  <td class="mw-text-white" style="padding: 12px 14px; font-size: 13px; line-height: 20px; color: #f8fafc;">
                    <strong class="mw-text-gold" style="color: #f59e0b;">1. Act I (Scriptorium):</strong> Capture your authentic spoken monologue or choose a family spark prompt to ignite your narrative memory.
                  </td>
                </tr>
                <tr>
                  <td class="mw-text-white" style="padding: 12px 14px; font-size: 13px; line-height: 20px; color: #f8fafc; border-top: 1px solid #1e293b;">
                    <strong class="mw-text-gold" style="color: #f59e0b;">2. Acts III &amp; IV (Soundstage):</strong> Record your video take with live teleprompter guidance and AI sensory soundtrack synchronisation.
                  </td>
                </tr>
                <tr>
                  <td class="mw-text-white" style="padding: 12px 14px; font-size: 13px; line-height: 20px; color: #f8fafc; border-top: 1px solid #1e293b;">
                    <strong class="mw-text-gold" style="color: #f59e0b;">3. Act V (Cinema Premiere):</strong> Generate 4K movie posters, invite family with private passcodes, or stream directly to Smart TVs.
                  </td>
                </tr>
              </table>

              <!-- Action Button (Bulletproof Table-Based Outlook CTA) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="background-color: #f59e0b; border-radius: 12px;">
                          <a href="${studioUrl}" target="_blank" class="mw-btn" style="background-color: #f59e0b; border: 1px solid #f59e0b; border-radius: 12px; color: #000000; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 900; line-height: 18px; text-align: center; text-decoration: none; text-transform: uppercase; letter-spacing: 1.5px; padding: 16px 36px;">
                            🎙️ Enter Your Production Studio
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${claimedMemoryId ? `
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <a href="${cinemaUrl}" style="display: inline-block; background-color: #030712; color: #ffffff; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; padding: 12px 28px; border-radius: 12px; text-align: center; border: 1px solid #334155;">
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
            <td class="mw-header" style="background-color: #020617; padding: 24px 32px; border-top: 2px solid #1e293b; text-align: center; font-size: 11px; color: #94a3b8; line-height: 18px;">
              <p class="mw-text-white" style="margin: 0 0 8px 0; font-family: 'Courier New', Courier, monospace; font-weight: 700; color: #ffffff;">
                Memory Weaver Studio • Preserving Family Legacies in 4K
              </p>
              <p class="mw-text-muted" style="margin: 0; color: #94a3b8;">
                Have questions or need assistance? Reply directly to this email or contact our director concierge at <a href="mailto:studio@memoryweaver.studio" class="mw-text-gold" style="color: #f59e0b; text-decoration: none; font-weight: 700;">studio@memoryweaver.studio</a>.
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
