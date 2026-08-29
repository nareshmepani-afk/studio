/**
 * Standard QA Interactive Checklist Generator — Memory Weaver
 * 
 * Generates standalone, fully-featured interactive HTML verification artifacts
 * with 100% feature parity guaranteed:
 * - Top HUD with circular SVG progress ring, metrics fraction, ping latency meter
 * - Per-Test Test Data & Credentials box with 1-click copy buttons
 * - Per-Test Governing Architecture & Rules badges
 * - Per-Test Screenshot Dropzones, Clipboard Paste (Ctrl+V), Thumbnail Gallery & Fullscreen Lightbox Modal
 * - Per-Test Telemetry Vector Ingestion Box with 0ms glowing chips parser
 * - 1-Click Markdown Report Generator & LocalStorage Session Portability
 * 
 * Usage:
 *   node scripts/generate_qa_checklist.js [outputPath] [commitSha]
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function generateQAChecklistHtml(config) {
  const {
    commitSha = 'fe57798',
    environmentUrl = 'https://dev.memoryweaver.studio',
    suiteTitle = 'MW-87 & MW-85 Staging Verification Suite',
    passcode = 'MW-STAGE-2026',
    tests = []
  } = config;

  const storageKey = `mw_qa_state_v1_commit_${commitSha}`;
  const totalTests = tests.length;
  const testsJson = JSON.stringify(tests);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QA Verification Suite — Memory Weaver (${commitSha})</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #030712;
      color: #f3f4f6;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .obsidian-card {
      background: rgba(17, 24, 39, 0.75);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(75, 85, 99, 0.4);
    }
    .obsidian-card:hover {
      border-color: rgba(245, 158, 11, 0.4);
    }
    .btn-pass.active {
      background-color: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      color: #34d399;
      box-shadow: 0 0 14px rgba(16, 185, 129, 0.35);
    }
    .btn-fail.active {
      background-color: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
      color: #f87171;
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.35);
    }
    .btn-backlog.active {
      background-color: rgba(245, 158, 11, 0.2);
      border-color: #f59e0b;
      color: #fbbf24;
      box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(17, 24, 39, 0.5);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(75, 85, 99, 0.6);
      border-radius: 3px;
    }
    .dropzone-active {
      border-color: #f59e0b !important;
      background-color: rgba(245, 158, 11, 0.08) !important;
    }
  </style>
</head>
<body class="min-h-screen p-4 sm:p-6 lg:p-8 custom-scrollbar relative">

  <!-- TOP HUD HEADER -->
  <header class="max-w-6xl mx-auto mb-8 obsidian-card rounded-2xl p-6 shadow-2xl border border-gray-800 relative overflow-hidden">
    <div class="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
    
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
      <div class="space-y-1">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            ROLLOUT VERIFIED LIVE
          </span>
          <span class="text-xs font-mono text-gray-400">Target Commit: <strong class="text-gray-200">${commitSha}</strong></span>
          <span class="text-xs font-mono text-gray-500">•</span>
          <span class="text-xs font-mono text-gray-400">Environment: <strong class="text-amber-300">${environmentUrl.replace('https://', '')}</strong></span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <span>${suiteTitle}</span>
        </h1>
        <p class="text-sm text-gray-400 max-w-2xl">
          Standardized QA verification suite with inline test data credentials, governing architectural rules, screenshot dropzones, clipboard paste, and telemetry ingestion.
        </p>
      </div>

      <!-- PROGRESS & METRICS HUD -->
      <div class="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end bg-gray-900/90 p-4 rounded-xl border border-gray-800">
        <div class="relative flex items-center justify-center w-16 h-16">
          <svg class="w-16 h-16 transform -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="5" class="text-gray-800" fill="transparent" />
            <circle id="progress-circle" cx="32" cy="32" r="28" stroke="currentColor" stroke-width="5" class="text-amber-500 transition-all duration-500" stroke-dasharray="175.929" stroke-dashoffset="175.929" stroke-linecap="round" fill="transparent" />
          </svg>
          <span id="progress-text" class="absolute text-xs font-mono font-bold text-white">0%</span>
        </div>

        <div class="space-y-1">
          <div class="text-xs font-mono text-gray-400 uppercase tracking-wider">Completion Status</div>
          <div id="tally-display" class="text-sm font-bold text-gray-200">0 Pass • 0 Fail • 0 Backlog • ${totalTests} Pend</div>
          <div class="flex items-center gap-2 pt-1 flex-wrap">
            <button id="btn-ping" onclick="pingEdge()" class="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow">
              <span id="ping-icon">⚡</span>
              <span>Ping Edge</span>
              <span id="ping-latency" class="text-xs font-bold text-emerald-400"></span>
            </button>
            <button onclick="scrollToNextPending()" class="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-300 border border-gray-700 flex items-center gap-1 transition whitespace-nowrap cursor-pointer">
              <span>🎯 Next Test</span>
            </button>
            <button onclick="resetAll()" class="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 border border-gray-700 transition whitespace-nowrap cursor-pointer">
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- QUICK ACTIONS BAR -->
    <div class="mt-6 pt-4 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2 flex-wrap">
        <button onclick="copyMarkdownReport()" class="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs tracking-wide transition shadow-lg shadow-amber-500/10 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
          <span>📋 Copy Markdown Report</span>
        </button>
        <button onclick="exportJSON()" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono transition border border-gray-700">
          💾 Export JSON
        </button>
        <button onclick="document.getElementById('import-file').click()" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono transition border border-gray-700">
          📂 Import JSON
        </button>
        <input type="file" id="import-file" class="hidden" accept=".json" onchange="importJSON(event)" />
      </div>
      <div class="text-xs text-gray-500 font-mono flex items-center gap-2">
        <span>Staging Passcode:</span>
        <code class="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-amber-400">${passcode}</code>
        <span class="text-gray-600">(Case-Insensitive)</span>
      </div>
    </div>
  </header>

  <!-- TEST CARDS CONTAINER -->
  <main class="max-w-6xl mx-auto space-y-6" id="test-cards-container">
    ${tests.map((t, idx) => {
      const num = idx + 1;
      return `
    <!-- TEST CARD ${num} -->
    <div class="obsidian-card rounded-2xl p-6 border border-gray-800 transition" id="card-${num}" tabindex="0" onpaste="handleCardPaste(event, ${num})">
      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-800 text-amber-400 border border-gray-700">TEST ${num}</span>
            <span class="text-xs font-mono text-gray-400">${t.category || 'Verification'}</span>
          </div>
          <h2 class="text-lg font-bold text-white">${t.title}</h2>
          <p class="text-xs text-gray-400 leading-relaxed">${t.instructions}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a href="${t.url}" target="_blank" class="px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-xs font-medium text-amber-300 border border-gray-700 flex items-center gap-1.5 transition">
            <span>🔗 Open Test Route</span>
            <span class="text-[10px]">↗</span>
          </a>
        </div>
      </div>

      <!-- GOVERNING RULES & ARCHITECTURAL STANDARDS -->
      ${t.governingRules && t.governingRules.length > 0 ? `
      <div class="mb-4 pt-2 pb-3 border-b border-gray-800/40 flex items-center gap-2 flex-wrap">
        <span class="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <span>📜 Governing Rules:</span>
        </span>
        ${t.governingRules.map(r => `
          <span class="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-[11px] font-mono text-purple-300">
            ${r}
          </span>
        `).join('')}
      </div>` : ''}

      <!-- TEST DATA & INPUT PARAMETERS SECTION -->
      ${t.testData && t.testData.length > 0 ? `
      <div class="mb-4 p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80">
        <div class="text-[11px] uppercase tracking-wider font-mono text-amber-400 mb-2.5 flex items-center justify-between">
          <span class="flex items-center gap-1.5">
            <span>📊 Test Data & Input Parameters</span>
          </span>
          <span class="text-[10px] text-gray-500 font-normal">Click "📋 Copy" to paste directly into test forms</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          ${t.testData.map((d, dIdx) => `
            <div class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 hover:border-amber-500/40 transition">
              <div class="space-y-0.5 overflow-hidden">
                <div class="text-[10px] font-mono text-gray-400 uppercase">${d.label}</div>
                <div class="text-xs font-mono font-bold text-gray-200 truncate" title="${d.value}">${d.value}</div>
              </div>
              ${d.copyable !== false ? `
              <button onclick="copyToClipboard('${d.value.replace(/'/g, "\\'")}', 'copy-btn-${num}-${dIdx}')" id="copy-btn-${num}-${dIdx}" class="shrink-0 px-2 py-1 rounded bg-gray-800 hover:bg-amber-500 hover:text-gray-950 text-[11px] font-mono text-amber-300 border border-gray-700 transition">
                📋 Copy
              </button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- LIVE API PROBE SECTION -->
      ${t.testProbe ? `
      <div class="mb-4 p-3.5 rounded-xl bg-gray-950/80 border border-amber-500/20">
        <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase font-bold">${t.testProbe.method || 'POST'}</span>
            <span class="text-xs font-mono text-gray-300 truncate max-w-md">${t.testProbe.url || t.url}</span>
          </div>
          <button onclick="sendLiveProbe(${num})" id="probe-btn-${num}" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold font-mono transition flex items-center gap-1 shadow-lg shadow-amber-500/10 cursor-pointer">
            <span>⚡ Send Live Probe</span>
          </button>
        </div>
        ${t.testProbe.body ? `
        <div class="text-[10px] font-mono text-gray-400 mb-1.5">
          <span class="text-gray-500">Payload:</span> <code class="text-amber-300/80">${JSON.stringify(t.testProbe.body)}</code>
        </div>` : ''}
        <div id="probe-result-${num}" class="hidden mt-2 p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-[11px] font-mono overflow-x-auto max-h-48 custom-scrollbar"></div>
      </div>` : ''}

      <!-- STATUS ATTRIBUTION & RATIONALE -->
      ${t.statusAttribution || t.statusRationale ? `
      <div class="mb-4 p-3.5 rounded-xl bg-gray-950/70 border border-gray-800 flex items-start gap-3">
        <div class="mt-0.5 text-base shrink-0">${t.defaultStatus === 'PASS' ? '🛡️' : (t.defaultStatus === 'RETEST' ? '🔄' : (t.defaultStatus === 'FAIL' ? '❌' : '⏳'))}</div>
        <div class="space-y-1 overflow-hidden flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[10px] font-mono uppercase font-bold text-amber-400">Status Attribution:</span>
            <span class="text-xs font-mono font-semibold text-gray-200 px-2 py-0.5 rounded bg-gray-900 border border-gray-800">${t.statusAttribution || 'Unassigned'}</span>
          </div>
          ${t.statusRationale ? `
          <div class="text-xs text-gray-400 font-sans leading-relaxed">
            <span class="text-[10px] font-mono uppercase text-gray-500 mr-1">Status Rationale:</span>${t.statusRationale}
          </div>` : ''}
        </div>
      </div>` : ''}

      <!-- STATUS BUTTONS TRIPLET -->
      <div class="flex items-center gap-2 pt-2 pb-4 border-b border-gray-800/60">
        <button onclick="setStatus(${num}, 'PASS')" id="btn-${num}-PASS" class="btn-pass flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-gray-800 bg-gray-900/60 text-xs font-bold text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 transition">
          ✅ PASS
        </button>
        <button onclick="setStatus(${num}, 'FAIL')" id="btn-${num}-FAIL" class="btn-fail flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-gray-800 bg-gray-900/60 text-xs font-bold text-gray-400 hover:text-rose-400 hover:border-rose-500/50 transition">
          ❌ FAIL
        </button>
        <button onclick="setStatus(${num}, 'BACKLOG')" id="btn-${num}-BACKLOG" class="btn-backlog flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-gray-800 bg-gray-900/60 text-xs font-bold text-gray-400 hover:text-amber-400 hover:border-amber-500/50 transition">
          ⚠️ BACKLOG
        </button>
      </div>

      <!-- OBSERVATIONS, TELEMETRY & SCREENSHOT ATTACHMENTS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <!-- Notes Area -->
        <div>
          <label class="block text-[11px] uppercase tracking-wider font-mono text-gray-400 mb-1">Feedback & Observations</label>
          <textarea id="notes-${num}" oninput="saveNotes(${num})" placeholder="Add test notes, bug details, or observations..." class="w-full h-24 p-3 rounded-xl bg-gray-950/80 border border-gray-800 text-xs text-gray-200 placeholder-gray-600 focus:border-amber-500/50 focus:outline-none custom-scrollbar"></textarea>
        </div>

        <!-- Telemetry Ingestion Box -->
        <div>
          <label class="block text-[11px] uppercase tracking-wider font-mono text-gray-400 mb-1">Per-Test Telemetry Vector Ingestion</label>
          <textarea id="telemetry-${num}" oninput="parseTelemetry(${num})" placeholder="Paste JSON or key=value telemetry vector..." class="w-full h-14 p-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-xs font-mono text-amber-300/90 placeholder-gray-600 focus:border-amber-500/50 focus:outline-none custom-scrollbar"></textarea>
          <div id="chips-${num}" class="flex flex-wrap gap-1.5 mt-2 min-h-[24px]"></div>
        </div>
      </div>

      <!-- SCREENSHOT ATTACHMENT ENGINE -->
      <div class="mt-4 pt-4 border-t border-gray-800/40">
        <div class="flex items-center justify-between mb-2">
          <label class="text-[11px] uppercase tracking-wider font-mono text-gray-400 flex items-center gap-1.5">
            <span>📷 Screenshots & Evidence</span>
            <span id="screenshot-count-${num}" class="text-gray-500 font-normal">(0 attached)</span>
          </label>
          <span class="text-[10px] font-mono text-gray-500">Tip: Drag & drop image or press Ctrl+V anywhere on card</span>
        </div>

        <!-- Dropzone -->
        <div 
          id="dropzone-${num}" 
          ondragover="handleDragOver(event, ${num})" 
          ondragleave="handleDragLeave(event, ${num})" 
          ondrop="handleDrop(event, ${num})" 
          onclick="document.getElementById('file-input-${num}').click()"
          class="border-2 border-dashed border-gray-800 hover:border-amber-500/40 bg-gray-950/40 rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-amber-300"
        >
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span>Click to attach screenshot or drag file here</span>
          <input type="file" id="file-input-${num}" class="hidden" accept="image/*" multiple onchange="handleFileSelect(event, ${num})" />
        </div>

        <!-- Thumbnails Gallery -->
        <div id="thumbnails-${num}" class="flex flex-wrap gap-3 mt-3"></div>
      </div>
    </div>`;
    }).join('\n')}
  </main>

  <!-- FULLSCREEN LIGHTBOX MODAL -->
  <div id="lightbox-modal" class="fixed inset-0 z-50 bg-black/90 backdrop-blur-md hidden flex items-center justify-center p-4 sm:p-8" onclick="closeLightbox(event)">
    <div class="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
      <button onclick="closeLightbox(event)" class="absolute -top-10 right-0 text-gray-400 hover:text-white text-sm font-mono flex items-center gap-1">
        <span>✕ Close (ESC)</span>
      </button>
      <img id="lightbox-img" src="" alt="Enlarged screenshot" class="max-h-[80vh] max-w-full rounded-xl border border-gray-700 shadow-2xl object-contain" />
      <div class="mt-3 flex items-center gap-3">
        <a id="lightbox-download" href="" download="screenshot.png" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-mono text-gray-200 border border-gray-600 transition">
          ⬇️ Download Original
        </a>
      </div>
    </div>
  </div>

  <!-- JAVASCRIPT STATE ENGINE -->
  <script>
    const TOTAL_TESTS = ${totalTests};
    const STORAGE_KEY = '${storageKey}';
    const TEST_METADATA = ${testsJson};

    let state = {
      statuses: {},
      notes: {},
      telemetry: {},
      screenshots: {} // { [testNum]: [{ id, dataUrl, name, timestamp }] }
    };

    function init() {
      try {
        let isExactCommitSession = false;
        let saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          isExactCommitSession = true;
        } else {
          // Cross-Commit Migration: Check for latest session or prior commit keys
          saved = localStorage.getItem('mw_qa_state_v1_latest');
          if (!saved) {
            const commitKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith('mw_qa_state_v1_commit_')) {
                commitKeys.push(k);
              }
            }
            if (commitKeys.length > 0) {
              commitKeys.sort().reverse();
              saved = localStorage.getItem(commitKeys[0]);
            }
          }
        }

        if (saved) {
          const loaded = JSON.parse(saved);
          if (isExactCommitSession) {
            state = loaded;
          } else {
            // Migrating across commits: Match strictly by test title!
            const priorTitles = loaded.testTitles || {};
            TEST_METADATA.forEach((t, idx) => {
              const num = idx + 1;
              let matchedPriorNum = null;
              for (const [pNum, pTitle] of Object.entries(priorTitles)) {
                if (pTitle === t.title) {
                  matchedPriorNum = pNum;
                  break;
                }
              }
              if (matchedPriorNum) {
                if (loaded.statuses?.[matchedPriorNum]) state.statuses[num] = loaded.statuses[matchedPriorNum];
                if (loaded.notes?.[matchedPriorNum]) state.notes[num] = loaded.notes[matchedPriorNum];
                if (loaded.telemetry?.[matchedPriorNum]) state.telemetry[num] = loaded.telemetry[matchedPriorNum];
                if (loaded.screenshots?.[matchedPriorNum]) state.screenshots[num] = loaded.screenshots[matchedPriorNum];
              } else if (t.defaultStatus && t.defaultStatus !== 'UNTESTED') {
                state.statuses[num] = t.defaultStatus;
                if (t.defaultNotes) state.notes[num] = t.defaultNotes;
              }
            });
          }
        }

        // Hydrate defaultStatus for unassigned tests
        TEST_METADATA.forEach((t, idx) => {
          const num = idx + 1;
          if (state.statuses[num] === undefined && t.defaultStatus && t.defaultStatus !== 'UNTESTED') {
            state.statuses[num] = t.defaultStatus;
          }
          if (!state.notes[num] && t.defaultNotes) {
            state.notes[num] = t.defaultNotes;
          }
        });

        if (!state.screenshots) state.screenshots = {};
        if (!state.notes) state.notes = {};
        if (!state.telemetry) state.telemetry = {};
        if (!state.statuses) state.statuses = {};
      } catch (e) {
        console.error('State load error:', e);
      }

      for (let i = 1; i <= TOTAL_TESTS; i++) {
        if (state.statuses[i]) renderStatus(i, state.statuses[i]);
        if (state.notes[i]) {
          const el = document.getElementById(\`notes-\${i}\`);
          if (el) el.value = state.notes[i];
        }
        if (state.telemetry[i]) {
          const el = document.getElementById(\`telemetry-\${i}\`);
          if (el) {
            el.value = state.telemetry[i];
            renderChips(i, state.telemetry[i]);
          }
        }
        if (state.screenshots[i]) {
          renderThumbnails(i);
        }
      }
      updateHUD();

      // Global ESC key listener for lightbox
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const modal = document.getElementById('lightbox-modal');
          if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
          }
        }
      });
    }

    function saveState() {
      try {
        state.testTitles = {};
        TEST_METADATA.forEach((t, idx) => {
          state.testTitles[idx + 1] = t.title;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        localStorage.setItem('mw_qa_state_v1_latest', JSON.stringify(state));
      } catch (e) {
        console.warn('Storage quota exceeded or error:', e);
      }
      updateHUD();
    }

    function setStatus(testNum, status) {
      if (state.statuses[testNum] === status) {
        delete state.statuses[testNum];
      } else {
        state.statuses[testNum] = status;
      }
      renderStatus(testNum, state.statuses[testNum]);
      saveState();
    }

    function renderStatus(testNum, status) {
      ['PASS', 'FAIL', 'BACKLOG'].forEach(s => {
        const btn = document.getElementById(\`btn-\${testNum}-\${s}\`);
        if (btn) {
          if (status === s) btn.classList.add('active');
          else btn.classList.remove('active');
        }
      });
    }

    function saveNotes(testNum) {
      const val = document.getElementById(\`notes-\${testNum}\`)?.value || '';
      state.notes[testNum] = val;
      saveState();
    }

    function parseTelemetry(testNum) {
      const raw = document.getElementById(\`telemetry-\${testNum}\`)?.value || '';
      state.telemetry[testNum] = raw;
      renderChips(testNum, raw);
      saveState();
    }

    function renderChips(testNum, raw) {
      const container = document.getElementById(\`chips-\${testNum}\`);
      if (!container) return;
      container.innerHTML = '';
      if (!raw.trim()) return;

      const pairs = [];
      const traceMatch = raw.match(/traceId[:=]\\s*["']?([^"',\\s]+)/i);
      const userMatch = raw.match(/userId[:=]\\s*["']?([^"',\\s]+)/i);
      const emailMatch = raw.match(/userEmail[:=]\\s*["']?([^"',\\s]+)/i);
      const pathMatch = raw.match(/path[:=]\\s*["']?([^"',\\s]+)/i);
      const verMatch = raw.match(/version[:=]\\s*["']?([^"',\\s]+)/i);

      if (traceMatch) pairs.push({ icon: '🏷️ Trace', val: traceMatch[1] });
      if (userMatch) pairs.push({ icon: '🆔 UID', val: userMatch[1] });
      if (emailMatch) pairs.push({ icon: '👤 Email', val: emailMatch[1] });
      if (pathMatch) pairs.push({ icon: '📍 Path', val: pathMatch[1] });
      if (verMatch) pairs.push({ icon: '🔖 Ver', val: verMatch[1] });

      pairs.forEach(p => {
        const chip = document.createElement('span');
        chip.className = 'px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300';
        chip.textContent = \`\${p.icon}: \${p.val}\`;
        container.appendChild(chip);
      });
    }

    function copyToClipboard(text, btnId) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById(btnId);
        if (btn) {
          const original = btn.innerHTML;
          btn.innerHTML = '✅ Copied!';
          btn.classList.add('bg-emerald-500', 'text-gray-950');
          setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('bg-emerald-500', 'text-gray-950');
          }, 1500);
        }
      }).catch(() => {
        prompt('Copy text:', text);
      });
    }

    async function sendLiveProbe(testNum) {
      const meta = TEST_METADATA[testNum - 1];
      if (!meta || !meta.testProbe) return;
      const btn = document.getElementById(\`probe-btn-\${testNum}\`);
      const resEl = document.getElementById(\`probe-result-\${testNum}\`);
      if (!btn || !resEl) return;
      
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Probing...';
      btn.disabled = true;
      resEl.classList.remove('hidden');
      resEl.innerHTML = '<span class="text-gray-400">Sending request to edge...</span>';

      try {
        const t0 = performance.now();
        const res = await fetch(meta.testProbe.url || meta.url, {
          method: meta.testProbe.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(meta.testProbe.headers || {})
          },
          body: meta.testProbe.body ? JSON.stringify(meta.testProbe.body) : undefined,
        });
        const duration = Math.round(performance.now() - t0);
        const data = await res.json().catch(() => ({ statusText: res.statusText }));
        
        const statusColor = res.ok ? 'text-emerald-400' : 'text-amber-400';
        resEl.innerHTML = \`
          <div class="flex items-center justify-between text-xs mb-1.5 pb-1 border-b border-gray-800">
            <span class="\${statusColor} font-bold">HTTP \${res.status} \${res.statusText} (\${duration}ms)</span>
            <button onclick="copyToClipboard('\${JSON.stringify(data).replace(/'/g, "\\\\'")}', 'copy-res-\${testNum}')" id="copy-res-\${testNum}" class="text-[10px] text-gray-400 hover:text-white cursor-pointer">📋 Copy JSON</button>
          </div>
          <pre class="text-gray-300 leading-tight whitespace-pre-wrap">\${JSON.stringify(data, null, 2)}</pre>
        \`;
      } catch (err) {
        resEl.innerHTML = \`<span class="text-rose-400 font-bold">Error: \${err.message}</span>\`;
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }

    /* SCREENSHOT ATTACHMENT ENGINE */
    function handleFileSelect(e, testNum) {
      const files = Array.from(e.target.files || []);
      files.forEach(file => processImageFile(file, testNum));
      e.target.value = '';
    }

    function handleDragOver(e, testNum) {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById(\`dropzone-\${testNum}\`)?.classList.add('dropzone-active');
    }

    function handleDragLeave(e, testNum) {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById(\`dropzone-\${testNum}\`)?.classList.remove('dropzone-active');
    }

    function handleDrop(e, testNum) {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById(\`dropzone-\${testNum}\`)?.classList.remove('dropzone-active');
      const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
      files.forEach(file => processImageFile(file, testNum));
    }

    function handleCardPaste(e, testNum) {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          processImageFile(file, testNum);
        }
      }
    }

    function processImageFile(file, testNum) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        if (!state.screenshots[testNum]) state.screenshots[testNum] = [];
        
        state.screenshots[testNum].push({
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          dataUrl: dataUrl,
          name: file.name || 'Screenshot',
          timestamp: new Date().toLocaleTimeString()
        });
        
        renderThumbnails(testNum);
        saveState();
      };
      reader.readAsDataURL(file);
    }

    function deleteScreenshot(testNum, imgId, event) {
      if (event) event.stopPropagation();
      if (!state.screenshots[testNum]) return;
      state.screenshots[testNum] = state.screenshots[testNum].filter(img => img.id !== imgId);
      renderThumbnails(testNum);
      saveState();
    }

    function renderThumbnails(testNum) {
      const container = document.getElementById(\`thumbnails-\${testNum}\`);
      const countLabel = document.getElementById(\`screenshot-count-\${testNum}\`);
      if (!container) return;
      
      const list = state.screenshots[testNum] || [];
      if (countLabel) {
        countLabel.textContent = \`(\${list.length} attached)\`;
      }
      
      container.innerHTML = '';
      list.forEach((img, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-700 bg-gray-900 cursor-pointer shadow-md hover:border-amber-400 transition';
        wrap.onclick = () => openLightbox(img.dataUrl);

        const imageEl = document.createElement('img');
        imageEl.src = img.dataUrl;
        imageEl.alt = img.name;
        imageEl.className = 'w-full h-full object-cover';

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '×';
        delBtn.title = 'Delete screenshot';
        delBtn.className = 'absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow';
        delBtn.onclick = (e) => deleteScreenshot(testNum, img.id, e);

        wrap.appendChild(imageEl);
        wrap.appendChild(delBtn);
        container.appendChild(wrap);
      });
    }

    function openLightbox(src) {
      const modal = document.getElementById('lightbox-modal');
      const img = document.getElementById('lightbox-img');
      const dl = document.getElementById('lightbox-download');
      if (modal && img) {
        img.src = src;
        if (dl) dl.href = src;
        modal.classList.remove('hidden');
      }
    }

    function closeLightbox(e) {
      if (e.target.id === 'lightbox-modal' || e.target.closest('button')) {
        document.getElementById('lightbox-modal')?.classList.add('hidden');
      }
    }

    function updateHUD() {
      let pass = 0, fail = 0, backlog = 0;
      for (let i = 1; i <= TOTAL_TESTS; i++) {
        const s = state.statuses[i];
        if (s === 'PASS') pass++;
        else if (s === 'FAIL') fail++;
        else if (s === 'BACKLOG') backlog++;
      }
      const answered = pass + fail + backlog;
      const pend = TOTAL_TESTS - answered;
      const pct = Math.round((answered / TOTAL_TESTS) * 100);

      document.getElementById('progress-text').textContent = \`\${pct}%\`;
      const circle = document.getElementById('progress-circle');
      if (circle) {
        const circumference = 2 * Math.PI * 28; // 175.929
        const offset = circumference - (pct / 100) * circumference;
        circle.style.strokeDashoffset = offset;
      }

      document.getElementById('tally-display').textContent = \`\${pass} Pass • \${fail} Fail • \${backlog} Backlog • \${pend} Pend\`;
    }

    function scrollToNextPending() {
      for (let i = 1; i <= TOTAL_TESTS; i++) {
        if (!state.statuses[i]) {
          const card = document.getElementById(\`card-\${i}\`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.focus();
            return;
          }
        }
      }
      alert('All tests have been evaluated! 🎉');
    }

    async function pingEdge() {
      const btn = document.getElementById('btn-ping');
      const icon = document.getElementById('ping-icon');
      const latencyEl = document.getElementById('ping-latency');
      if (icon) icon.textContent = '⏳';
      if (latencyEl) {
        latencyEl.className = 'text-xs font-mono text-amber-400';
        latencyEl.textContent = '...';
      }
      if (btn) btn.disabled = true;

      const t0 = performance.now();
      try {
        const res = await fetch('${environmentUrl}/api/version', { cache: 'no-store', mode: 'cors' });
        const data = await res.json();
        const latency = Math.round(performance.now() - t0);
        if (icon) icon.textContent = '⚡';
        if (latencyEl) {
          latencyEl.className = 'text-xs font-mono font-bold text-emerald-400';
          latencyEl.textContent = \`(\${latency}ms • \${data.commitSha})\`;
        }
      } catch (e) {
        if (icon) icon.textContent = '⚠️';
        if (latencyEl) {
          latencyEl.className = 'text-xs font-mono text-rose-400';
          latencyEl.textContent = \`(Error: \${e.message})\`;
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    function copyMarkdownReport() {
      let pass = 0, fail = 0, backlog = 0;
      for (let i = 1; i <= TOTAL_TESTS; i++) {
        const s = state.statuses[i];
        if (s === 'PASS') pass++;
        else if (s === 'FAIL') fail++;
        else if (s === 'BACKLOG') backlog++;
      }

      let md = \`## 📋 \${document.querySelector('h1')?.textContent.trim() || 'QA Verification Report'}\\n\\n\`;
      md += \`**Commit SHA**: \\\`${commitSha}\\\`\\n\`;
      md += \`**Target URL**: \\\`${environmentUrl}\\\`\\n\`;
      md += \`**Summary**: \${pass} Passed | \${fail} Failed | \${backlog} Backlog | \${TOTAL_TESTS - pass - fail - backlog} Pending\\n\\n\`;
      md += \`### 🧪 Detailed Test Breakdown\\n\\n\`;

      for (let i = 1; i <= TOTAL_TESTS; i++) {
        const s = state.statuses[i] || 'PENDING';
        const icon = s === 'PASS' ? '✅ PASS' : s === 'FAIL' ? '❌ FAIL' : s === 'BACKLOG' ? '⚠️ BACKLOG' : '⏳ PENDING';
        const meta = TEST_METADATA[i - 1];
        const title = meta?.title || \`Test \${i}\`;
        
        md += \`#### \${icon} — Test \${i}: \${title}\\n\`;
        if (meta?.statusAttribution) {
          md += \`- **Attribution**: \${meta.statusAttribution}\\n\`;
        }
        if (meta?.statusRationale) {
          md += \`- **Status Rationale**: \${meta.statusRationale}\\n\`;
        }
        if (state.notes[i] && state.notes[i].trim()) {
          md += \`- **Feedback / Notes**: \${state.notes[i].trim()}\\n\`;
        }
        if (state.telemetry[i] && state.telemetry[i].trim()) {
          md += \`- **Telemetry Vector**: \\\`\${state.telemetry[i].trim()}\\\`\\n\`;
        }
        const imgCount = (state.screenshots[i] || []).length;
        if (imgCount > 0) {
          md += \`- **Screenshots Attached**: \${imgCount}\\n\`;
        }
        md += \`\\n\`;
      }

      navigator.clipboard.writeText(md).then(() => {
        alert('📋 Markdown verification report copied to clipboard! Paste directly into chat.');
      }).catch(() => {
        prompt('Copy markdown report:', md);
      });
    }

    function exportJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", \`mw_qa_report_${commitSha}_\${Date.now()}.json\`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    function importJSON(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          state = JSON.parse(event.target.result);
          if (!state.screenshots) state.screenshots = {};
          saveState();
          location.reload();
        } catch (err) {
          alert('Invalid JSON session file.');
        }
      };
      reader.readAsText(file);
    }

    function resetAll() {
      if (confirm('Reset all QA verification responses for this test run?')) {
        localStorage.removeItem(STORAGE_KEY);
        state = { statuses: {}, notes: {}, telemetry: {}, screenshots: {} };
        location.reload();
      }
    }

    window.onload = init;
  </script>
</body>
</html>`;
}

// Module export for programmatic use
module.exports = { generateQAChecklistHtml };

// CLI Execution Support
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetOutput = args[0] || path.join(__dirname, '../qa_checklist_interactive.html');
  const targetCommit = args[1] || 'fe57798';

  const defaultTestSuite = {
    commitSha: targetCommit,
    environmentUrl: 'https://dev.memoryweaver.studio',
    suiteTitle: 'MW-87 & MW-85 Staging Verification Suite',
    passcode: 'MW-STAGE-2026',
    tests: [
      {
        category: 'Perimeter Access',
        title: 'MW-87: Staging Lock Auto-Redirect & Clean Placeholder (Zero Leaks)',
        instructions: 'Open Incognito tab to public route. Verify automatic 307 redirect to <code class="text-amber-300">/staging-lock</code> and that input placeholder is cleanly masked as <code class="text-gray-300">"Enter access passcode..."</code> with zero leaked password hints.',
        url: 'https://dev.memoryweaver.studio/pricing',
        governingRules: [
          'Rule 5: Exclusive Staging URL Gate',
          'Rule 7: Universal Non-Degradation',
          'MW-87: Edge Perimeter Defense'
        ],
        testData: [
          { label: 'Public Ingress Route', value: 'https://dev.memoryweaver.studio/pricing' },
          { label: 'Expected Redirect Target', value: 'https://dev.memoryweaver.studio/staging-lock' },
          { label: 'Masked Placeholder', value: 'Enter access passcode...' }
        ],
        defaultStatus: 'PASS',
        statusAttribution: '👤 Verified by User (Commit fe57798)',
        statusRationale: 'Verified clean placeholder with zero leaked hints on staging.',
        defaultNotes: 'Verified clean placeholder with zero leaked hints.'
      },
      {
        category: 'Authentication & UX Polish',
        title: 'MW-87: Passcode Entry (MW-STAGE-2026 / mw-stage-2026) & 900ms Feedback',
        instructions: 'Enter passcode in lowercase (<code class="text-amber-400">mw-stage-2026</code>). Verify case-insensitivity, 900ms visual confirmation toast, and seamless redirect to target destination with 30-day token.',
        url: 'https://dev.memoryweaver.studio/staging-lock',
        governingRules: [
          'MW-87: Case-Insensitive SHA-256 Passcode Normalization',
          'Rule 12: Zero-Latency Optimistic UI & 900ms Handshake'
        ],
        testData: [
          { label: 'Passcode (Uppercase)', value: 'MW-STAGE-2026' },
          { label: 'Passcode (Lowercase)', value: 'mw-stage-2026' },
          { label: 'Session Cookie Token', value: 'staging_access_granted (30 Days)' }
        ],
        defaultStatus: 'PASS',
        statusAttribution: '👤 Verified by User (Commit fe57798)',
        statusRationale: 'Verified case-insensitivity and 900ms visual confirmation toast.',
        defaultNotes: 'Verified case-insensitivity and 900ms visual confirmation.'
      },
      {
        category: 'Backstage Command Centre',
        title: 'MW-87 & Backstage: Admin Knowledge Hub & Dedicated Log Out Button',
        instructions: 'Navigate to Admin Command Centre. Verify <code class="text-purple-300">MW_87_STAGING_ACCESS_SECURITY</code> playbook is searchable in Living Knowledge Hub. Confirm new dedicated <strong>Log Out</strong> button in top header and sidebar logs out cleanly to <code class="text-gray-300">/admin/login</code>.',
        url: 'https://dev.memoryweaver.studio/admin?suite=knowledge',
        governingRules: [
          'Rule 20: Mandatory UK English Orthography (Command Centre)',
          'Backstage Admin Security & Living Knowledge Sync'
        ],
        testData: [
          { label: 'Admin Route', value: 'https://dev.memoryweaver.studio/admin?suite=knowledge' },
          { label: 'Knowledge Query', value: 'MW_87_STAGING_ACCESS_SECURITY' },
          { label: 'Logout Destination', value: 'https://dev.memoryweaver.studio/admin/login' }
        ],
        defaultStatus: 'PASS',
        statusAttribution: '👤 Verified by User (Commit fe57798)',
        statusRationale: 'Verified Living Knowledge Hub documentation and new Log Out button.',
        defaultNotes: 'Verified Living Knowledge Hub documentation and new Log Out button.'
      },
      {
        category: 'Checkout & Session Retention',
        title: 'MW-85: 31-Day Director Pass Checkout (£12.99) — Clean Checkout & Direct Settings Return',
        instructions: 'From <code class="text-amber-300">/pricing</code> or <code class="text-amber-300">/settings</code>, click "Buy 31-Day Pass". Verify Stripe Checkout is clean with <strong>zero promo code clutter</strong> and luxury activation text. Complete checkout with test card and verify browser returns directly to <code class="text-emerald-400">/settings?checkout=success</code> <strong>without dropping session or bouncing to login</strong>.',
        url: 'https://dev.memoryweaver.studio/pricing',
        governingRules: [
          'Stripe Cross-Origin SameSite Lax Session Retention',
          'Rule 12: Zero-Latency Optimistic UI & Async Decoupling',
          'MW-85: Luxury Studio Activation Messaging'
        ],
        testData: [
          { label: 'Stripe Test Card', value: '4242 4242 4242 4242' },
          { label: 'Expiry Date', value: '12/28' },
          { label: 'CVC Security Code', value: '123' },
          { label: 'UK Postal Code', value: 'SW1A 1AA' },
          { label: 'Transaction Amount', value: '£12.99 GBP' },
          { label: 'Expected Return Route', value: 'https://dev.memoryweaver.studio/settings?checkout=success' }
        ],
        defaultStatus: 'PASS',
        statusAttribution: '👤 Verified by User (Commit f1d7f5a)',
        statusRationale: 'Verified clean checkout and direct settings return with plan display.',
        defaultNotes: 'After stripe payment has proceed the screen returns back. Shows active plan.'
      },
      {
        category: 'Vault Upgrades',
        title: 'MW-85: Generational Vault Lifetime Archival (£195.00)',
        instructions: 'Select "Claim Lifetime Vault" (£195). Complete test transaction with test card and verify Firestore account status activates lifetime archival tier with 100 GB cloud vault quota.',
        url: 'https://dev.memoryweaver.studio/pricing',
        governingRules: [
          'MW-85: Lifetime Tier Firestore Plan Mutation',
          'Rule 14: Story Hook Fallback & Text Preservation'
        ],
        testData: [
          { label: 'Stripe Test Card', value: '4242 4242 4242 4242' },
          { label: 'Expiry & CVC', value: '12/28 • CVC: 123' },
          { label: 'SKU Tier', value: 'Generational Vault Lifetime Archival' },
          { label: 'Transaction Amount', value: '£195.00 GBP' },
          { label: 'Vault Quota Unlocked', value: '100 GB Permanent Storage' }
        ],
        defaultStatus: 'PASS',
        statusAttribution: '👤 Verified by User (Commit f1d7f5a)',
        statusRationale: 'Verified Generational Vault Lifetime Archival checkout and active tier display.',
        defaultNotes: 'Verified Generational Vault tier display and checkout.'
      },
      {
        category: 'Pass Stacking Logic',
        title: 'MW-85: Cumulative Pass Stacking ("Extend 31 Days")',
        instructions: 'With an active 31-day pass, verify that <code class="text-amber-300">/settings</code> displays the exact date range: <code class="text-emerald-400">Active Period: [start] – [end] (31-Day Pass Active • Extend anytime to stack +31 days)</code>. Click "Extend 31 Days", complete checkout with test card, and verify the return URL updates the active period by +31 days cumulatively.',
        url: 'https://dev.memoryweaver.studio/settings',
        governingRules: [
          'MW-85: Non-Destructive Cumulative Timestamp Math',
          'Rule 12: Zero-Latency Optimistic UI'
        ],
        testData: [
          { label: 'Action Button', value: 'Extend 31 Days' },
          { label: 'Expected Display', value: 'Active Period: [start] – [end] (31-Day Pass Active • Extend anytime to stack +31 days)' },
          { label: 'Stripe Test Card', value: '4242 4242 4242 4242' }
        ],
        defaultStatus: 'PASS',
        statusAttribution: '👤 Verified by User (Commit ad6bf9d)',
        statusRationale: 'Verified active period date range and cumulative +31 days extension on staging.',
        defaultNotes: 'Verified active period display and pass extension.'
      },
      {
        category: 'Billing Compliance',
        title: 'MW-85: Self-Serve VAT Receipt & Invoice Portal',
        instructions: 'In <code class="text-amber-300">/settings</code>, click the button labelled <strong class="text-white">"Manage Billing & Download VAT Invoices ↗"</strong> in either the Active Membership Tier card or the Generational Vault / Director Pass box. Verify instant seamless redirect to the Stripe Customer Billing Portal.',
        url: 'https://dev.memoryweaver.studio/settings',
        governingRules: [
          'Stripe Billing Customer Portal Handshake',
          'Rule 20: Mandatory UK English Orthography'
        ],
        testData: [
          { label: 'Button Label', value: 'Manage Billing & Download VAT Invoices ↗' },
          { label: 'Portal Gateway', value: 'Stripe Customer Billing Portal' },
          { label: 'Document Format', value: 'Official VAT Invoice PDF' }
        ],
        defaultStatus: 'PASS',
        statusAttribution: '👤 Verified by User (Commit ad6bf9d)',
        statusRationale: 'Verified self-serve VAT Receipt & Invoice Portal button and Stripe handshake.',
        defaultNotes: 'Verified self-serve VAT Receipt & Invoice Portal.'
      },
      {
        category: 'Sandbox Resilience',
        title: '✨ Try Einstein Demo Quick-Start (The Magnetic Compass) & Vault Isolation',
        instructions: 'Click "✨ Try Einstein Demo" in Studio Header or open <code class="text-amber-300">/studio/production/p_einstein</code>. Confirm pre-loaded sample memory loads with authentic spoken monologue: <em>"I was five years old, sick in bed, when my father placed a small brass pocket compass in my trembling hand..."</em> and rich documentary anchors: <code class="text-amber-300">Age: 5</code>, <code class="text-amber-300">Year: 1884</code>, <code class="text-amber-300">Span: 1 Childhood Afternoon</code>, <code class="text-amber-300">Location: Munich Residence</code>, and rich sensory anchors (Cold Brass Pocket Compass, Trembling Needle, Munich Bedroom Linens).',
        url: 'https://dev.memoryweaver.studio/studio/production/p_einstein',
        governingRules: [
          'Rule 11: Spoken Monologue Integrity & Server-Side Sanitizer',
          'Rule 14: Story Hook Fallback & Text Preservation Hierarchy',
          'Rule 20: Mandatory UK English Orthography (realised)'
        ],
        testData: [
          { label: 'Direct Production Route', value: 'https://dev.memoryweaver.studio/studio/production/p_einstein' },
          { label: 'Story Hook', value: 'Before the equations, before the Nobel, before spacetime—there was only a boy, a trembling brass compass, and the invisible wonder of the unseen world.' },
          { label: 'Spoken Monologue', value: 'I was five years old, sick in bed, when my father placed a small brass pocket compass in my trembling hand. No matter which way I turned the casing, that mysterious needle remained stubbornly fixed to the unseen north. In that quiet room, beneath the cold brass and glass, I realised something behind things had to be hidden—something deeply hidden.' },
          { label: 'Biographical Anchors', value: 'I WAS: 5 • YEAR: 1884 • SPAN: 1 Childhood Afternoon' },
          { label: 'Location Anchor', value: 'Munich (Family Residence)' },
          { label: 'Country Anchor', value: 'Germany' },
          { label: 'Sensory Anchors', value: 'Cold Brass Pocket Compass, Trembling Magnetic Needle (Unseen North), Munich Bedroom Rain & Linens' }
        ],
        defaultStatus: 'PASS',
        statusAttribution: '👤 Verified by User (Commit 5fb97d6)',
        statusRationale: 'Verified authentic 1884 Munich magnetic compass monologue, demographic anchors (Location: Munich, Country: Germany), and 0ms sync hydration on staging.',
        defaultNotes: ''
      }
    ]
  };

  const html = generateQAChecklistHtml(defaultTestSuite);
  fs.writeFileSync(targetOutput, html, 'utf8');
  console.log(`[generate_qa_checklist] Successfully generated QA Verification Suite at: ${targetOutput}`);
}
