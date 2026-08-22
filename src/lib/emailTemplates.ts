/**
 * Memory Weaver Email Template Engine
 * 
 * Production Obsidian-Gold dark aesthetic email templates for:
 * 1. Welcome Host Pass (6-Month Director Pass + 4K Cloud Vault)
 * 2. Collaborator Invite (Guest Director / Family Storyteller stage access)
 * 3. Password Reset (Security gateway link with 1-hour expiration)
 * 4. Premiere Notification (Act V Cinema private screening invitation)
 * 
 * Adheres strictly to UK English orthography and dark mode email client standards.
 */

export type EmailTemplateId = 
  | 'welcome_host_pass'
  | 'collaborator_invite'
  | 'password_reset'
  | 'premiere_notification';

export interface EmailTemplateMetadata {
  id: EmailTemplateId;
  name: string;
  category: 'Onboarding' | 'Collaboration' | 'Security' | 'Cinema';
  subject: string;
  description: string;
  defaultProps: Record<string, string>;
  availableTags: string[];
}

export const EMAIL_TEMPLATES_CATALOG: EmailTemplateMetadata[] = [
  {
    id: 'welcome_host_pass',
    name: 'Welcome Host Pass',
    category: 'Onboarding',
    subject: '🎬 Welcome to Memory Weaver Studio — Production Hub Initialised',
    description: 'Sent upon director registration. Confirms complimentary 6-month pass, 5.0 GB vault, and 5-act journey.',
    defaultProps: {
      name: 'Director Eleanor Vance',
      email: 'eleanor.vance@gmail.com',
      claimedMemoryTitle: 'Summer on the Coast, 1964',
      studioUrl: 'https://dev.memoryweaver.studio/studio',
      cinemaUrl: 'https://dev.memoryweaver.studio/cinema'
    },
    availableTags: ['{{name}}', '{{email}}', '{{claimedMemoryTitle}}', '{{studioUrl}}', '{{cinemaUrl}}']
  },
  {
    id: 'collaborator_invite',
    name: 'Collaborator Invite',
    category: 'Collaboration',
    subject: '🎟️ Invitation to Direct & Collaborate — Memory Weaver Studio',
    description: 'Sent to family members and co-directors to join a live soundstage session with role permissions.',
    defaultProps: {
      inviterName: 'Arthur Pendelton',
      inviteeEmail: 'sarah.pendelton@gmail.com',
      memoryTitle: 'The Orchard Harvest & Family Roots',
      role: 'Guest Director & Storyteller',
      passcode: '8492',
      inviteUrl: 'https://dev.memoryweaver.studio/studio?collab=8492'
    },
    availableTags: ['{{inviterName}}', '{{inviteeEmail}}', '{{memoryTitle}}', '{{role}}', '{{passcode}}', '{{inviteUrl}}']
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    category: 'Security',
    subject: '🔐 Reset Your Memory Weaver Studio Password',
    description: 'Security gateway access recovery email with 1-hour expiration guard and direct link.',
    defaultProps: {
      email: 'director@memoryweaver.studio',
      resetLink: 'https://dev.memoryweaver.studio/auth/reset-password?token=mw_sec_99382b_demo',
      expiresInMinutes: '60'
    },
    availableTags: ['{{email}}', '{{resetLink}}', '{{expiresInMinutes}}']
  },
  {
    id: 'premiere_notification',
    name: 'Premiere Notification',
    category: 'Cinema',
    subject: '🌟 Private Screening Invitation: The Orchard Harvest — Act V Premiere',
    description: 'Sent to family and audiences for private Act V Cinema screenings with Smart TV cast guide.',
    defaultProps: {
      hostName: 'Arthur & Eleanor Pendelton',
      recipientName: 'Family & Friends',
      memoryTitle: 'The Orchard Harvest & Family Roots',
      releaseYear: '2026',
      runtime: '04:18',
      cinemaUrl: 'https://dev.memoryweaver.studio/cinema?id=demo_memory_orchard'
    },
    availableTags: ['{{hostName}}', '{{recipientName}}', '{{memoryTitle}}', '{{releaseYear}}', '{{runtime}}', '{{cinemaUrl}}']
  }
];

