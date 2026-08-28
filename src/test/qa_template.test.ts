import { describe, it, expect } from 'vitest';
import { generateQAChecklistHtml } from '../../scripts/generate_qa_checklist';

describe('QA Interactive Checklist Master Standard & Anti-Regression Shield', () => {
  const sampleSuite = {
    commitSha: 'fe57798',
    environmentUrl: 'https://dev.memoryweaver.studio',
    suiteTitle: 'MW-87 Verification Suite',
    passcode: 'MW-STAGE-2026',
    tests: [
      {
        category: 'Perimeter Access',
        title: 'MW-87: Staging Lock Auto-Redirect',
        instructions: 'Verify 307 redirect to /staging-lock',
        url: 'https://dev.memoryweaver.studio/pricing',
        governingRules: ['Rule 5: Exclusive Staging URL Gate', 'MW-87: Edge Perimeter Defense'],
        testData: [
          { label: 'Target Route', value: 'https://dev.memoryweaver.studio/pricing' },
          { label: 'Passcode', value: 'MW-STAGE-2026' }
        ]
      },
      {
        category: 'Checkout Flow',
        title: 'MW-85: 31-Day Director Pass',
        instructions: 'Verify Stripe checkout completion and direct return',
        url: 'https://dev.memoryweaver.studio/settings',
        governingRules: ['Stripe Cross-Origin SameSite Lax Session Retention', 'Rule 12: Zero-Latency UI'],
        testData: [
          { label: 'Stripe Test Card', value: '4242 4242 4242 4242' },
          { label: 'Expiry & CVC', value: '12/28 • CVC: 123' },
          { label: 'UK Postal Code', value: 'SW1A 1AA' }
        ]
      }
    ]
  };

  const html = generateQAChecklistHtml(sampleSuite);

  it('contains Top HUD Header with SVG progress ring, fraction counter, and latency meter', () => {
    expect(html).toContain('id="progress-circle"');
    expect(html).toContain('id="progress-text"');
    expect(html).toContain('id="tally-display"');
    expect(html).toContain('id="btn-ping"');
    expect(html).toContain('pingEdge()');
  });

  it('contains dedicated clickable route buttons for every test item', () => {
    expect(html).toContain('href="https://dev.memoryweaver.studio/pricing"');
    expect(html).toContain('href="https://dev.memoryweaver.studio/settings"');
    expect(html).toContain('🔗 Open Test Route');
  });

  it('contains Governing Architectural Rules & Standards badges', () => {
    expect(html).toContain('📜 Governing Rules:');
    expect(html).toContain('Rule 5: Exclusive Staging URL Gate');
    expect(html).toContain('Stripe Cross-Origin SameSite Lax Session Retention');
  });

  it('contains Test Data & Input Parameters section with 1-click copy buttons', () => {
    expect(html).toContain('📊 Test Data & Input Parameters');
    expect(html).toContain('4242 4242 4242 4242');
    expect(html).toContain('SW1A 1AA');
    expect(html).toContain('copyToClipboard');
    expect(html).toContain('id="copy-btn-2-0"');
  });

  it('contains standard PASS / FAIL / BACKLOG status buttons for each test card', () => {
    expect(html).toContain('id="btn-1-PASS"');
    expect(html).toContain('id="btn-1-FAIL"');
    expect(html).toContain('id="btn-1-BACKLOG"');
    expect(html).toContain('id="btn-2-PASS"');
    expect(html).toContain('id="btn-2-FAIL"');
    expect(html).toContain('id="btn-2-BACKLOG"');
  });

  it('contains per-test multiline Feedback & Observations textareas', () => {
    expect(html).toContain('id="notes-1"');
    expect(html).toContain('id="notes-2"');
    expect(html).toContain('saveNotes(1)');
  });

  it('contains per-test Telemetry Vector Ingestion Box with live chip parser', () => {
    expect(html).toContain('id="telemetry-1"');
    expect(html).toContain('id="chips-1"');
    expect(html).toContain('parseTelemetry(1)');
    expect(html).toContain('renderChips');
  });

  it('contains per-test Screenshot Attachment Engine with dropzones and clipboard paste', () => {
    expect(html).toContain('id="dropzone-1"');
    expect(html).toContain('id="file-input-1"');
    expect(html).toContain('id="thumbnails-1"');
    expect(html).toContain('handleCardPaste(event, 1)');
    expect(html).toContain('handleDrop(event, 1)');
    expect(html).toContain('processImageFile');
    expect(html).toContain('deleteScreenshot');
  });

  it('contains Full-Screen Interactive Lightbox Modal', () => {
    expect(html).toContain('id="lightbox-modal"');
    expect(html).toContain('id="lightbox-img"');
    expect(html).toContain('openLightbox');
    expect(html).toContain('closeLightbox');
  });

  it('contains 1-Click Markdown Report Generator and State Import/Export', () => {
    expect(html).toContain('copyMarkdownReport()');
    expect(html).toContain('exportJSON()');
    expect(html).toContain('importJSON(event)');
    expect(html).toContain('resetAll()');
    expect(html).toContain('mw_qa_state_v1_commit_fe57798');
  });
});
