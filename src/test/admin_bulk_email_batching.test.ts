import { describe, it, expect, vi } from 'vitest';
import { 
  parseCsvRows, 
  parseAudienceCsv, 
  generateSampleAudienceCsv, 
  getDemoAudiencePreset,
  generateBatchAuditCsv
} from '../lib/audienceCsvParser';
import { 
  sendAdminBatchChunkAction, 
  EmailDispatchReceipt
} from '../app/admin/emailActions';
import { EMAIL_TEMPLATES_CATALOG } from '../lib/emailTemplates';

// Mock session and admin whitelist for server action tests
vi.mock('@/lib/session', () => ({
  getSession: vi.fn().mockResolvedValue({ email: 'admin@memoryweaver.studio' }),
  verifyAdminWhitelist: vi.fn().mockResolvedValue({ isValid: true, role: 'FOUNDER' })
}));

describe('MW-194: Bulk Email Dispatch & Audience Batching Engine', () => {

  describe('1. RFC 4180 CSV Row Tokenizer (parseCsvRows)', () => {
    it('parses standard unquoted CSV rows', () => {
      const csv = 'email,name,role\r\nalice@example.com,Alice,Director\r\nbob@example.com,Bob,Editor';
      const rows = parseCsvRows(csv);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual(['email', 'name', 'role']);
      expect(rows[1]).toEqual(['alice@example.com', 'Alice', 'Director']);
      expect(rows[2]).toEqual(['bob@example.com', 'Bob', 'Editor']);
    });

    it('correctly handles commas embedded within quoted strings', () => {
      const csv = 'email,name,title\r\neleanor@example.com,"Eleanor Vance","Summer on the Coast, 1964"';
      const rows = parseCsvRows(csv);
      expect(rows).toHaveLength(2);
      expect(rows[1][0]).toBe('eleanor@example.com');
      expect(rows[1][1]).toBe('Eleanor Vance');
      expect(rows[1][2]).toBe('Summer on the Coast, 1964');
    });

    it('correctly handles escaped double-quotes ("")', () => {
      const csv = 'email,name\r\narthur@example.com,"Arthur ""The Bard"" Pendelton"';
      const rows = parseCsvRows(csv);
      expect(rows).toHaveLength(2);
      expect(rows[1][1]).toBe('Arthur "The Bard" Pendelton');
    });

    it('handles mixed CRLF and LF line endings with whitespace trimming', () => {
      const csv = "email,name\n  user1@example.com  ,  User One  \r\nuser2@example.com,User Two";
      const rows = parseCsvRows(csv);
      expect(rows).toHaveLength(3);
      expect(rows[1]).toEqual(['user1@example.com', 'User One']);
      expect(rows[2]).toEqual(['user2@example.com', 'User Two']);
    });

    it('returns empty array when text is blank or only whitespace', () => {
      expect(parseCsvRows('')).toEqual([]);
      expect(parseCsvRows('   \r\n   ')).toEqual([]);
    });
  });

  describe('2. Audience CSV Ingestion & Mapping (parseAudienceCsv)', () => {
    it('auto-detects standard and synonymous email/name headers', () => {
      const csv = [
        'recipient_email,director_name,claimedMemoryTitle',
        'eleanor@example.com,"Eleanor Vance","The Great Voyage"',
        'arthur@example.com,"Arthur Pendelton","The Orchard"'
      ].join('\r\n');

      const result = parseAudienceCsv(csv, 'welcome_host_pass');
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toHaveLength(2);
      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows[0].email).toBe('eleanor@example.com');
      expect(result.validRows[0].name).toBe('Eleanor Vance');
      expect(result.validRows[0].props.claimedMemoryTitle).toBe('The Great Voyage');
    });

    it('deduplicates duplicate email addresses (Directive 2 & rule of preservation)', () => {
      const csv = [
        'email,name',
        'duplicate@example.com,First Entry',
        'unique@example.com,Second Entry',
        'DUPLICATE@example.com,Duplicate Second Instance'
      ].join('\r\n');

      const result = parseAudienceCsv(csv, 'welcome_host_pass');
      expect(result.totalRows).toBe(3);
      expect(result.validRows).toHaveLength(2);
      expect(result.invalidRows).toHaveLength(1);
      expect(result.duplicateCount).toBe(1);
      expect(result.invalidRows[0].isDuplicate).toBe(true);
      expect(result.invalidRows[0].status).toBe('SKIPPED');
    });

    it('flags rows with malformed email syntax', () => {
      const csv = [
        'email,name',
        'valid@example.com,Valid User',
        'not-an-email,Invalid User',
        ',Missing Email User'
      ].join('\r\n');

      const result = parseAudienceCsv(csv, 'collaborator_invite');
      expect(result.validRows).toHaveLength(1);
      expect(result.invalidRows).toHaveLength(2);
      expect(result.invalidRows[0].errorReason).toContain('Invalid email syntax');
      expect(result.invalidRows[1].errorReason).toContain('Missing recipient email');
    });

    it('populates defaultProps for unprovided template keys', () => {
      const csv = 'email\r\nuser@example.com';
      const result = parseAudienceCsv(csv, 'welcome_host_pass');
      expect(result.validRows).toHaveLength(1);
      const row = result.validRows[0];
      expect(row.props.studioUrl).toContain('https://');
      expect(row.props.cinemaUrl).toContain('https://');
    });
  });

  describe('3. Dynamic Sample CSV Generation', () => {
    EMAIL_TEMPLATES_CATALOG.forEach(tmpl => {
      it(`generates a valid, parseable sample CSV for template: ${tmpl.id}`, () => {
        const sampleCsv = generateSampleAudienceCsv(tmpl.id);
        expect(sampleCsv).toBeTruthy();
        expect(sampleCsv.toLowerCase()).toContain('email');
        
        const parsed = parseAudienceCsv(sampleCsv, tmpl.id);
        expect(parsed.totalRows).toBeGreaterThanOrEqual(3);
        expect(parsed.validRows.length).toBe(parsed.totalRows);
        expect(parsed.invalidRows).toHaveLength(0);
        expect(parsed.duplicateCount).toBe(0);
      });
    });
  });

  describe('4. Demo Audience Presets (5 Storytellers)', () => {
    EMAIL_TEMPLATES_CATALOG.forEach(tmpl => {
      it(`generates 5 valid demo audience storytellers for: ${tmpl.id}`, () => {
        const demoAudience = getDemoAudiencePreset(tmpl.id);
        expect(demoAudience).toHaveLength(5);
        demoAudience.forEach(row => {
          expect(row.isValid).toBe(true);
          expect(row.email).toContain('@');
          expect(row.name).toBeTruthy();
          expect(row.status).toBe('PENDING');
          expect(Object.keys(row.props).length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('5. Rate-Limited Batch Server Action (sendAdminBatchChunkAction)', () => {
    it('dispatches a bounded chunk of recipients in Simulated Mode when RESEND_API_KEY is unset (Directive 3)', async () => {
      const recipients = [
        { id: 'row_1', email: 'eleanor@example.co.uk', props: { name: 'Eleanor' } },
        { id: 'row_2', email: 'arthur@example.co.uk', props: { name: 'Arthur' } }
      ];

      const result = await sendAdminBatchChunkAction({
        templateId: 'welcome_host_pass',
        recipients,
        chunkIndex: 0,
        delayMsBetweenEmails: 10
      });

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(result.simulatedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.results).toHaveLength(2);

      // Verify receipt structure and SPF/DKIM verification tags
      const receipt1 = result.results[0].receipt;
      expect(receipt1.status).toBe('SIMULATED');
      expect(receipt1.targetEmail).toBe('eleanor@example.co.uk');
      expect(receipt1.messageId).toContain('sim_batch_');
      expect(receipt1.spfValid).toBe(true);
      expect(receipt1.dkimValid).toBe(true);
      expect(receipt1.dmarcValid).toBe(true);
    });

    it('bounds chunk execution to maximum 10 recipients (Directive 1)', async () => {
      const largeBatch = Array.from({ length: 15 }, (_, i) => ({
        id: `row_${i}`,
        email: `storyteller_${i}@example.co.uk`,
        props: { name: `Storyteller ${i}` }
      }));

      const result = await sendAdminBatchChunkAction({
        templateId: 'welcome_host_pass',
        recipients: largeBatch,
        chunkIndex: 0,
        delayMsBetweenEmails: 5
      });

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(10); // Clamped to 10
    });

    it('handles invalid email addresses within the batch gracefully', async () => {
      const batchWithInvalid = [
        { id: 'row_good', email: 'good@example.co.uk', props: { name: 'Good' } },
        { id: 'row_bad', email: 'bad-email-no-domain', props: { name: 'Bad' } }
      ];

      const result = await sendAdminBatchChunkAction({
        templateId: 'welcome_host_pass',
        recipients: batchWithInvalid,
        delayMsBetweenEmails: 5
      });

      expect(result.success).toBe(true);
      expect(result.deliveredCount + result.simulatedCount).toBe(1);
      expect(result.failedCount).toBe(1);

      const badReceipt = result.results.find(r => r.id === 'row_bad')?.receipt;
      expect(badReceipt?.status).toBe('FAILED');
      expect(badReceipt?.error).toContain('Invalid or missing');
    });
  });

  describe('6. Batch Delivery Audit Report Generator (generateBatchAuditCsv)', () => {
    it('generates a clean CSV report with delivery details and SPF/DKIM checks', () => {
      const sampleReceipts: Array<{ id: string; receipt?: EmailDispatchReceipt }> = [
        {
          id: 'row_1',
          receipt: {
            success: true,
            messageId: 'mw_msg_101',
            status: 'DELIVERED',
            templateId: 'welcome_host_pass',
            targetEmail: 'director@example.co.uk',
            subject: '🎬 Welcome to Memory Weaver Studio',
            timestamp: '2026-08-23T11:00:00.000Z',
            spfValid: true,
            dkimValid: true,
            dmarcValid: true
          }
        },
        {
          id: 'row_2',
          receipt: {
            success: false,
            status: 'FAILED',
            templateId: 'welcome_host_pass',
            targetEmail: 'bad@example.co.uk',
            subject: '',
            timestamp: '2026-08-23T11:00:01.000Z',
            spfValid: false,
            dkimValid: false,
            dmarcValid: false,
            error: 'Mailbox not found'
          }
        }
      ];

      const csvReport = generateBatchAuditCsv(sampleReceipts);
      expect(csvReport).toContain('Recipient Email,Status,Message ID,Subject,Timestamp,SPF,DKIM,DMARC,Error');
      expect(csvReport).toContain('"director@example.co.uk","DELIVERED","mw_msg_101"');
      expect(csvReport).toContain('"bad@example.co.uk","FAILED"');
      expect(csvReport).toContain('"Mailbox not found"');
    });
  });

  describe('7. UK English Orthography Compliance (Rule 20)', () => {
    it('uses British English spelling in generated content and templates', () => {
      const sample1 = generateSampleAudienceCsv('welcome_host_pass');
      expect(sample1).not.toMatch(/\btheater\b/i);
      expect(sample1).not.toMatch(/\bfavorite\b/i);
    });
  });

});
