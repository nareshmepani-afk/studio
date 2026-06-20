'use client';

import React from 'react';
import AccessSupport from './AccessSupport';

export function AccessConsole() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          🔐 Customer Support & Access Control
        </h3>
        <p className="text-slate-500 text-xs leading-relaxed">
          Manage whitelisted staff profiles, toggle active status, check MFA configuration states, and authorize new administrators.
        </p>
      </div>
      <AccessSupport />
    </div>
  );
}
