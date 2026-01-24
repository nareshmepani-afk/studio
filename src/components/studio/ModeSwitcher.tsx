'use client';

import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModeSwitcherProps {
  mode: 'SOLO' | 'INTERVIEW';
  onToggle: () => void;
}

export function ModeSwitcher({ mode, onToggle }: ModeSwitcherProps) {
  return (
    <div className="flex p-1 bg-slate-900 rounded-xl border border-white/10 w-fit">
      <Button
        variant="ghost"
        onClick={onToggle}
        className={`relative px-6 py-2 rounded-lg transition-colors ${
          mode === 'SOLO' ? 'text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        {mode === 'SOLO' && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <User className="w-4 h-4 mr-2" />
        Solo
      </Button>

      <Button
        variant="ghost"
        onClick={onToggle}
        className={`relative px-6 py-2 rounded-lg transition-colors ${
          mode === 'INTERVIEW' ? 'text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        {mode === 'INTERVIEW' && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Users className="w-4 h-4 mr-2" />
        Interview
      </Button>
    </div>
  );
}
