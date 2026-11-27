import { NextResponse } from 'next/server';
import { QA_HTML_STRING } from '@/lib/qa/qaHtmlContent';

export const dynamic = 'force-dynamic';

/**
 * MW-432 (1B): Injects a live Founder Sign-Off Queue bridge banner at the top of /admin/qa
 * without modifying qa_checklist_interactive.html on disk (preserving the 60/60 PASS 3-way SSOT).
 */
export function injectFounderSignOffBanner(rawHtml: string): string {
  const bannerSnippet = `
  <!-- MW-432 (1B): Live Founder Sign-Off Queue Counter & Bridge Banner -->
  <div id="mw-founder-signoff-bridge-banner" class="max-w-6xl mx-auto mb-4 rounded-2xl border border-sky-500/40 bg-slate-900/90 px-5 py-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3 flex-wrap">
      <span id="mw-signoff-bridge-pill" class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-400/40">
        🐞 Founder Sign-Off Queue
      </span>
      <span id="mw-signoff-bridge-summary" class="text-xs sm:text-sm text-slate-200 font-medium">
        Checking live walkthrough &amp; bug sign-off cards...
      </span>
    </div>
    <a
      id="mw-signoff-bridge-link"
      href="/admin?suite=bugs"
      class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-mono font-bold transition shadow-md"
    >
      <span>Open Sign-Off Cards (/admin?suite=bugs) →</span>
    </a>
  </div>
  <script>
    (function () {
      fetch('/api/admin/bugs', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !Array.isArray(data.reports)) return;
          var fixed = data.reports.filter(function (x) { return x.status === 'FIXED_ON_DEV'; }).length;
          var open = data.reports.filter(function (x) { return x.status === 'OPEN'; }).length;
          var verified = data.reports.filter(function (x) { return x.status === 'VERIFIED'; }).length;
          var summaryEl = document.getElementById('mw-signoff-bridge-summary');
          var pillEl = document.getElementById('mw-signoff-bridge-pill');
          var bannerEl = document.getElementById('mw-founder-signoff-bridge-banner');
          if (!summaryEl || !pillEl || !bannerEl) return;
          if (fixed + open > 0) {
            pillEl.textContent = '🚀 ' + (fixed + open) + ' Awaiting Sign-Off';
            summaryEl.textContent = fixed + ' Ready for Sign-Off · ' + open + ' Needs Attention · ' + verified + ' Certified Pass';
          } else {
            bannerEl.className = 'max-w-6xl mx-auto mb-4 rounded-2xl border border-emerald-500/35 bg-emerald-950/25 px-5 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3';
            pillEl.className = 'px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40';
            pillEl.textContent = '✅ Sign-Off Queue Clear';
            summaryEl.textContent = '0 Pending Sign-Offs · ' + verified + ' Walkthrough & Bug Cards Certified Pass';
          }
        })
        .catch(function () {});
    })();
  </script>`;

  const bodyMatch = rawHtml.match(/<body[^>]*>/i);
  if (!bodyMatch) return rawHtml;
  const insertPos = (bodyMatch.index ?? 0) + bodyMatch[0].length;
  return `${rawHtml.slice(0, insertPos)}\n${bannerSnippet}${rawHtml.slice(insertPos)}`;
}

export async function GET() {
  return new NextResponse(injectFounderSignOffBanner(QA_HTML_STRING), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
