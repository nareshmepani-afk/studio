import React from 'react';

interface MobilePortalOverlayProps {
  onActivateRemoteLens: () => void;
  onExit: () => void;
}

export const MobilePortalOverlay: React.FC<MobilePortalOverlayProps> = ({
  onActivateRemoteLens,
  onExit,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-indigo-500/10 p-4 text-indigo-400 border border-indigo-500/20">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight">Optimized for Larger Screens</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          The Memory Weaver Production Studio is a professional workstation designed for desktops or tablets. 
          Use your phone as an ultra-high-definition camera lens, or return to your memories.
        </p>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={onActivateRemoteLens}
            className="w-full rounded-lg bg-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow hover:bg-indigo-500 active:bg-indigo-700 transition"
          >
            ?? Set Up Mobile Lens Mode
          </button>
          <button
            onClick={onExit}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 py-3 px-4 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            ?? Go Back to My Memories
          </button>
        </div>
      </div>
    </div>
  );
};
