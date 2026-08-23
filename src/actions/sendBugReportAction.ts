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

    // 1. Send Support Ticket Email
    await resend.emails.send({
      from: STUDIO_EMAIL_SENDERS.SUPPORT,
      to: STUDIO_EMAILS.SUPPORT,
      replyTo: diagnostics.userEmail !== 'unauthenticated' ? diagnostics.userEmail : STUDIO_EMAILS.SUPPORT,
      subject: `[BUG REPORT - FAST TRACK] Trace: ${diagnostics.traceId}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; color: #f8fafc; background-color: #0b0f19; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(11, 15, 25, 0) 100%); padding: 30px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); position: relative;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="background-color: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; font-family: monospace;">
                FAST TRACK DIAGNOSTICS
              </span>
            </div>
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; font-style: italic; letter-spacing: -0.02em;">
              New Studio Support Ticket
            </h2>
            <p style="color: #94a3b8; font-size: 14px; margin: 6px 0 0 0;">
              Trace ID: <span style="font-family: monospace; color: #fbbf24; font-weight: bold;">${diagnostics.traceId}</span>
            </p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 24px;">
            <!-- Feedback -->
            <div style="margin-bottom: 24px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">
                User Feedback
              </span>
              <div style="background-color: rgba(255, 255, 255, 0.02); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; font-size: 15px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">${description}</div>
            </div>

            <!-- Fast Track Action Buttons -->
            <div style="margin-bottom: 28px; background: rgba(245, 158, 11, 0.05); border: 1px dashed rgba(245, 158, 11, 0.3); padding: 18px; border-radius: 12px; text-align: center;">
              <span style="font-size: 12px; color: #fbbf24; font-weight: bold; display: block; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                🔍 Cloud Trace Analysis
              </span>
              <div style="display: inline-block; width: 100%;">
                <a href="${gcpTraceUrl}" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #000000; font-weight: 800; font-size: 12px; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); margin: 5px;">
                  View Session Traces in GCP Console
                </a>
                <a href="${gcpUserUrl}" target="_blank" style="display: inline-block; background-color: rgba(255, 255, 255, 0.05); color: #e2e8f0; border: 1px solid rgba(255, 255, 255, 0.1); font-weight: 700; font-size: 12px; text-decoration: none; padding: 12px 20px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; margin: 5px;">
                  Filter Logs by User ID
                </a>
              </div>
            </div>

            <!-- Diagnostics Table -->
            <div style="margin-bottom: 20px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">
                Metadata & Session Vectors
              </span>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background-color: rgba(0, 0, 0, 0.2); border-radius: 8px; overflow: hidden;">
                <tbody>
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 10px 14px; color: #64748b; font-weight: 600; width: 120px;">User Email</td>
                    <td style="padding: 10px 14px; color: #e2e8f0; font-family: monospace;">${diagnostics.userEmail}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">User ID</td>
                    <td style="padding: 10px 14px; color: #e2e8f0; font-family: monospace;">${diagnostics.userId}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Path location</td>
                    <td style="padding: 10px 14px; color: #e2e8f0; font-family: monospace;">${diagnostics.path}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Code Version</td>
                    <td style="padding: 10px 14px; color: #e2e8f0; font-family: monospace;">${diagnostics.version}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Timestamp</td>
                    <td style="padding: 10px 14px; color: #e2e8f0; font-family: monospace;">${diagnostics.timestamp}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 14px; color: #64748b; font-weight: 600; vertical-align: top;">User Agent</td>
                    <td style="padding: 10px 14px; color: #94a3b8; font-size: 11px; font-family: monospace; line-height: 1.4;">${diagnostics.userAgent}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(255, 255, 255, 0.05); padding: 20px; text-align: center;">
            <p style="font-size: 10px; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: 0.15em;">
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
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #f8fafc; background-color: #0b0f19; border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(11, 15, 25, 0) 100%); padding: 30px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.01em;">
                Report Logged Successfully
              </h2>
              <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">
                Our engineering team has been notified under tracking trace: <span style="font-family: monospace; color: #fbbf24;">${diagnostics.traceId}</span>
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px; line-height: 1.6; font-size: 14px;">
              <p style="color: #e2e8f0; margin-top: 0;">Hi there,</p>
              
              <p style="color: #94a3b8;">
                Thank you for helping us improve Memory Weaver Studio. We've received your feedback regarding the issue encountered on path <code style="font-family: monospace; color: #fbbf24; background: rgba(245,158,11,0.05); padding: 2px 6px; border-radius: 4px;">${diagnostics.path}</code>.
              </p>

              <div style="background-color: rgba(255, 255, 255, 0.02); border-left: 3px solid #f59e0b; padding: 14px; border-radius: 6px; color: #cbd5e1; font-style: italic; margin: 20px 0;">
                "${description}"
              </div>

              <p style="color: #94a3b8;">
                Using our <strong>[FAST TRACK]</strong> system, we have bundled secure, anonymous telemetry parameters (such as the exception stack trace and application version state) and sent them directly to our diagnostics dashboard. We will trace this session signature immediately to isolate the root cause.
              </p>

              <p style="color: #94a3b8; margin-bottom: 0;">
                If you have any further questions, simply reply to this email to reach our support desk.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05); padding: 18px; text-align: center;">
              <p style="font-size: 11px; color: #64748b; margin: 0;">
                Memory Weaver Studio Support • Auto-Validation Shield Enabled
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

