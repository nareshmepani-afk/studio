import fs from 'fs';
import path from 'path';
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

  it('enforces Rule 30.3 Mandatory Route-Grouped Test Card Organisation & Route Filter Bar', () => {
    expect(html).toContain('id="route-filter-bar"');
    expect(html).toContain("filterByRoute('all')");
    expect(html).toContain("filterByRoute('pending')");
    expect(html).toContain('data-route-group="pricing"');
    expect(html).toContain('data-route-group="settings"');
    expect(html).toContain('🚀 Launch Route ↗');

    // Verify scattered tests targeting the same route are clustered together into a single route group section
    const multiRouteSuite = {
      commitSha: '7c614fd0',
      environmentUrl: 'https://dev.memoryweaver.studio',
      suiteTitle: 'Route Clustering Verification',
      passcode: 'MW-STAGE-2026',
      tests: [
        {
          category: 'Act I',
          title: 'Rehearsal Card A',
          instructions: 'Step 1',
          url: 'https://dev.memoryweaver.studio/studio/production/first_flight_rehearsal'
        },
        {
          category: 'Fireside',
          title: 'Fireside Card B',
          instructions: 'Step 2',
          url: 'https://dev.memoryweaver.studio/studio/fireside'
        },
        {
          category: 'Act III',
          title: 'Rehearsal Card C',
          instructions: 'Step 3',
          url: 'https://dev.memoryweaver.studio/studio/production/first_flight_rehearsal'
        }
      ]
    };
    const clusteredHtml = generateQAChecklistHtml(multiRouteSuite);
    expect(clusteredHtml).toContain('data-route-group="first_flight_rehearsal"');
    expect(clusteredHtml).toContain('data-route-group="studio_fireside"');
    // Rehearsal Card A (Test 1) and Rehearsal Card C (Test 2) are clustered before Fireside Card B (Test 3)
    const idxA = clusteredHtml.indexOf('Rehearsal Card A');
    const idxC = clusteredHtml.indexOf('Rehearsal Card C');
    const idxB = clusteredHtml.indexOf('Fireside Card B');
    expect(idxA).toBeGreaterThan(0);
    expect(idxC).toBeGreaterThan(idxA);
    expect(idxB).toBeGreaterThan(idxC);
  });

  it('enforces Rule 30.5 In-Flight Punch-List Resolutions Engine & Controls across all cards', () => {
    expect(html).toContain('id="punchlist-container-1"');
    expect(html).toContain('id="punchlist-badge-1"');
    expect(html).toContain('id="punchlist-new-input-1"');
    expect(html).toContain('addPunchListItem(1)');
    expect(html).toContain('renderPunchList');
    expect(html).toContain('togglePunchListItem');
    expect(html).toContain('removePunchListItem');
    expect(html).toContain('🥊 In-Flight Punch-List Resolutions (Test 1)');
    expect(html).toContain('In-Flight Punch-List Resolutions');

    // Test suite with pre-populated punchList item
    const suiteWithPunchList = {
      commitSha: '277fe477',
      environmentUrl: 'https://dev.memoryweaver.studio',
      suiteTitle: 'Punch-List Suite Test',
      passcode: 'MW-STAGE-2026',
      tests: [
        {
          category: 'Fireside',
          title: 'Deep-Link Resolution',
          instructions: 'Verify ?id=p4_1 navigation',
          url: 'https://dev.memoryweaver.studio/studio/fireside?id=p4_1',
          punchList: [
            {
              id: 'pl-1-1',
              text: 'Punch-List 1.1: Deep-Link ?id=p4_1 Initial Mount Synchronisation',
              url: 'https://dev.memoryweaver.studio/studio/fireside?id=p4_1',
              checked: true
            }
          ]
        }
      ]
    };
    const htmlWithPunchList = generateQAChecklistHtml(suiteWithPunchList);
    expect(htmlWithPunchList).toContain('punchlist-container-1');
    expect(htmlWithPunchList).toContain('Punch-List 1.1: Deep-Link ?id=p4_1 Initial Mount Synchronisation');
    const liveHtmlPath = path.resolve(__dirname, '../../qa_checklist_interactive.html');
    const liveHtml = fs.readFileSync(liveHtmlPath, 'utf8');
    for (let c = 1; c <= 58; c++) {
      expect(liveHtml).toContain(`id="card-${c}"`);
      expect(liveHtml).toContain(`id="notes-${c}"`);
      expect(liveHtml).toContain(`id="console-log-${c}"`);
      expect(liveHtml).toContain(`id="telemetry-${c}"`);
      expect(liveHtml).toContain(`id="dropzone-${c}"`);
      expect(liveHtml).toContain(`handleCardPaste(event, ${c})`);
      expect(liveHtml).toContain(`copySingleTestReport(${c}, this)`);
    }
    expect(liveHtml).toContain('function initSubItemFeedbackDrawers()');
    expect(liveHtml).toContain('function toggleItemFeedbackDrawer(cardNum, itemNum');
    expect(liveHtml).toContain('function copySingleItemReport(cardNum, itemNum, btn)');
    expect(liveHtml).toContain('toggleItemFeedbackDrawer(cardNum, itemNum, true)');
    expect(liveHtml).toContain('function setCardVerdict(cardNum, verdict)');
    expect(liveHtml).toContain('function normalizeVerdictEntry(entry)');
    expect(liveHtml).toContain('function getVerdictCode(cardNum)');
    expect(liveHtml).not.toContain("commit: '1b0029a7'");
    expect(liveHtml).not.toContain('**Target Commit SHA**: 1b0029a7');
    expect(liveHtml).toContain('const DEFAULT_CARD_VERDICTS =');
    expect(liveHtml).toContain('const DEFAULT_ITEM_VERDICTS =');
    // Rule 30.9: exportJSON() must include itemVerdicts, itemNotes, itemConsoleLogs, itemTelemetry
    const exportJsonIdx = liveHtml.indexOf('function exportJSON()');
    const importJsonIdx = liveHtml.indexOf('function importJSON(');
    const exportJsonSlice = liveHtml.slice(exportJsonIdx, importJsonIdx);
    expect(exportJsonSlice).toContain('itemVerdicts');
    expect(exportJsonSlice).toContain('itemNotes');
    expect(exportJsonSlice).toContain('itemConsoleLogs');
    expect(exportJsonSlice).toContain('itemTelemetry');
    // Rule 30.9: updateItemProgress must auto-promote verdicts[cardNum] when passed === total
    const updateProgIdx = liveHtml.indexOf('function updateItemProgress(cardNum)');
    const updateProgSlice = liveHtml.slice(updateProgIdx, updateProgIdx + 1200);
    expect(updateProgSlice).toContain("verdicts[cardNum] = { verdict: 'pass'");
    expect(liveHtml).toContain("'58_1': 'pass'");
  });
});

