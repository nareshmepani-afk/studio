'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { HardDrive, Clock, Film, MonitorPlay } from 'lucide-react';
import { motion } from 'framer-motion';

const QUALITY_RATES = {
  SD: 50,
  HD: 150,
  '4K': 350,
} as const;

type Quality = keyof typeof QUALITY_RATES;

export function StorageCalculator() {
  const [memories, setMemories] = useState(5);
  const [minutes, setMinutes] = useState(5);
  const [quality, setQuality] = useState<Quality>('HD');

  const totalMinutes = memories * minutes;
  const totalMB = totalMinutes * QUALITY_RATES[quality];
  const totalGB = Number((totalMB / 1024).toFixed(2));

  const VAULT_LIMIT = 5;
  const GEN_LIMIT = 100;

  const usagePercent = Math.min((totalGB / VAULT_LIMIT) * 100, 100);
  const genPercent = Math.min((totalGB / GEN_LIMIT) * 100, 100);

  const getProgressColour = (gb: number) => {
    if (gb > VAULT_LIMIT) return 'bg-red-500';
    if (gb > VAULT_LIMIT * 0.8) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-neutral-900/50 p-6 md:p-8 backdrop-blur-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                <Film className="w-4 h-4 text-neutral-400" />
                Number of Memories
              </label>
              <span className="text-sm font-semibold text-amber-400">{memories}</span>
            </div>
            <Slider
              value={[memories]}
              onValueChange={(val) => setMemories(val[0])}
              max={50}
              min={1}
              step={1}
              className="py-2"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                Average Video Length (mins)
              </label>
              <span className="text-sm font-semibold text-amber-400">{minutes}</span>
            </div>
            <Slider
              value={[minutes]}
              onValueChange={(val) => setMinutes(val[0])}
              max={30}
              min={1}
              step={1}
              className="py-2"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-neutral-200 flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-neutral-400" />
              Video Quality
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(QUALITY_RATES) as Quality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                    quality === q
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-black/40 rounded-xl p-6 border border-white/5">
          <div className="text-center mb-8">
            <h4 className="text-neutral-400 text-sm font-medium mb-2 uppercase tracking-wider">Estimated Storage</h4>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-serif text-5xl font-medium text-white">{totalGB}</span>
              <span className="text-xl text-neutral-500">GB</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-400">Standard 5 GB Vault</span>
                <span className={totalGB > VAULT_LIMIT ? 'text-red-400' : 'text-neutral-500'}>
                  {totalGB > VAULT_LIMIT ? 'Upgrade recommended' : `${(VAULT_LIMIT - totalGB).toFixed(2)} GB free`}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getProgressColour(totalGB)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-400">Generational 100 GB Vault</span>
                <span className="text-neutral-500">
                  {totalGB > GEN_LIMIT ? 'Capacity exceeded' : `${(GEN_LIMIT - totalGB).toFixed(2)} GB free`}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${genPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
