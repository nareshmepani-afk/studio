'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const CONSENT_COOKIE_NAME = 'mw_consent';
const CONSENT_MAX_AGE = 33696000; // 13 months in seconds

export function CookiesContent() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
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
    <div>
      <h1>Cookie Policy</h1>
      <p className="lead text-lg text-white/60">
        We use cookies and similar technologies to enhance your experience, ensure security, and understand how our platform is used.
      </p>

      <hr className="my-8 border-white/10" />

      <h2>1. Cookie Inventory</h2>
      <p>The following table outlines the cookies we use on Memory Weaver:</p>
      
      <div className="not-prose my-6 overflow-hidden rounded-xl border border-white/10 bg-studio-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/80">
              <tr>
                <th className="px-4 py-3 font-medium">Cookie Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/60">
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-amber-400">__session</td>
                <td className="px-4 py-3">Strictly Necessary</td>
                <td className="px-4 py-3">5 days</td>
                <td className="px-4 py-3">Firebase authentication session</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-amber-400">guest_pass</td>
                <td className="px-4 py-3">Strictly Necessary</td>
                <td className="px-4 py-3">180 days</td>
                <td className="px-4 py-3">Guest screening access JWT</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-amber-400">mw_consent</td>
                <td className="px-4 py-3">Strictly Necessary</td>
                <td className="px-4 py-3">13 months</td>
                <td className="px-4 py-3">Cookie consent preferences</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-amber-400">_ga / _ga_*</td>
                <td className="px-4 py-3">Analytics</td>
                <td className="px-4 py-3">2 years</td>
                <td className="px-4 py-3">Google Analytics visitor identification</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-amber-400">_gid</td>
                <td className="px-4 py-3">Analytics</td>
                <td className="px-4 py-3">24 hours</td>
                <td className="px-4 py-3">Google Analytics session grouping</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2>2. Local Storage & IndexedDB</h2>
      <p>
        In addition to cookies, we use modern browser storage mechanisms (LocalStorage and IndexedDB via localforage) to ensure our platform operates efficiently:
      </p>
      <ul>
        <li><strong>Offline Media Caching:</strong> To provide a seamless experience, we temporarily cache media assets locally. This reduces bandwidth usage and improves load times.</li>
        <li><strong>Draft Storage:</strong> Your memoir text and ongoing work are saved locally to prevent data loss in the event of an internet disconnect.</li>
      </ul>

      <h2>3. Manage Your Preferences</h2>
      <p>
        You have the right to choose whether or not to accept non-essential cookies. Strictly necessary cookies cannot be disabled as they are required for the platform to function.
      </p>

      <div className="my-8 rounded-xl border border-white/10 bg-studio-card p-6">
        <h3 className="mt-0 mb-4 text-lg font-medium text-white/90">Analytics Cookies</h3>
        <p className="mb-6 text-sm text-white/60">
          Help us improve Memory Weaver by allowing us to collect anonymised usage data. We use this data to understand which features are most useful and to identify technical issues.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleConsentChange(true)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              consent === true 
                ? 'bg-amber-500 text-black' 
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Accept Analytics
          </button>
          <button
            onClick={() => handleConsentChange(false)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              consent === false 
                ? 'bg-white/20 text-white border border-white/10' 
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
            }`}
          >
            Reject Analytics
          </button>
        </div>
        
        <div className="mt-5 flex items-center gap-2 text-xs">
          <span className="text-white/40">Current Setting:</span>
          {consent === true && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Analytics Allowed
            </span>
          )}
          {consent === false && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Analytics Blocked (Privacy Shield Active)
            </span>
          )}
          {consent === null && (
            <span className="text-white/40">No preference recorded</span>
          )}
        </div>
      </div>

      <hr className="my-8 border-white/10" />

      <p className="text-sm text-white/40">
        If you have any questions regarding our use of cookies, please contact <a href="mailto:support@memoryweaver.studio">support@memoryweaver.studio</a>.
      </p>
    </div>
  );
}
