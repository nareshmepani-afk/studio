'use server';

import { Resend } from 'resend';
import { headers } from 'next/headers';
import { APP_VERSION } from '@/config/version';
import { STUDIO_EMAILS, STUDIO_EMAIL_SENDERS } from '@/config/emailConfig';
import { resolvePublicAppUrl } from '@/config/environment';
import { adminDb } from '@/lib/firebase-admin';
import { renderEmailWrapper } from '@/lib/emailTemplates';
import { generateBugReportId, type BugReportRecord } from '@/lib/bugReports';

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

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendBugReportAction(
  payload: BugReportPayload
): Promise<{ success: boolean; reportId?: string; message: string }> {
  const trimmedDescription = (payload?.description || '').trim().slice(0, 5000);
  if (!trimmedDescription) {
    return { success: false, message: 'Description is required.' };
  }

  const diagnostics = payload.diagnostics || ({} as BugReportPayload['diagnostics']);
  const now = Date.now();
  const reportId = generateBugReportId(now);
  const traceId = (diagnostics.traceId || `mw_telemetry_${now}`).trim();

  let hostHeader: string | null = null;
  try {
    const headersList = await headers();
    hostHeader = headersList.get('x-forwarded-host') || headersList.get('host');
  } catch {
    hostHeader = null;
  }

  const baseUrl = resolvePublicAppUrl(hostHeader);

  const record: BugReportRecord = {
    reportId,
    traceId,
    userId: diagnostics.userId || 'guest_preview',
    userEmail: diagnostics.userEmail || 'unauthenticated',
    path: diagnostics.path || '/',
    appVersion: diagnostics.version || APP_VERSION,
    userAgent: (diagnostics.userAgent || '').slice(0, 500),
    description: trimmedDescription,
    status: 'OPEN',
    createdAt: now,
    createdAtIso: diagnostics.timestamp || new Date(now).toISOString(),
    updatedAt: now,
    environmentHost: baseUrl,
    planeIssueId: null,
    resolutionNotes: '',
  };

  let persisted = false;
  if (adminDb) {
    try {
      await adminDb.collection('bug_reports').doc(reportId).set(record);
      persisted = true;
    } catch (dbErr) {
      console.error('[Bug Report] Failed to persist bug_reports document:', dbErr);
    }
  }

  const studioTraceUrl = `${baseUrl}/admin?suite=bugs&reportId=${encodeURIComponent(reportId)}&traceId=${encodeURIComponent(traceId)}`;
  const studioUserUrl = `${baseUrl}/admin?suite=bugs&userId=${encodeURIComponent(record.userId)}`;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    if (persisted) {
      console.log(`[Bug Report] Saved ${reportId} to Firestore (email skipped: RESEND_API_KEY unset).`);
      return { success: true, reportId, message: 'Bug report logged to triage queue.' };
    }
    return { success: false, message: 'Support delivery services are currently unavailable.' };
  }

  try {
    const resend = new Resend(resendApiKey);

    const safeDesc = escapeHtml(record.description);
    const safeEmail = escapeHtml(record.userEmail);
    const safeUserId = escapeHtml(record.userId);
    const safePath = escapeHtml(record.path);
    const safeVersion = escapeHtml(record.appVersion);
    const safeTimestamp = escapeHtml(record.createdAtIso);
    const safeUa = escapeHtml(record.userAgent);

    const alertContentHtml = `
      <div style="margin-bottom: 20px;">
        <span class="mw-text-muted" style="font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 1.5px; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
          PATRON FEEDBACK (${escapeHtml(reportId)})
        </span>
        <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="background-color: #000000; border: 1px solid #27272a; border-left: 3px solid #f59e0b; border-radius: 8px;">
          <tr>
            <td class="mw-text-muted" bgcolor="#000000" style="padding: 14px 18px; color: #e4e4e7; font-style: italic; font-family: Georgia, serif; font-size: 14px; line-height: 22px; white-space: pre-wrap;">
              "${safeDesc}"
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 16px;">
        <span class="mw-text-muted" style="font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 800; letter-spacing: 1.5px; display: block; margin-bottom: 8px; font-family: 'Courier New', Courier, monospace;">
          SESSION TELEMETRY
        </span>
        <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background-color: #000000; border: 1px solid #27272a; border-radius: 10px; overflow: hidden;">
          <tbody>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700; width: 110px;">Report ID</td>
              <td class="mw-text-gold" bgcolor="#000000" style="padding: 10px 14px; color: #fbbf24; font-family: monospace;">${escapeHtml(reportId)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">User Email</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${safeEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">User ID</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${safeUserId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">Path</td>
              <td class="mw-text-gold" bgcolor="#000000" style="padding: 10px 14px; color: #fbbf24; font-family: monospace;">${safePath}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">Version</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${safeVersion}</td>
            </tr>
            <tr style="border-bottom: 1px solid #18181b;">
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700;">Timestamp</td>
              <td class="mw-text-white" bgcolor="#000000" style="padding: 10px 14px; color: #e4e4e7; font-family: monospace;">${safeTimestamp}</td>
            </tr>
            <tr>
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #71717a; font-weight: 700; vertical-align: top;">User Agent</td>
              <td class="mw-text-muted" bgcolor="#000000" style="padding: 10px 14px; color: #a1a1aa; font-size: 11px; font-family: monospace; line-height: 1.4;">${safeUa}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const alertHtml = renderEmailWrapper({
      title: 'STUDIO SUPPORT TICKET',
      subtitle: `${reportId} • TRACE: ${traceId}`,
      categoryBadge: 'FAST TRACK DIAGNOSTICS',
      contentHtml: alertContentHtml,
      ctaText: '🔍 OPEN BUG TRIAGE QUEUE ↗',
      ctaUrl: studioTraceUrl,
      secondaryCtaText: 'FILTER USER REPORTS ↗',
      secondaryCtaUrl: studioUserUrl,
      footerNote: `Sent via Telemetry Engine ${APP_VERSION} (${baseUrl})`,
    });

    const supportAlertRecipient = process.env.INTERNAL_SUPPORT_ALERT_EMAIL || STUDIO_EMAILS.DIRECTOR;
    await resend.emails.send({
      from: STUDIO_EMAIL_SENDERS.STUDIO,
      to: supportAlertRecipient,
      replyTo: record.userEmail !== 'unauthenticated' ? record.userEmail : STUDIO_EMAILS.DIRECTOR,
      subject: `[BUG REPORT - ${reportId}] Trace: ${traceId}`,
      html: alertHtml,
    });

    const hasValidEmail =
      record.userEmail && record.userEmail !== 'unauthenticated' && record.userEmail.includes('@');
    if (hasValidEmail) {
      const receiptContentHtml = `
        <p class="mw-text-white" style="color: #ffffff; margin-top: 0; font-weight: 600; font-size: 15px;">Dear Patron,</p>
        <p class="mw-text-muted" style="color: #d4d4d8; font-size: 14px; line-height: 22px;">
          Thank you for helping us preserve absolute craftsmanship at Memory Weaver Studio. We have received your report regarding the session on <code class="mw-box" style="font-family: monospace; color: #fbbf24; background: transparent; border: 1px solid #3f3f46; padding: 2px 6px; border-radius: 4px;">${safePath}</code>.
        </p>
        <table class="mw-box" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="background-color: #000000; border: 1px solid #27272a; border-left: 3px solid #f59e0b; border-radius: 8px; margin: 18px 0;">
          <tr>
            <td class="mw-text-muted" bgcolor="#000000" style="padding: 14px 18px; color: #e4e4e7; font-style: italic; font-family: Georgia, serif; font-size: 14px; line-height: 22px; white-space: pre-wrap;">
              "${safeDesc}"
            </td>
          </tr>
        </table>
        <p class="mw-text-muted" style="color: #a1a1aa; font-size: 13px; line-height: 20px;">
          Reference ID: <strong class="mw-text-white" style="color: #ffffff;">${escapeHtml(reportId)}</strong>. Our team will trace this diagnostic snapshot directly to resolution.
        </p>
      `;

      const receiptHtml = renderEmailWrapper({
        title: 'REPORT LOGGED SUCCESSFULLY',
        subtitle: `REFERENCE: ${reportId}`,
        categoryBadge: 'STUDIO SUPPORT DESK',
        contentHtml: receiptContentHtml,
        ctaText: 'RETURN TO STUDIO PRODUCTION DESK ↗',
        ctaUrl: `${baseUrl}/studio`,
      });

      await resend.emails.send({
        from: STUDIO_EMAIL_SENDERS.SUPPORT,
        to: record.userEmail,
        subject: `We've received your bug report [${reportId} | Trace: ${traceId}]`,
        html: receiptHtml,
      });
    }

    console.log(`[Bug Report] Ticket generated: ${reportId} (trace: ${traceId})`);
    return { success: true, reportId, message: 'Bug report submitted successfully.' };
  } catch (error: any) {
    console.error('[Bug Report] Resend execution failed:', error);
    if (persisted) {
      return {
        success: true,
        reportId,
        message: 'Bug report logged to triage queue (email notification delayed).',
      };
    }
    return { success: false, message: error?.message || 'Failed to deliver telemetry report.' };
  }
}
