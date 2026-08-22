import { describe, it, expect } from 'vitest';
import { 
  EMAIL_TEMPLATES_CATALOG, 
  renderEmailTemplateById, 
  renderWelcomeHostPassEmail, 
  renderCollaboratorInviteEmail, 
  renderPasswordResetEmail, 
  renderPremiereNotificationEmail 
} from '../lib/emailTemplates';
import { sendAdminTestEmailAction, retriggerClientOnboardingPassAction } from '../app/admin/emailActions';

describe('MW-193: Admin Email Operations & Live Template Dispatcher Suite', () => {

  describe('EMAIL_TEMPLATES_CATALOG Metadata Integrity', () => {
    it('contains all 4 core production email templates', () => {
      expect(EMAIL_TEMPLATES_CATALOG).toHaveLength(4);
      const templateIds = EMAIL_TEMPLATES_CATALOG.map(t => t.id);
      expect(templateIds).toContain('welcome_host_pass');
      expect(templateIds).toContain('collaborator_invite');
      expect(templateIds).toContain('password_reset');
      expect(templateIds).toContain('premiere_notification');
    });

    it('defines complete default properties and available tags for each template', () => {
      EMAIL_TEMPLATES_CATALOG.forEach(template => {
        expect(template.name).toBeTruthy();
        expect(template.category).toBeTruthy();
        expect(template.subject).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(Object.keys(template.defaultProps).length).toBeGreaterThan(0);
        expect(template.availableTags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Template 1: Welcome Host Pass Renderer', () => {
    it('renders Obsidian-Gold theme and complete 5-act journey', () => {
      const result = renderWelcomeHostPassEmail({
        name: 'Director Eleanor',
        claimedMemoryTitle: 'Summer on the Coast, 1964'
      });

      expect(result.subject).toContain('Welcome to Memory Weaver Studio');
      expect(result.html).toContain('PRODUCTION HUB INITIALISED');
      expect(result.html).toContain('Director Eleanor');
      expect(result.html).toContain('6-Month Director Host Pass (Complimentary)');
      expect(result.html).toContain('5.0 GB 4K Cloud Master Vault');
      expect(result.html).toContain('Act I (Scriptorium)');
      expect(result.html).toContain('Act V (Cinema Premiere)');
      expect(result.html).toContain('ENTER YOUR PRODUCTION STUDIO');
      expect(result.html).toContain('#000000');
      expect(result.html).toContain('#f59e0b');
    });

    it('renders secondary cinema button when claimedMemoryId is provided', () => {
      const result = renderWelcomeHostPassEmail({
        name: 'Director Eleanor',
        claimedMemoryId: 'mem_123',
        claimedMemoryTitle: 'Family Heritage Chronicle'
      });
      expect(result.html).toContain('Family Heritage Chronicle');
      expect(result.html).toContain('https://dev.memoryweaver.studio/cinema?id=mem_123');
    });

    it('falls back safely when params are omitted', () => {
      const result = renderWelcomeHostPassEmail();
      expect(result.html).not.toContain('undefined');
      expect(result.html).not.toContain('null');
      expect(result.html).toContain('Storyteller');
      expect(result.html).toContain('Host Pass Active');
      expect(result.html).toContain('5.0 GB 4K Cloud Master Vault');
    });
  });

  describe('Template 2: Collaborator Invite Renderer', () => {
    it('renders invitation details, assigned role, and stage passcode', () => {
      const result = renderCollaboratorInviteEmail({
        inviterName: 'Arthur Pendelton',
        memoryTitle: 'The Orchard Harvest',
        role: 'Guest Director & Storyteller',
        passcode: '8492'
      });

      expect(result.subject).toContain('Invitation to Direct & Collaborate');
      expect(result.html).toContain('COLLABORATION INVITATION');
      expect(result.html).toContain('Arthur Pendelton');
      expect(result.html).toContain('The Orchard Harvest');
      expect(result.html).toContain('Guest Director & Storyteller');
      expect(result.html).toContain('8492');
      expect(result.html).toContain('JOIN PRODUCTION STAGE');
    });

    it('handles fallback defaults with zero undefined artifacts', () => {
      const result = renderCollaboratorInviteEmail();
      expect(result.html).not.toContain('undefined');
      expect(result.html).toContain('8492');
    });
  });

  describe('Template 3: Password Reset Renderer', () => {
    it('renders security advisory, 1-hour expiration guard, and reset CTA', () => {
      const result = renderPasswordResetEmail({
        email: 'director@memoryweaver.studio',
        resetLink: 'https://dev.memoryweaver.studio/auth/reset?token=test_tok',
        expiresInMinutes: 60
      });

      expect(result.subject).toContain('Reset Your Memory Weaver Studio Password');
      expect(result.html).toContain('PASSWORD RESET REQUEST');
      expect(result.html).toContain('director@memoryweaver.studio');
      expect(result.html).toContain('60 minutes');
      expect(result.html).toContain('RESET YOUR PASSWORD');
      expect(result.html).toContain('https://dev.memoryweaver.studio/auth/reset?token=test_tok');
    });

    it('handles missing params cleanly', () => {
      const result = renderPasswordResetEmail();
      expect(result.html).not.toContain('undefined');
      expect(result.html).toContain('60 minutes');
    });
  });

  describe('Template 4: Premiere Notification Renderer', () => {
    it('renders Cinema screening invite, film billing block, and Smart TV guide', () => {
      const result = renderPremiereNotificationEmail({
        hostName: 'Arthur & Eleanor',
        recipientName: 'Family & Friends',
        memoryTitle: 'The Orchard Harvest',
        releaseYear: '2026',
        runtime: '04:18'
      });

      expect(result.subject).toContain('Private Screening Invitation');
      expect(result.html).toContain('ACT V PREMIERE INVITATION');
      expect(result.html).toContain('Arthur & Eleanor');
      expect(result.html).toContain('The Orchard Harvest');
      expect(result.html).toContain('Duration: 04:18');
      expect(result.html).toContain('ENTER THE PRIVATE CINEMA');
      expect(result.html).toContain('Lean-Back TV Experience');
    });

    it('handles missing params cleanly', () => {
      const result = renderPremiereNotificationEmail();
      expect(result.html).not.toContain('undefined');
      expect(result.html).toContain('Living Room TV');
    });
  });

  describe('Universal renderEmailTemplateById Resolver', () => {
    it('resolves correct template by ID', () => {
      const welcome = renderEmailTemplateById('welcome_host_pass');
      expect(welcome.html).toContain('PRODUCTION HUB INITIALISED');

      const collab = renderEmailTemplateById('collaborator_invite');
      expect(collab.html).toContain('COLLABORATION INVITATION');

      const pwd = renderEmailTemplateById('password_reset');
      expect(pwd.html).toContain('PASSWORD RESET REQUEST');

      const premiere = renderEmailTemplateById('premiere_notification');
      expect(premiere.html).toContain('ACT V PREMIERE INVITATION');
    });
  });

  describe('Rule 20: UK English Orthography Audit', () => {
    it('enforces UK English spelling across all template outputs', () => {
      const welcome = renderWelcomeHostPassEmail();
      expect(welcome.html).toContain('INITIALISED');
      expect(welcome.html).toContain('synchronisation');

      const collab = renderCollaboratorInviteEmail();
      expect(collab.html).toContain('recognise');
    });
  });

  describe('Server Action Guard & Validation Tests', () => {
    it('rejects sendAdminTestEmailAction when unauthenticated or email is invalid', async () => {
      const res = await sendAdminTestEmailAction({
        templateId: 'welcome_host_pass',
        targetEmail: 'invalid-email-format'
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.error).toBeDefined();
    });

    it('rejects retriggerClientOnboardingPassAction when email is invalid', async () => {
      const res = await retriggerClientOnboardingPassAction('invalid_email');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

});
