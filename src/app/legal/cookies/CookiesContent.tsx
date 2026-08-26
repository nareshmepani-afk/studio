'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const CONSENT_COOKIE_NAME = 'mw_consent';
const CONSENT_MAX_AGE = 33696000; // 13 months in seconds

export function CookiesContent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read current consent from cookie
    const getConsentCookie = () => {
      if (typeof document === 'undefined') return null;
      const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE_NAME}=([^;]*)`));
      if (!match) return null;
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1]));
        if (typeof parsed === 'object' && parsed !== null && 'analytics' in parsed) {
          return Boolean(parsed.analytics);
        }
        return Boolean(parsed);
      } catch {
        return match[1] === 'true';
      }
    };
    setConsent(getConsentCookie());
  }, []);

  const handleConsentChange = (accepted: boolean) => {
    const value = JSON.stringify({ analytics: accepted, timestamp: Date.now() });
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
    setConsent(accepted);

    // Update gtag consent if gtag is available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: accepted ? 'granted' : 'denied',
      });
    }

    toast.success(
      accepted ? 'Analytics cookies accepted' : 'Analytics cookies rejected',
      {
        description: accepted
          ? 'Anonymised usage analytics enabled.'
          : 'Optional analytics cookies have been blocked.',
      }
    );
  };

  return (
    <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-white prose-p:leading-relaxed prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white/95 prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline">
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">Cookie &amp; Local Storage Policy</h1>

      <p className="lead text-base sm:text-lg text-white/80 leading-relaxed mb-8">
        Memory Weaver Studio (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies, local storage tokens, and browser 
        caching mechanisms to authenticate directors, maintain screening room playback sessions, 
        prevent data loss during memoir recording, and measure platform performance.
      </p>

      <hr className="my-8 border-white/10" />

      <h2>1. Understanding Cookies &amp; Local Storage</h2>
      <p>
        Cookies are small data files placed on your computer, smartphone, or Smart TV browser. 
        Under the UK Privacy and Electronic Communications Regulations (PECR), we distinguish between 
        <strong>Strictly Necessary</strong> technologies (essential for website operation) and 
        <strong>Optional Analytics</strong> technologies (used strictly with your consent).
      </p>

      <h2>2. Cookie Inventory</h2>
      <div className="overflow-x-auto my-6 not-prose">
        <table className="min-w-full text-left text-sm text-zinc-300 border border-zinc-800 rounded-xl overflow-hidden">
          <thead className="bg-zinc-900 text-zinc-100 font-semibold border-b border-zinc-800">
            <tr>
              <th className="p-3.5">Identifier</th>
              <th className="p-3.5">Classification</th>
              <th className="p-3.5">Lifespan</th>
              <th className="p-3.5">Operational Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-neutral-950/60 font-mono text-xs">
            <tr className="hover:bg-white/[0.02]">
              <td className="p-3.5 text-amber-400">__session</td>
              <td className="p-3.5 font-sans text-zinc-300">Strictly Necessary</td>
              <td className="p-3.5 text-zinc-400">5 days</td>
              <td className="p-3.5 font-sans text-zinc-300">Firebase session token maintaining your secure Studio and Director authentication.</td>
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-3.5 text-amber-400">guest_pass</td>
              <td className="p-3.5 font-sans text-zinc-300">Strictly Necessary</td>
              <td className="p-3.5 text-zinc-400">180 days</td>
              <td className="p-3.5 font-sans text-zinc-300">Authorisation token permitting unauthenticated guest screening of published family memoirs via QR codes.</td>
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-3.5 text-amber-400">mw_consent</td>
              <td className="p-3.5 font-sans text-zinc-300">Strictly Necessary</td>
              <td className="p-3.5 text-zinc-400">13 months</td>
              <td className="p-3.5 font-sans text-zinc-300">Persists your binary cookie preference (analytics granted/denied) across browsing sessions.</td>
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-3.5 text-zinc-400">_ga / _ga_*</td>
              <td className="p-3.5 font-sans text-zinc-300">Optional Analytics</td>
              <td className="p-3.5 text-zinc-400">2 years</td>
              <td className="p-3.5 font-sans text-zinc-300">Google Analytics 4 visitor telemetry (blocked by default until explicit consent is given).</td>
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-3.5 text-zinc-400">_gid</td>
              <td className="p-3.5 font-sans text-zinc-300">Optional Analytics</td>
              <td className="p-3.5 text-zinc-400">24 hours</td>
              <td className="p-3.5 font-sans text-zinc-300">Google Analytics 4 session grouping token (blocked by default until consent is given).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>3. Browser Local Storage &amp; IndexedDB</h2>
      <p>
        To ensure seamless spoken memoir recording and instant video playback without network latency, 
        we utilise browser-side storage engines (<code>localStorage</code> and <code>IndexedDB</code> via localforage):
      </p>
      <ul>
        <li>
          <strong>Offline Recording &amp; Draft Protection:</strong> Your spoken transcripts, story notes, and 
          editorial revisions are cached locally in your browser to prevent data loss in the event of an 
          intermittent internet drop during recording sessions.
        </li>
        <li>
          <strong>Media Stream Caching:</strong> Master 4K presentation fragments and audio stems are 
          temporarily cached on your local device to enable stutter-free screening room playback and TV casting.
        </li>
        <li>
          <strong>Interface State:</strong> Retains active prompt deck view selections, teleprompter text 
          scaling preferences, and dark-mode parameters.
        </li>
      </ul>

      <h2>4. Managing Your Consent Preferences</h2>
      <p>
        Strictly necessary cookies cannot be disabled, as the platform cannot function securely without them. 
        You may enable or withdraw consent for optional analytics cookies at any time below:
      </p>

      {/* Interactive Analytics Preference Card */}
      <div className="my-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 not-prose shadow-xl">
        <h3 className="text-white text-base font-semibold mt-0 mb-2">Analytics &amp; Telemetry Preferences</h3>
        <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
          When enabled, anonymised telemetry helps us measure video buffering rates, identify playback errors, 
          and improve the 5-Act Studio experience.
        </p>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            type="button" 
            id="btn-accept-analytics" 
            onClick={() => handleConsentChange(true)}
            className={`px-4 py-2.5 font-semibold text-xs rounded-xl transition-all cursor-pointer ${
              consent === true 
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                : 'bg-white/10 hover:bg-white/20 text-white/90'
            }`}
          >
            Accept Analytics
          </button>
          <button 
            type="button" 
            id="btn-reject-analytics" 
            onClick={() => handleConsentChange(false)}
            className={`px-4 py-2.5 font-semibold text-xs rounded-xl transition-all cursor-pointer border ${
              consent === false 
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300' 
                : 'border-zinc-700 hover:border-zinc-500 text-zinc-300'
            }`}
          >
            Reject Analytics
          </button>
          
          <div className="text-xs font-mono text-zinc-400 ml-auto flex items-center gap-2">
            <span>Status:</span>
            {!mounted ? (
              <span id="consent-status-label" className="text-zinc-500">Loading...</span>
            ) : consent === true ? (
              <span id="consent-status-label" className="text-emerald-400 font-bold inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Analytics Granted
              </span>
            ) : consent === false ? (
              <span id="consent-status-label" className="text-amber-400 font-bold inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Analytics Blocked
              </span>
            ) : (
              <span id="consent-status-label" className="text-zinc-400 font-bold inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                Default (Blocked)
              </span>
            )}
          </div>
        </div>
      </div>

      <h2>5. How to Control Cookies in Your Browser</h2>
      <p>
        In addition to our preference manager, you can restrict or block cookies through your browser settings:
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">
            Google Chrome Cookie Management
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">
            Apple Safari Cookie Management
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">
            Mozilla Firefox Cookie Management
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">
            Microsoft Edge Cookie Management
          </a>
        </li>
      </ul>

      <h2>6. Enquiries</h2>
      <p>
        If you have any questions regarding our use of cookies or local storage technologies, please contact:
      </p>
      <p className="font-mono text-amber-400 bg-neutral-900/60 p-4 rounded-xl border border-white/10 not-prose">
        Email: support@memoryweaver.studio<br />
        Subject Line: Cookie &amp; Technical Telemetry Enquiry
      </p>
    </article>
  );
}
