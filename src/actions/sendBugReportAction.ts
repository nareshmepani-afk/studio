'use server';

import { Resend } from 'resend';
import { APP_VERSION } from '@/config/version';
import { STUDIO_EMAILS, STUDIO_EMAIL_SENDERS } from '@/config/emailConfig';
import { renderEmailWrapper } from '@/lib/emailTemplates';

interface BugReportPayload {
  description: string;
  diagnostics: {
    traceId: string;
    userId: string;
    userEmail: string;
    userAgent: string;
    path: string;
    timestamp: string;
    version: string;
  };
}

export async function sendBugReportAction(payload: BugReportPayload): Promise<{ success: boolean; message: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { description, diagnostics } = payload;
    
    // Construct Domain-Aligned Diagnostic URLs (Matching sending domain to satisfy spam heuristics)
    const studioTraceUrl = `https://dev.memoryweaver.studio/admin?traceId=${encodeURIComponent(diagnostics.traceId)}`;
    const studioUserUrl = `https://dev.memoryweaver.studio/admin?userId=${encodeURIComponent(diagnostics.userId)}`;

    // 1. Support Alert HTML (Rendered via renderEmailWrapper for 100% Outlook dark mode protection)
    const alertContentHtml = `
      <!-- Feedback Box -->
      <div style="margin-bottom: 20px;">
        <span class="mw-text-muted" style="font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 1.5px; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
          PATRON FEEDBACK
        </span>
        <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="background-color: #000000; border: 1px solid #27272a; border-left: 3px solid #f59e0b; border-radius: 8px;">
          <tr>
            <td class="mw-text-muted" bgcolor="#000000" style="padding: 14px 18px; color: #e4e4e7; font-style: italic; font-family: Georgia, serif; font-size: 14px; line-height: 22px; white-space: pre-wrap;">
              "${description}"
            </td>
          </tr>
        </table>
      </div>

      <!-- Diagnostics Metadata Table -->
      <div style="margin-bottom: 16px;">
        <span class="mw-text-muted" style="font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 1.5px; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
          SESSION TELEMETRY
        </span>
        <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background-color: #000000; border: 1px solid #27272a; border-radius: 10px; overflow: hidden;">
          <tbody>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700; width: 110px;">User Email</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${diagnostics.userEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">User ID</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${diagnostics.userId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">Path</td>
              <td class="mw-text-gold" bgcolor="#000000" style="padding: 10px 14px; color: #fbbf24; font-family: monospace;">${diagnostics.path}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">Version</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${diagnostics.version}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">Timestamp</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${diagnostics.timestamp}</td>
            </tr>
            <tr>
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700; vertical-align: top;">User Agent</td>
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #a1a1aa; font-size: 11px; font-family: monospace; line-height: 1.4;">${diagnostics.userAgent}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const alertHtml = renderEmailWrapper({
      title: 'STUDIO SUPPORT TICKET',
      subtitle: `TRACE ID: ${diagnostics.traceId}`,
      categoryBadge: 'FAST TRACK DIAGNOSTICS',
      contentHtml: alertContentHtml,
      ctaText: '🔍 INSPECT TELEMETRY IN STUDIO CONSOLE ↗',
      ctaUrl: studioTraceUrl,
      secondaryCtaText: 'FILTER USER ACTIVITY LOGS ↗',
      secondaryCtaUrl: studioUserUrl,
      footerNote: `Sent via Telemetry Engine ${APP_VERSION}`
    });

    // 1. Send Support Ticket Email (To director@ to avoid Resend bounce suppression on support@)
    const supportAlertRecipient = process.env.INTERNAL_SUPPORT_ALERT_EMAIL || STUDIO_EMAILS.DIRECTOR;
    await resend.emails.send({
      from: STUDIO_EMAIL_SENDERS.STUDIO,
      to: supportAlertRecipient,
      replyTo: diagnostics.userEmail !== 'unauthenticated' ? diagnostics.userEmail : STUDIO_EMAILS.DIRECTOR,
      subject: `[BUG REPORT - FAST TRACK] Trace: ${diagnostics.traceId}`,
      html: alertHtml,
    });

    // 2. If the user is authenticated, send a beautiful confirmation receipt
    const hasValidEmail = diagnostics.userEmail && diagnostics.userEmail !== 'unauthenticated' && diagnostics.userEmail.includes('@');
    if (hasValidEmail) {
      const receiptContentHtml = `
        <p class="mw-text-white" style="color: #ffffff; margin-top: 0; font-weight: 600; font-size: 15px;">Dear Patron,</p>
        
        <p class="mw-text-muted" style="color: #d4d4d8; font-size: 14px; line-height: 22px;">
          Thank you for helping us preserve absolute craftsmanship at Memory Weaver Studio. We have received your report regarding the session on <code class="mw-box" style="font-family: monospace; color: #fbbf24; background: transparent; border: 1px solid #3f3f46; padding: 2px 6px; border-radius: 4px;">${diagnostics.path}</code>.
        </p>

        <!-- Obsidian-Gold Quote Box (Outlook/Hotmail Inversion Shield) -->
        <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="background-color: #000000; border: 1px solid #27272a; border-left: 3px solid #f59e0b; border-radius: 8px; margin: 18px 0;">
          <tr>
            <td class="mw-text-muted" bgcolor="#000000" style="padding: 14px 18px; color: #e4e4e7; font-style: italic; font-family: Georgia, serif; font-size: 14px; line-height: 22px; white-space: pre-wrap;">
              "${description}"
            </td>
          </tr>
        </table>

        <p class="mw-text-muted" style="color: #a1a1aa; font-size: 13px; line-height: 20px;">
          Using our <strong class="mw-text-white" style="color: #ffffff;">Fast-Track Diagnostic Shield</strong>, we have captured anonymous telemetry parameters (including error vectors and application state) and dispatched them directly to the engineering bridge to isolate the issue.
        </p>

        <p class="mw-text-muted" style="color: #71717a; font-size: 12px; margin-bottom: 0; border-top: 1px solid #18181b; padding-top: 14px;">
          If you have any further notes, simply reply to this email to reach your assigned concierge.
        </p>
      `;

      const receiptHtml = renderEmailWrapper({
        title: 'REPORT LOGGED SUCCESSFULLY',
        subtitle: `TRACE ID: ${diagnostics.traceId}`,
        categoryBadge: 'STUDIO SUPPORT DESK',
        contentHtml: receiptContentHtml,
        ctaText: 'RETURN TO STUDIO PRODUCTION DESK ↗',
        ctaUrl: 'https://dev.memoryweaver.studio/studio',
      });

      await resend.emails.send({
        from: STUDIO_EMAIL_SENDERS.SUPPORT,
        to: diagnostics.userEmail,
        subject: `We've received your bug report [Trace: ${diagnostics.traceId}]`,
        html: receiptHtml,
      });
      console.log(`[Bug Report] Confirmation email sent to ${diagnostics.userEmail}`);
    }

    console.log(`[Bug Report] Ticket generated successfully. Trace ID: ${diagnostics.traceId}`);
    return { success: true, message: "Bug report submitted successfully." };
  } catch (error: any) {
    console.error("[Bug Report] Resend execution failed:", error);
    return { success: false, message: error?.message || "Failed to deliver telemetry report." };
  }
}

