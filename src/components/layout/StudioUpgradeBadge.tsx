'use client';

import React from 'react';
import { useStudioUpgradeCheck } from '@/hooks/useStudioUpgradeCheck';
import { Rocket, Sparkles } from 'lucide-react';
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
      className="relative group flex items-center gap-2.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400/40 to-amber-500/30 hover:from-emerald-400/50 hover:to-amber-400/50 border-2 border-emerald-400/90 hover:border-emerald-300 text-emerald-100 hover:text-white text-[11px] font-mono font-black uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:shadow-[0_0_35px_rgba(16,185,129,0.9)] scale-100 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer select-none overflow-hidden"
      title="A new version of Memory Weaver is live. Click to upgrade!"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
      </span>

      <Rocket className="w-4 h-4 text-emerald-300 group-hover:text-amber-300 animate-bounce transition-colors" />

      <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-extrabold">
        STUDIO UPGRADE
      </span>

      <Sparkles className="w-3 h-3 text-amber-300 opacity-80 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};
