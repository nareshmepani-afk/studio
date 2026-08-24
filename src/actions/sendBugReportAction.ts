'use server';

import { Resend } from 'resend';
import { APP_VERSION } from '@/config/version';
import { STUDIO_EMAILS, STUDIO_EMAIL_SENDERS } from '@/config/emailConfig';

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
    
    // Construct Google Cloud Log Explorer URLs
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'memory-weaver-8rk9t';
    const traceQuery = `resource.type="global"\njsonPayload.traceId="${diagnostics.traceId}"`;
    const userQuery = `resource.type="global"\njsonPayload.userId="${diagnostics.userId}"`;
    
    const gcpTraceUrl = `https://console.cloud.google.com/logs/query;query=${encodeURIComponent(traceQuery)}?project=${projectId}`;
    const gcpUserUrl = `https://console.cloud.google.com/logs/query;query=${encodeURIComponent(userQuery)}?project=${projectId}`;

    // 1. Send Support Ticket Email (From noreply@ to support@ to prevent loop suppression)
    await resend.emails.send({
      from: STUDIO_EMAIL_SENDERS.NOREPLY,
      to: STUDIO_EMAILS.SUPPORT,
      replyTo: diagnostics.userEmail !== 'unauthenticated' ? diagnostics.userEmail : STUDIO_EMAILS.SUPPORT,
      subject: `[BUG REPORT - FAST TRACK] Trace: ${diagnostics.traceId}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #ffffff; background-color: #000000; border: 2px solid #f59e0b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);">
          <!-- Header Banner with Logo Medallion -->
          <div style="background-color: #000000; padding: 36px 28px 24px 28px; border-bottom: 1px solid #27272a; text-align: center;">
            <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom: 14px;">
              <tr>
                <td align="center" style="width: 52px; height: 52px; background-color: #09090b; border: 1.5px solid #f59e0b; border-radius: 16px; text-align: center;">
                  <img src="https://dev.memoryweaver.studio/icon.svg" width="30" height="30" alt="Memory Weaver Studio" style="display: block; margin: 0 auto;" />
                </td>
              </tr>
            </table>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px;">
              FAST TRACK DIAGNOSTICS
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
              Studio Support Ticket
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #a1a1aa; font-family: 'Courier New', Courier, monospace;">
              TRACE ID: <span style="color: #fbbf24; font-weight: bold;">${diagnostics.traceId}</span>
            </p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 28px 24px; background-color: #000000;">
            <!-- Feedback Box -->
            <div style="margin-bottom: 24px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 0.1em; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
                PATRON FEEDBACK
              </span>
              <div style="background-color: #09090b; border-left: 3px solid #f59e0b; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #e2e8f0; border: 1px solid #27272a; border-left: 3px solid #f59e0b; white-space: pre-wrap;">${description}</div>
            </div>

            <!-- Fast Track Action Buttons -->
            <div style="margin-bottom: 24px; background: #09090b; border: 1px solid #27272a; padding: 20px; border-radius: 14px; text-align: center;">
              <span style="font-size: 11px; color: #f59e0b; font-weight: 800; display: block; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-family: 'Courier New', Courier, monospace;">
                CLOUD TRACE DIAGNOSTICS
              </span>
              <a href="${gcpTraceUrl}" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #000000; font-weight: 800; font-size: 12px; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35); margin: 4px;">
                Inspect Traces in GCP Console ↗
              </a>
              <a href="${gcpUserUrl}" target="_blank" style="display: inline-block; background-color: #18181b; color: #e2e8f0; border: 1px solid #3f3f46; font-weight: 700; font-size: 12px; text-decoration: none; padding: 12px 20px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; margin: 4px;">
                Filter User Logs ↗
              </a>
            </div>

            <!-- Diagnostics Metadata Table -->
            <div style="margin-bottom: 16px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 0.1em; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
                SESSION TELEMETRY
              </span>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background-color: #09090b; border: 1px solid #27272a; border-radius: 10px; overflow: hidden;">
                <tbody>
                  <tr style="border-bottom: 1px solid #18181b;">
                    <td style="padding: 10px 14px; color: #71717a; font-weight: 700; width: 110px;">User Email</td>
                    <td style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${diagnostics.userEmail}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #18181b;">
                    <td style="padding: 10px 14px; color: #71717a; font-weight: 700;">User ID</td>
                    <td style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${diagnostics.userId}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #18181b;">
                    <td style="padding: 10px 14px; color: #71717a; font-weight: 700;">Path</td>
                    <td style="padding: 10px 14px; color: #fbbf24; font-family: monospace;">${diagnostics.path}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #18181b;">
                    <td style="padding: 10px 14px; color: #71717a; font-weight: 700;">Version</td>
                    <td style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${diagnostics.version}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #18181b;">
                    <td style="padding: 10px 14px; color: #71717a; font-weight: 700;">Timestamp</td>
                    <td style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${diagnostics.timestamp}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 14px; color: #71717a; font-weight: 700; vertical-align: top;">User Agent</td>
                    <td style="padding: 10px 14px; color: #a1a1aa; font-size: 11px; font-family: monospace; line-height: 1.4;">${diagnostics.userAgent}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #09090b; border-top: 1px solid #27272a; padding: 18px; text-align: center;">
            <p style="font-size: 10px; color: #71717a; margin: 0; text-transform: uppercase; letter-spacing: 0.15em; font-family: 'Courier New', Courier, monospace;">
              Sent via Telemetry Engine ${APP_VERSION} • Memory Weaver Studio
            </p>
          </div>
        </div>
      `,
    });

    // 2. If the user is authenticated, send a beautiful confirmation receipt
    const hasValidEmail = diagnostics.userEmail && diagnostics.userEmail !== 'unauthenticated' && diagnostics.userEmail.includes('@');
    if (hasValidEmail) {
      await resend.emails.send({
        from: STUDIO_EMAIL_SENDERS.SUPPORT,
        to: diagnostics.userEmail,
        subject: `We've received your bug report [Trace: ${diagnostics.traceId}]`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #ffffff; background-color: #000000; border: 2px solid #f59e0b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);">
            <!-- Header Banner with Logo Medallion -->
            <div style="background-color: #000000; padding: 36px 28px 24px 28px; border-bottom: 1px solid #27272a; text-align: center;">
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom: 14px;">
                <tr>
                  <td align="center" style="width: 52px; height: 52px; background-color: #09090b; border: 1.5px solid #f59e0b; border-radius: 16px; text-align: center;">
                    <img src="https://dev.memoryweaver.studio/icon.svg" width="30" height="30" alt="Memory Weaver Studio" style="display: block; margin: 0 auto;" />
                  </td>
                </tr>
              </table>
              <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px;">
                STUDIO SUPPORT DESK
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
                Report Logged Successfully
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #a1a1aa; font-family: 'Courier New', Courier, monospace;">
                TRACE ID: <span style="color: #fbbf24; font-weight: bold;">${diagnostics.traceId}</span>
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 28px 24px; line-height: 1.6; font-size: 14px; background-color: #000000;">
              <p style="color: #ffffff; margin-top: 0; font-weight: 600;">Dear Patron,</p>
              
              <p style="color: #d4d4d8;">
                Thank you for helping us preserve absolute craftsmanship at Memory Weaver Studio. We have received your report regarding the session on <code style="font-family: monospace; color: #fbbf24; background: #18181b; border: 1px solid #27272a; padding: 2px 6px; border-radius: 4px;">${diagnostics.path}</code>.
              </p>

              <div style="background-color: #09090b; border: 1px solid #27272a; border-left: 3px solid #f59e0b; padding: 16px; border-radius: 8px; color: #e4e4e7; font-style: italic; margin: 20px 0;">
                "${description}"
              </div>

              <p style="color: #a1a1aa; font-size: 13px;">
                Using our <strong style="color: #ffffff;">Fast-Track Diagnostic Shield</strong>, we have captured anonymous telemetry parameters (including error vectors and application state) and dispatched them directly to the engineering bridge to isolate the issue.
              </p>

              <!-- CTA Button -->
              <div style="margin: 24px 0; text-align: center;">
                <a href="https://dev.memoryweaver.studio/studio" style="display: inline-block; background-color: #f59e0b; color: #000000; font-weight: 800; font-size: 13px; text-decoration: none; padding: 13px 28px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);">
                  Return to Studio Production Desk ↗
                </a>
              </div>

              <p style="color: #71717a; font-size: 12px; margin-bottom: 0; border-top: 1px solid #18181b; padding-top: 16px;">
                If you have any further notes, simply reply to this email to reach your assigned concierge.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #09090b; border-top: 1px solid #27272a; padding: 18px; text-align: center;">
              <p style="font-size: 10px; color: #71717a; margin: 0; text-transform: uppercase; letter-spacing: 0.15em; font-family: 'Courier New', Courier, monospace;">
                Memory Weaver Studio • Confidential & Bespoke Archiving
              </p>
            </div>
          </div>
        `,
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