// Reusable Obsidian-Gold Email Wrapper
function renderEmailWrapper({
  title,
  subtitle,
  categoryBadge,
  contentHtml,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
  footerNote
}: {
  title: string;
  subtitle: string;
  categoryBadge: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  footerNote?: string;
}) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark only" />
  <meta name="supported-color-schemes" content="dark only" />
  <title>${title}</title>
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
    /* Outlook.com / Hotmail Pure Black Theme Protection */
    [data-ogsc] .mw-bg { background-color: #000000 !important; }
    [data-ogsc] .mw-card { background-color: #000000 !important; border-color: #f59e0b !important; }
    [data-ogsc] .mw-box { background-color: #09090b !important; border-color: #27272a !important; }
    [data-ogsc] .mw-logo-box { background-color: #000000 !important; border-color: #1e293b !important; }
    [data-ogsc] .mw-text-white { color: #ffffff !important; }
    [data-ogsc] .mw-text-gold { color: #f59e0b !important; }
    [data-ogsc] .mw-text-emerald { color: #10b981 !important; }
    [data-ogsc] .mw-text-muted { color: #a1a1aa !important; }
    [data-ogsc] .mw-btn { background-color: #f59e0b !important; color: #000000 !important; }

    [data-ogsb] .mw-bg { background-color: #000000 !important; }
    [data-ogsb] .mw-card { background-color: #000000 !important; }
    [data-ogsb] .mw-box { background-color: #09090b !important; }
    [data-ogsb] .mw-logo-box { background-color: #000000 !important; }
    [data-ogsb] .mw-btn { background-color: #f59e0b !important; }
  </style>
</head>
<body class="mw-bg" style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <!-- Full Screen Wrapper -->
  <table class="mw-bg" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; width: 100%; margin: 0; padding: 40px 16px;">
    <tr>
      <td align="center" valign="top">
        <!-- Main Card Container (Pure Obsidian Black) -->
        <table class="mw-card" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #000000; border: 2px solid #f59e0b; border-radius: 28px; overflow: hidden; box-shadow: 0 30px 70px rgba(0, 0, 0, 1);">
          
          <!-- Header Banner with Pure Black Logo Medallion -->
          <tr>
            <td class="mw-bg" style="background-color: #000000; padding: 40px 32px 24px 32px; border-bottom: 1px solid #27272a; text-align: center;">
              
              <!-- Pure Black Logo Box -->
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom: 16px;">
                <tr>
                  <td class="mw-logo-box" align="center" style="width: 56px; height: 56px; background-color: #000000; border: 1.5px solid #1e293b; border-radius: 18px; text-align: center;">
                    <img src="https://dev.memoryweaver.studio/icon.svg" width="32" height="32" alt="Memory Weaver Logo" style="display: block; margin: 0 auto; background-color: #000000;" />
                  </td>
                </tr>
              </table>

              <div class="mw-text-gold" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px;">
                ${categoryBadge}
              </div>
              <h1 class="mw-text-white" style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; text-transform: uppercase;">
                ${title}
              </h1>
              <p class="mw-text-muted" style="margin: 8px 0 0 0; font-size: 12px; color: #a1a1aa; font-family: 'Courier New', Courier, monospace;">
                ${subtitle}
              </p>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #000000;">
              ${contentHtml}

              <!-- Action Buttons -->
              ${ctaText && ctaUrl ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px; margin-bottom: 12px;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="background-color: #f59e0b; border-radius: 12px;">
                          <a href="${ctaUrl}" target="_blank" class="mw-btn" style="background-color: #f59e0b; border: 1px solid #f59e0b; border-radius: 12px; color: #000000; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 900; line-height: 18px; text-align: center; text-decoration: none; text-transform: uppercase; letter-spacing: 1.5px; padding: 16px 36px; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);">
                            ${ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${secondaryCtaText && secondaryCtaUrl ? `
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <a href="${secondaryCtaUrl}" target="_blank" style="display: inline-block; background-color: #09090b; color: #ffffff; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; padding: 12px 28px; border-radius: 12px; text-align: center; border: 1px solid #27272a;">
                      ${secondaryCtaText}
                    </a>
                  </td>
                </tr>
                ` : ''}
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Footer (Concierge Direct Support) -->
          <tr>
            <td class="mw-bg" style="background-color: #000000; padding: 24px 32px; border-top: 1px solid #27272a; text-align: center; font-size: 11px; color: #71717a; line-height: 18px;">
              <p class="mw-text-white" style="margin: 0 0 8px 0; font-family: 'Courier New', Courier, monospace; font-weight: 700; color: #ffffff;">
                Memory Weaver Studio • Preserving Family Legacies in 4K
              </p>
              <p class="mw-text-muted" style="margin: 0; color: #a1a1aa;">
                ${footerNote || 'Have questions or need assistance? Reply directly to this email or contact our director concierge at <a href="mailto:studio@memoryweaver.studio" class="mw-text-gold" style="color: #f59e0b; text-decoration: none; font-weight: 700;">studio@memoryweaver.studio</a>.'}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Welcome Host Pass Email Renderer
 */
export function renderWelcomeHostPassEmail(params?: {
  name?: string;
  email?: string;
  claimedMemoryId?: string;
  claimedMemoryTitle?: string;
  studioUrl?: string;
  cinemaUrl?: string;
}) {
  const name = params?.name || 'Storyteller';
  const claimedMemoryTitle = params?.claimedMemoryTitle || 'Family Heritage Chronicle';
  const studioUrl = params?.studioUrl || 'https://dev.memoryweaver.studio/studio';
  const cinemaUrl = params?.cinemaUrl || (params?.claimedMemoryId ? `https://dev.memoryweaver.studio/cinema?id=${params.claimedMemoryId}` : 'https://dev.memoryweaver.studio/cinema');

  const contentHtml = `
    <p class="mw-text-white" style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #ffffff;">
      Greetings Director <strong class="mw-text-gold" style="color: #f59e0b;">${name}</strong>,
    </p>
    <p class="mw-text-muted" style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #d4d4d8;">
      Your personal cinematic studio has been provisioned. You now have full access to our Hollywood-grade autobiographical preservation tools to capture, refine, and broadcast living family oral histories.
    </p>

    <!-- Credentials Box -->
    <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 16px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #27272a;">
          <span class="mw-text-gold" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Tier Status</span>
          <strong class="mw-text-white" style="font-size: 14px; color: #ffffff;">🌟 6-Month Director Host Pass (Complimentary)</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px;">
          <span class="mw-text-emerald" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Storage Allocation</span>
          <strong class="mw-text-white" style="font-size: 14px; color: #ffffff;">📦 5.0 GB 4K Cloud Master Vault</strong>
        </td>
      </tr>
    </table>

    <!-- The 5-Act Cinematic Journey -->
    <h3 class="mw-text-gold" style="margin: 0 0 16px 0; font-size: 13px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; font-family: 'Courier New', Courier, monospace;">
      🎬 The 5-Act Production Journey:
    </h3>

    <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #09090b; border: 1px solid #27272a; border-radius: 16px;">
      <tr>
        <td class="mw-text-white" style="padding: 14px 18px; font-size: 13px; line-height: 20px; color: #f4f4f5;">
          <strong class="mw-text-gold" style="color: #f59e0b;">1. Act I (Scriptorium):</strong> Draft your authentic spoken monologue or choose a family spark prompt to ignite your narrative memory.
        </td>
      </tr>
      <tr>
        <td class="mw-text-white" style="padding: 14px 18px; font-size: 13px; line-height: 20px; color: #f4f4f5; border-top: 1px solid #27272a;">
          <strong class="mw-text-gold" style="color: #f59e0b;">2. Act II (Director's Briefing):</strong> Calibrate lighting, rehearse spoken pacing, and review sensory word anchors before stepping on stage.
        </td>
      </tr>
      <tr>
        <td class="mw-text-white" style="padding: 14px 18px; font-size: 13px; line-height: 20px; color: #f4f4f5; border-top: 1px solid #27272a;">
          <strong class="mw-text-gold" style="color: #f59e0b;">3. Acts III &amp; IV (Soundstage &amp; Director's Cut):</strong> Record your 4K video take with live teleprompter guidance and AI sensory soundtrack synchronisation.
        </td>
      </tr>
      <tr>
        <td class="mw-text-white" style="padding: 14px 18px; font-size: 13px; line-height: 20px; color: #f4f4f5; border-top: 1px solid #27272a;">
          <strong class="mw-text-gold" style="color: #f59e0b;">4. Act V (Cinema Premiere):</strong> Generate 4K movie posters, invite family with private passcodes, or stream directly to Smart TVs.
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailWrapper({
    title: 'PRODUCTION HUB INITIALISED',
    subtitle: 'Host Pass Active • 6-Month Complimentary Studio Access',
    categoryBadge: 'MEMORY WEAVER STUDIO // PRODUCTION SUITE',
    contentHtml,
    ctaText: '🎙️ ENTER YOUR PRODUCTION STUDIO',
    ctaUrl: studioUrl,
    secondaryCtaText: params?.claimedMemoryId ? `🎬 Watch "${claimedMemoryTitle}"` : undefined,
    secondaryCtaUrl: params?.claimedMemoryId ? cinemaUrl : undefined
  });

  return {
    subject: '🎬 Welcome to Memory Weaver Studio — Production Hub Initialised',
    html
  };
}

/**
 * 2. Collaborator Invite Email Renderer
 */
export function renderCollaboratorInviteEmail(params?: {
  inviterName?: string;
  inviteeEmail?: string;
  memoryTitle?: string;
  role?: string;
  inviteUrl?: string;
  passcode?: string;
}) {
  const inviterName = params?.inviterName || 'Arthur Pendelton';
  const memoryTitle = params?.memoryTitle || 'The Orchard Harvest & Family Roots';
  const role = params?.role || 'Guest Director & Storyteller';
  const passcode = params?.passcode || '8492';
  const inviteUrl = params?.inviteUrl || `https://dev.memoryweaver.studio/studio?collab=${passcode}`;

  const contentHtml = `
    <p class="mw-text-white" style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #ffffff;">
      You have been invited by <strong class="mw-text-gold" style="color: #f59e0b;">${inviterName}</strong> to collaborate on an archival memory production.
    </p>
    <p class="mw-text-muted" style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #d4d4d8;">
      Memory Weaver Studio enables family members and co-directors to contribute oral reflections, shape scripts in real-time, and preserve multi-generational stories in 4K resolution.
    </p>

    <!-- Session Invitation Card -->
    <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 16px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #27272a;">
          <span class="mw-text-gold" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Production Title</span>
          <strong class="mw-text-white" style="font-size: 16px; color: #ffffff;">🎬 "${memoryTitle}"</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 20px; border-bottom: 1px solid #27272a;">
          <span class="mw-text-emerald" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Assigned Role</span>
          <strong class="mw-text-white" style="font-size: 14px; color: #ffffff;">✨ ${role}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 20px;">
          <span class="mw-text-gold" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Stage Passcode</span>
          <code style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 900; color: #f59e0b; letter-spacing: 4px; display: inline-block; background-color: #18181b; padding: 4px 12px; border-radius: 8px; border: 1px solid #3f3f46;">${passcode}</code>
        </td>
      </tr>
    </table>

    <!-- Production Guide -->
    <h3 class="mw-text-gold" style="margin: 0 0 14px 0; font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; font-family: 'Courier New', Courier, monospace;">
      🎙️ What you will do in the studio:
    </h3>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #d4d4d8; font-size: 13px; line-height: 22px;">
      <li>Review the storyteller's spoken monologue draft in the Scriptorium.</li>
      <li>Provide real-time feedback and prompt suggestions during live rehearsals.</li>
      <li>Record your own perspective to weave into the final multi-angle master cut.</li>
    </ul>
  `;

  const html = renderEmailWrapper({
    title: 'COLLABORATION INVITATION',
    subtitle: 'Guest Director Stage Access • Living Family Chronicle',
    categoryBadge: 'MEMORY WEAVER STUDIO // PRODUCTION ACCESS PASS',
    contentHtml,
    ctaText: '✨ JOIN PRODUCTION STAGE',
    ctaUrl: inviteUrl,
    footerNote: 'This collaboration pass was generated by an authenticated Memory Weaver Director. If you do not recognise the inviter, please notify <a href="mailto:support@memoryweaver.studio" class="mw-text-gold" style="color: #f59e0b; text-decoration: none; font-weight: 700;">support@memoryweaver.studio</a>.'
  });

  return {
    subject: `🎟️ Invitation to Direct & Collaborate: "${memoryTitle}" — Memory Weaver Studio`,
    html
  };
}

/**
 * 3. Password Reset Email Renderer
 */
export function renderPasswordResetEmail(params?: {
  email?: string;
  resetLink?: string;
  expiresInMinutes?: string | number;
}) {
  const email = params?.email || 'director@memoryweaver.studio';
  const resetLink = params?.resetLink || 'https://dev.memoryweaver.studio/auth/reset-password?token=mw_sec_demo';
  const expiresInMinutes = params?.expiresInMinutes || '60';

  const contentHtml = `
    <p class="mw-text-white" style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #ffffff;">
      A password reset request has been received for your Memory Weaver Studio account (<strong class="mw-text-gold" style="color: #f59e0b;">${email}</strong>).
    </p>
    <p class="mw-text-muted" style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #d4d4d8;">
      To restore access to your studio and encrypted master reels, click the secure verification link below.
    </p>

    <!-- Security Advisory Box -->
    <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; border: 1px solid #3f3f46; border-radius: 16px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <div class="mw-text-gold" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
            ⚠️ Security Notice
          </div>
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
            This single-use reset link expires in <strong style="color: #ffffff;">${expiresInMinutes} minutes</strong>. If you did not initiate this request, your account remains secure and no action is required.
          </p>
        </td>
      </tr>
    </table>

    <!-- Direct URL Fallback -->
    <p style="margin: 24px 0 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-family: 'Courier New', Courier, monospace;">
      Or copy and paste this link into your browser:
    </p>
    <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 10px; padding: 10px 14px; word-break: break-all; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #a1a1aa;">
      ${resetLink}
    </div>
  `;

  const html = renderEmailWrapper({
    title: 'PASSWORD RESET REQUEST',
    subtitle: 'Authentication Recovery • 1-Hour Security Window',
    categoryBadge: 'MEMORY WEAVER STUDIO // SECURITY GATEWAY',
    contentHtml,
    ctaText: '🔑 RESET YOUR PASSWORD',
    ctaUrl: resetLink,
    footerNote: 'Memory Weaver Security Gateway • All authentication requests are monitored and cryptographically verified.'
  });

  return {
    subject: '🔐 Reset Your Memory Weaver Studio Password',
    html
  };
}

/**
 * 4. Premiere Notification Email Renderer
 */
export function renderPremiereNotificationEmail(params?: {
  hostName?: string;
  recipientName?: string;
  memoryTitle?: string;
  releaseYear?: string;
  runtime?: string;
  cinemaUrl?: string;
}) {
  const hostName = params?.hostName || 'Arthur & Eleanor Pendelton';
  const recipientName = params?.recipientName || 'Family & Friends';
  const memoryTitle = params?.memoryTitle || 'The Orchard Harvest & Family Roots';
  const releaseYear = params?.releaseYear || '2026';
  const runtime = params?.runtime || '04:18';
  const cinemaUrl = params?.cinemaUrl || 'https://dev.memoryweaver.studio/cinema';

  const contentHtml = `
    <p class="mw-text-white" style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #ffffff;">
      Dear <strong class="mw-text-gold" style="color: #f59e0b;">${recipientName}</strong>,
    </p>
    <p class="mw-text-muted" style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #d4d4d8;">
      <strong class="mw-text-gold" style="color: #f59e0b;">${hostName}</strong> invites you to the exclusive private screening of their newly finished cinematic oral history chronicle.
    </p>

    <!-- Premiere Feature Poster Box -->
    <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; border: 1.5px solid #f59e0b; border-radius: 18px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 20px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, rgba(9, 9, 11, 1) 100%);">
          <span class="mw-text-gold" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2.5px; display: block; margin-bottom: 6px;">
            🌟 CHRONICLE CINEMA RELEASE • ACT V
          </span>
          <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: -0.3px;">
            ${memoryTitle}
          </h2>
          <p style="margin: 0; font-size: 12px; color: #a1a1aa; font-family: 'Courier New', Courier, monospace;">
            Directed by ${hostName} • Release Year: ${releaseYear} • Duration: ${runtime}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 20px; border-top: 1px solid #27272a;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-size: 12px; color: #e4e4e7; line-height: 20px;">
                📺 <strong>Living Room TV &amp; Cinema Ready:</strong> Includes 4K Master Video Reel, Spatial Audio Soundtrack, and interactive digital Keepsake.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Smart TV Streaming Guide -->
    <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 18px;">
          <span class="mw-text-emerald" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">
            📺 Lean-Back TV Experience
          </span>
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
            Open on your mobile device or laptop to stream directly to your Living Room TV via AirPlay or Google Cast.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailWrapper({
    title: 'ACT V PREMIERE INVITATION',
    subtitle: 'Private Master Screening • Living Room TV Ready',
    categoryBadge: 'MEMORY WEAVER CINEMA // EXCLUSIVE SCREENING',
    contentHtml,
    ctaText: '🍿 ENTER THE PRIVATE CINEMA',
    ctaUrl: cinemaUrl,
    footerNote: 'Chronicle Cinema Release • Memory Weaver Studio private screenings are protected by family encryption.'
  });

  return {
    subject: `🌟 Private Screening Invitation: "${memoryTitle}" — Act V Premiere`,
    html
  };
}

/**
 * Universal Template Dispatch Resolver
 */
export function renderEmailTemplateById(
  templateId: EmailTemplateId,
  props?: Record<string, any>
): { subject: string; html: string } {
  switch (templateId) {
    case 'welcome_host_pass':
      return renderWelcomeHostPassEmail(props);
    case 'collaborator_invite':
      return renderCollaboratorInviteEmail(props);
    case 'password_reset':
      return renderPasswordResetEmail(props);
    case 'premiere_notification':
      return renderPremiereNotificationEmail(props);
    default:
      return renderWelcomeHostPassEmail(props);
  }
}
