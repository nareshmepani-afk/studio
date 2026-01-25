"use client";

import { motion } from "framer-motion";
import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudioState } from "@/hooks/studio/useStudioState";

export const ModeSwitcher = () => {
  const { mode, actions } = useStudioState();

  return (
    <div className="flex bg-[#121212] p-1 rounded-full border border-white/10 w-fit">
      <button
        onClick={() => actions.setMode('solo')}
        className={cn(
          "relative flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-colors",
          mode === 'solo' ? "text-white" : "text-zinc-500 hover:text-white"
        )}
      >
        {mode === 'solo' && (
          <motion.div
            layoutId="active-pill"
            className="absolute inset-0 bg-white/10 rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <User className="w-4 h-4" />
        Solo
      </button>

      <button
        onClick={() => actions.setMode('director')}
        className={cn(
          "relative flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-colors",
          mode === 'director' ? "text-white" : "text-zinc-500 hover:text-white"
        )}
      >
        {mode === 'director' && (
          <motion.div
            layoutId="active-pill"
            className="absolute inset-0 bg-white/10 rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Users className="w-4 h-4" />
        Director
      </button>
    </div>
  );
};