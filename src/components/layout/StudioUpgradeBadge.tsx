'use client';

import React from 'react';
import { useStudioUpgradeCheck } from '@/hooks/useStudioUpgradeCheck';
import { Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface StudioUpgradeBadgeProps {
  onBeforeUpgrade?: () => Promise<void> | void;
}

export const StudioUpgradeBadge: React.FC<StudioUpgradeBadgeProps> = ({ onBeforeUpgrade }) => {
  const { hasUpgrade, latestVersion } = useStudioUpgradeCheck();

  if (!hasUpgrade) return null;

  const handlePromptUpgrade = () => {
    toast.info("🚀 Studio Upgrade Available", {
      description: `A fresh build of Memory Weaver (${latestVersion || 'latest'}) is ready. Your custom script edits are safe and saved. Click below to upgrade.`,
      action: {
        label: "Upgrade Studio",
        onClick: async () => {
          if (onBeforeUpgrade) {
            try {
              await onBeforeUpgrade();
            } catch (e) {
              console.error("[StudioUpgradeBadge] Pre-upgrade save failed:", e);
            }
          }
          if (typeof window !== 'undefined') {
            window.location.href = window.location.pathname;
          }
        }
      },
      duration: 12000
    });
  };

  return (
    <button
      type="button"
      data-hotspot-id="HS_NAV_UPGRADE_BADGE_BTN"
      onClick={handlePromptUpgrade}
      className="flex items-center gap-2 px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse transition-all cursor-pointer select-none"
      title="A new version of Memory Weaver is live. Click to upgrade!"
    >
      <Rocket className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
      <span>STUDIO UPGRADE</span>
    </button>
  );
};
