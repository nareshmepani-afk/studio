
"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="dark"
      duration={10000}
      closeButton={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast flex items-center gap-3 border shadow-2xl rounded-xl px-6 py-4 min-w-[350px] transition-all duration-300 relative",
          title: "text-white font-bold text-sm tracking-tight",
          description: "text-white/90 text-xs mt-1 leading-relaxed",
          actionButton:
            "bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-md text-xs hover:bg-amber-400 transition-colors",
          cancelButton:
            "bg-slate-800 text-slate-100 px-3 py-1 rounded-md text-xs hover:bg-slate-700 transition-colors",
          closeButton:
            "!bg-slate-950/80 hover:!bg-slate-900 !border !border-white/20 !text-white/80 hover:!text-white transition-all p-1 rounded-full cursor-pointer z-[99] left-[auto] right-2 top-2",
          // Base status styles
          error: "bg-red-800 border-red-500/50 shadow-[0_0_20px_rgba(153,27,27,0.3)]",
          success: "bg-emerald-800 border-emerald-500/50 shadow-[0_0_20px_rgba(6,95,70,0.3)]",
          warning: "bg-amber-800 border-amber-500/50 shadow-[0_0_20px_rgba(146,64,14,0.3)]",
          info: "bg-blue-800 border-blue-500/50 shadow-[0_0_20px_rgba(30,58,138,0.3)]",
          default: "bg-slate-900 border-white/10 backdrop-blur-xl",
        },
      }}
    />
  );
}
