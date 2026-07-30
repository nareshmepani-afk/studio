'use client';

import { useState, useEffect, useCallback } from 'react';

interface VersionResponse {
  version: string;
  commitSha: string;
  buildTimestamp: string;
}

export function useStudioUpgradeCheck(pollIntervalMs = 10 * 60 * 1000) {
  const [hasUpgrade, setHasUpgrade] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [latestSha, setLatestSha] = useState<string | null>(null);

  const activeSha = 
    process.env.NEXT_PUBLIC_COMMIT_SHA || 
    process.env.NEXT_PUBLIC_GIT_SHA || 
    process.env.VERCEL_GIT_COMMIT_SHA || 
    process.env.BUILD_ID || 
    'dev';

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch('/api/version', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;

      const data: VersionResponse = await res.json();
      if (!data.commitSha) return;

      setLatestVersion(data.version);
      setLatestSha(data.commitSha);

      // Mismatch detection: If activeSha is known and returned commitSha is different
      if (activeSha && activeSha !== 'dev' && data.commitSha !== 'dev' && activeSha !== data.commitSha) {
        console.log(`[Studio Upgrade Check] New deployment detected! Active: ${activeSha}, Deployed: ${data.commitSha}`);
        setHasUpgrade(true);
      }
    } catch (err) {
      console.warn('[Studio Upgrade Check] Transient version check failure:', err);
    }
  }, [activeSha]);

  useEffect(() => {
    // 1. Initial check on mount
    checkVersion();

    // 2. Visibility change listener (overnight PC wake-up / tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Periodic fallback interval (e.g. 10 mins)
    const timer = setInterval(() => {
      checkVersion();
    }, pollIntervalMs);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timer);
    };
  }, [checkVersion, pollIntervalMs]);

  return {
    hasUpgrade,
    activeSha,
    latestSha,
    latestVersion,
    checkNow: checkVersion,
    triggerUpgrade: () => setHasUpgrade(true) // For unit tests / forced triggers
  };
}
