import type { Memory } from '@/types';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';

/**
 * Generates the styled HTML document for the 2-page heirloom autobiography booklet.
 */
export function generateAutobiographyHtml(memory: Memory): string {
  const director = memory.credits?.director || memory.credits?.starring || 'A Storyteller';
  const title = memory.title || 'Biographical Memory Odyssey';
  const narrativeText = memory.prose || memory.originalHook || memory.description || '';

  const posterUrl = memory.posterImageUrl || memory.imageUrl || (memory as any).posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000';

  const fusionManifest = (memory as any).fusionManifest || {
    audioMood: (memory as any).cinematicScore || (memory as any).audioMood || 'Nostalgic Acoustic Guitar & Soft String Ensemble // 72 BPM',
    sensoryPalette: (memory as any).sensoryPalette || ((memory as any).sensoryValues ? Object.entries((memory as any).sensoryValues).map(([k, v]) => `${k}: ${v}`).join(', ') : 'Smell of fresh rain, sound of steam train whistle'),
    emotionalTone: (memory as any).emotionalTone || (memory.emotionTags ? memory.emotionTags.join(', ') : 'Reverent, Courageous, Ancestral Gratitude'),
    cohesiveScript: (memory as any).cohesiveScript || narrativeText,
  };

  const formattedDate = (() => {
    if (memory.date) {
      const rawDateStr = String(memory.date).trim();
      if (/^\d{4}$/.test(rawDateStr)) return rawDateStr;
      const d = new Date(rawDateStr);
      if (!isNaN(d.getTime())) return format(d, 'd MMMM yyyy', { locale: enGB });
    }
    return (memory as any).year ? String((memory as any).year) : new Date().getFullYear().toString();
  })();

  const locationStr = [memory.location, memory.country].filter(Boolean).join(', ') || 'Global Archive';
  const qrTargetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/cinema/tv?id=${memory.id || 'preview'}`
    : `https://dev.memoryweaver.studio/cinema/tv?id=${memory.id || 'preview'}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrTargetUrl)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - Memory Weaver Booklet</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: #020617;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      /* CRITICAL: Do NOT set height or overflow:hidden here.
         Setting height:297mm + overflow:hidden on body clamps the browser's
         print output to exactly 1 page, swallowing page 2. */
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 16mm 20mm;
      position: relative;
      background: radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.12), transparent 70%), #020617;
      border: 1px solid rgba(245, 158, 11, 0.2);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      box-sizing: border-box;
    }

    .page:first-of-type {
      page-break-after: always;
      break-after: page;
    }

    .page:last-of-type {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    @media print {
      html, body {
        /* Do NOT constrain body to 297mm height and do NOT set overflow:hidden.
           Doing so causes the browser print engine to truncate output to 1 page. */
        width: 210mm;
        margin: 0;
        padding: 0;
        background-color: #020617;
      }
      .page {
        border: none;
        box-shadow: none;
        break-inside: avoid;
      }
      .page:last-of-type {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .poster-container {
      width: 100%;
      height: 170mm;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid rgba(245, 158, 11, 0.4);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      position: relative;
    }

    .poster-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: brightness(0.9) contrast(1.1);
    }

    .title-block {
      margin-top: 15px;
      text-align: left;
    }

    .story-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      font-style: italic;
      color: #fbbf24;
      margin: 0 0 6px 0;
      line-height: 1.2;
    }

    .director-line {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #94a3b8;
    }

    .score-pill {
      background: rgba(2, 6, 23, 0.9);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 10px 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
    }

    .score-text {
      font-size: 11px;
      font-family: monospace;
      color: #6ee7b7;
      font-weight: 700;
    }

    .footer-flex {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .qr-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 8px 12px;
      border-radius: 12px;
    }

    .qr-img {
      width: 50px;
      height: 50px;
      border-radius: 6px;
    }

    .qr-label {
      font-size: 9px;
      font-family: monospace;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      line-height: 1.4;
    }

    /* PAGE 2 STYLING */
    .chapter-header {
      border-bottom: 2px solid rgba(245, 158, 11, 0.3);
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    .chapter-title {
      font-family: 'Cinzel', serif;
      font-size: 22px;
      font-weight: 900;
      color: #fbbf24;
      letter-spacing: 0.1em;
      margin: 0 0 4px 0;
    }

    .chapter-meta {
      font-size: 11px;
      font-family: monospace;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }

    .sensory-card {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .sensory-item {
      margin-bottom: 8px;
    }
    .sensory-item:last-child { margin-bottom: 0; }

    .sensory-label {
      font-size: 10px;
      font-family: monospace;
      font-weight: 800;
      color: #f59e0b;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      display: block;
      margin-bottom: 2px;
    }

    .sensory-val {
      font-size: 12px;
      font-family: monospace;
      color: #e2e8f0;
      font-style: italic;
    }

    .monologue-body {
      font-family: 'Playfair Display', serif;
      font-size: 15px;
      line-height: 1.8;
      color: #f1f5f9;
      text-align: justify;
      white-space: pre-wrap;
    }

    .seal-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10px;
      font-family: monospace;
      color: #34d399;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <!-- PAGE 1: COVER MOVIE POSTER -->
  <div class="page">
    <div>
      <div class="header-badge">🌟 MEMORY WEAVER CINEMATIC ARCHIVE</div>
      <div class="poster-container">
        <img class="poster-img" src="${posterUrl}" alt="${title}" />
      </div>
      <div class="title-block">
        <h1 class="story-title">${title}</h1>
        <div class="director-line">STARRING &amp; DIRECTED BY ${director} &bull; ${formattedDate}</div>
      </div>
      <div class="score-pill">
        <span class="score-text">🎼 CINEMATIC SCORE &amp; AUDIO MOOD: ${fusionManifest.audioMood}</span>
      </div>
    </div>

    <div class="footer-flex">
      <div class="director-line">HOUSE OF MEMORIES ARCHIVAL COLLECTION</div>
      <div class="qr-box">
        <img class="qr-img" src="${qrImageUrl}" alt="Scan QR Code" />
        <div class="qr-label">SCAN TO STREAM ON<br>LIVING ROOM TV</div>
      </div>
    </div>
  </div>

  <!-- PAGE 2: AUTOBIOGRAPHY CHAPTER & MONOLOGUE SCRIPT -->
  <div class="page">
    <div>
      <div class="chapter-header">
        <h2 class="chapter-title">CHAPTER I: ${title.toUpperCase()}</h2>
        <div class="chapter-meta">${formattedDate} &bull; ${locationStr}</div>
      </div>

      <div class="sensory-card">
        <div class="sensory-item">
          <span class="sensory-label">👁️ SENSORY PALETTE</span>
          <span class="sensory-val">"${fusionManifest.sensoryPalette}"</span>
        </div>
        <div class="sensory-item">
          <span class="sensory-label">🎭 EMOTIONAL TONE</span>
          <span class="sensory-val">"${fusionManifest.emotionalTone}"</span>
        </div>
      </div>

      <div class="monologue-body">${fusionManifest.cohesiveScript || narrativeText}</div>
    </div>

    <div class="footer-flex">
      <div class="seal-badge">🟢 VERIFIED ARCHIVAL HEIRLOOM RECORD &bull; MEMORY WEAVER STUDIO</div>
      <div class="qr-label">PAGE 2 OF 2</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 600);
    };
  </script>
</body>
</html>`;
}

/**
 * Triggers the browser print dialog for the heirloom autobiography booklet PDF.
 *
 * ARCHITECTURE NOTE (MW-161 v2):
 *
 * Layer 1 — Iframe isolation: We inject a hidden <iframe> rather than window.open()
 * so the parent window never loses focus (avoids a focus event triggering Firebase auth).
 *
 * Layer 2 — Print guard flag: window.__mwPrintGuard is set TRUE before iframeWindow.print()
 * fires and is cleared by the parent window's 'afterprint' event (or a 15s safety timeout).
 * ProductionDeckContainer reads this flag in its onAuthStateChanged effect and skips
 * clearing rehydration state if a print is actively in progress.
 *
 * Layer 3 — UID deduplication in ProductionDeckContainer: The auth effect now tracks
 * the previous UID string via a useRef and skips no-op re-fires where the UID is
 * identical (same-user Firebase token refresh during Chrome tab suspension/resume).
 */
export function downloadFusedAutobiography(memory: Memory) {
  if (typeof window === 'undefined') return;

  const htmlContent = generateAutobiographyHtml(memory);

  // Clean up any previously injected print frame (defensive guard)
  const existingFrame = document.getElementById('__mw_print_frame__');
  if (existingFrame) existingFrame.remove();

  // Create a fully hidden iframe to host the print document in-process.
  const iframe = document.createElement('iframe');
  iframe.id = '__mw_print_frame__';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = [
    'position:fixed',
    'top:-9999px',
    'left:-9999px',
    'width:210mm',
    'height:594mm', // Two A4 pages tall so the print engine can paginate correctly
    'border:none',
    'opacity:0',
    'pointer-events:none',
    'z-index:-1',
  ].join(';');

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (!iframeDoc || !iframe.contentWindow) {
    // Fallback: popup window if iframe API is unavailable (e.g. sandboxed env)
    const fallback = window.open('', '_blank', 'width=900,height=1100');
    if (fallback) {
      fallback.document.write(htmlContent);
      fallback.document.close();
    }
    return;
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  const iframeWindow = iframe.contentWindow;

  // ── LAYER 2: Print Guard ──────────────────────────────────────────────────
  // Arm the guard BEFORE triggering print. ProductionDeckContainer reads this
  // flag in its onAuthStateChanged effect and skips clearing rehydration guards
  // while a print is in progress.
  (window as any).__mwPrintGuard = true;

  // Safety disarm: always release the guard after 15s regardless of print outcome
  const guardTimeout = setTimeout(() => {
    (window as any).__mwPrintGuard = false;
  }, 15000);

  // Disarm immediately when the print dialog is dismissed.
  // 'afterprint' fires reliably in Chrome, Firefox, and Edge after the user
  // accepts or cancels the print dialog — including the iframe's print call.
  window.addEventListener('afterprint', function onAfterPrint() {
    (window as any).__mwPrintGuard = false;
    clearTimeout(guardTimeout);
    window.removeEventListener('afterprint', onAfterPrint);
  }, { once: true });
  // ─────────────────────────────────────────────────────────────────────────

  // hasFired prevents double-trigger from both onload and the safety setTimeout
  let hasFired = false;
  const triggerPrint = () => {
    if (hasFired) return;
    hasFired = true;

    try {
      iframeWindow.print();
    } catch {
      // If iframe.print() is blocked by browser policy, fall back to popup
      const fallback = window.open('', '_blank', 'width=900,height=1100');
      if (fallback) {
        fallback.document.write(htmlContent);
        fallback.document.close();
      }
    } finally {
      // Remove the hidden frame after a safe delay (3s after print trigger)
      setTimeout(() => {
        document.getElementById('__mw_print_frame__')?.remove();
      }, 3000);
    }
  };

  if (iframeDoc.readyState === 'complete') {
    setTimeout(triggerPrint, 600);
  } else {
    iframeWindow.onload = () => setTimeout(triggerPrint, 600);
    // Safety net: if onload never fires (cross-origin resource stall), trigger after 2s
    setTimeout(triggerPrint, 2000);
  }
}

/**
 * Downloads the heirloom booklet as a self-contained HTML file.
 *
 * The user can open this file in any browser and use Ctrl+P → "Save as PDF"
 * to produce a high-quality permanent PDF archive without any server dependency.
 * This is the "Download" counterpart to the native print-dialog approach.
 */
export function downloadAutobiographyAsHtml(memory: Memory) {
  if (typeof window === 'undefined') return;

  const htmlContent = generateAutobiographyHtml(memory);
  const safeTitle = (memory.title || 'MemoryWeaverBooklet')
    .replace(/[^a-z0-9_\-\s]/gi, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeTitle}_booklet.html`;
  anchor.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
  document.body.appendChild(anchor);
  anchor.click();

  requestAnimationFrame(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  });
}
