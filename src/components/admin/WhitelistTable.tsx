'use client';

import React from 'react';
import { WhitelistUser } from '@/types/admin';

interface WhitelistTableProps {
  initialUsers?: WhitelistUser[];
}

export function WhitelistTable({ initialUsers = [] }: WhitelistTableProps) {
  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">Access Whitelist</h3>
          <p className="text-xs text-slate-500 mt-1">Manage staff identities and dynamic access permissions</p>
        </div>
      </div>
      <div className="text-center py-8 text-slate-500 text-xs font-mono">
        INITIALIZING WHITELIST GRID DATA INTERFACE FRAMEWORK...
      </div>
    </div>
  );
}
