'use client';

import { useLanguage, LanguageMode } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageToggle() {
  const { mode, setMode } = useLanguage();

  const labels: Record<LanguageMode, string> = {
    en: 'English Focus',
    gu: 'Native Focus (ગુજરાતી)',
    dual: 'Bilingual (Subtitled)',
  };

  const currentLabel = labels[mode];

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="default" 
                className="w-auto h-8 px-3 flex items-center gap-2 border border-white/5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-full"
                aria-label={`Current language mode: ${currentLabel}`}
              >
                <Languages className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  {mode === 'dual' ? 'Hybrid' : mode.toUpperCase()}
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">
            Focus: {currentLabel}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="bg-neutral-950/90 backdrop-blur-2xl border-white/10 shadow-2xl min-w-[180px] p-1.5">
        <DropdownMenuItem 
          onClick={() => setMode('en')}
          className={`text-[11px] font-semibold uppercase tracking-wider p-2.5 rounded-md transition-colors focus:bg-primary/20 focus:text-primary cursor-pointer mb-1 ${mode === 'en' ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
        >
          English Focus
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setMode('gu')}
          className={`text-[11px] font-semibold uppercase tracking-wider p-2.5 rounded-md transition-colors focus:bg-primary/20 focus:text-primary cursor-pointer mb-1 ${mode === 'gu' ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
        >
          Native Focus (ગુજરાતી)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setMode('dual')}
          className={`text-[11px] font-semibold uppercase tracking-wider p-2.5 rounded-md transition-colors focus:bg-primary/20 focus:text-primary cursor-pointer ${mode === 'dual' ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
        >
          Bilingual (Hybrid)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
