import { motion } from 'framer-motion';
import { User, Users, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JourneyMode } from '@/hooks/studio/useStudioMode';

interface ModeSwitcherProps {
  currentMode: JourneyMode;
  onModeChange: (mode: JourneyMode) => void;
}

export function ModeSwitcher({ currentMode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="flex p-1 bg-slate-900 rounded-xl border border-white/10 w-fit">
      <Button
        variant="ghost"
        onClick={() => onModeChange('solo')}
        className={`relative px-6 py-2 rounded-lg transition-colors ${
          currentMode === 'solo' ? 'text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        {currentMode === 'solo' && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <User className="w-4 h-4 mr-2" />
        Solo Mode
      </Button>

      <Button
        variant="ghost"
        onClick={() => onModeChange('interview')}
        className={`relative px-6 py-2 rounded-lg transition-colors ${
          currentMode === 'interview' ? 'text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        {currentMode === 'interview' && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Users className="w-4 h-4 mr-2" />
        Interview Mode
      </Button>
    </div>
  );
}

export default ModeSwitcher
