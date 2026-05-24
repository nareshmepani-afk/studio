'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';

export type MentorshipAct = 0 | 1 | 2 | 3 | 4;

export interface MentorHotspot {
  number: number;
  label: string;
  elementId: string; // The ID of the element to point to
}

export interface MentorWhisper {
  act: MentorshipAct;
  whisper: string;
  toolLabel?: string;
  seeds?: { type: 'aroma' | 'soundscape' | 'visual'; label: string }[];
  hotspots?: MentorHotspot[];
}

const WHISPERS: Record<MentorshipAct, MentorWhisper> = {
  0: {
    act: 0,
    whisper: "Stuck on the first frame? Focus on a single sense. What did the air smell like? Savour the colour of this moment.",
    toolLabel: "Inspiration Seeds",
    seeds: [
      { type: 'aroma', label: 'The scent of rain on dry earth' },
      { type: 'soundscape', label: 'The distant rhythm of a city' },
      { type: 'visual', label: 'The amber glow of an afternoon' }
    ],
    hotspots: [
      { number: 1, label: "Set the Scene Coordinates", elementId: "memory-metadata" },
      { number: 2, label: "Cast the Story Hook", elementId: "story-hook" },
      { number: 3, label: "Enter the Weave", elementId: "next-act-btn" }
    ]
  },
  1: {
    act: 1,
    whisper: "Savour the contrast in these takes. One leans into the atmosphere, another into the soul. Which is your authorised vision?",
    toolLabel: "The Magnetic Pulse",
    hotspots: [
      { number: 1, label: "Review Narrative Interpretations", elementId: "selection-deck" },
      { number: 2, label: "Enter Recording Studio", elementId: "next-act-btn" }
    ]
  },
  2: {
    act: 2,
    whisper: "The floor is yours. Settle in, adjust your lighting, and choose your station. Shall we record in solitude, or is this a narrative that demands an ensemble?",
    toolLabel: "Stage Manager's Briefing",
    seeds: [
      { type: 'visual', label: 'Breathe Deep' },
      { type: 'visual', label: 'Slow Down' },
      { type: 'visual', label: 'Speak from the Heart' }
    ],
    hotspots: [
      { number: 1, label: "Initialize Camera", elementId: "camera-view" },
      { number: 2, label: "Begin Performance", elementId: "record-btn" }
    ]
  },
  3: {
    act: 3,
    whisper: "The Studio is synthesising your intent with your energy. This is the alchemy of memory.",
    toolLabel: "Calibrating Clarity",
    hotspots: [
      { number: 1, label: "Review Weave", elementId: "fusion-display" },
      { number: 2, label: "Confirm Final Cut", elementId: "next-act-btn" }
    ]
  },
  4: {
    act: 4,
    whisper: "Your memory is now a permanent chapter in your life's cinematic timeline. Witness the fusion of soul and script.",
    toolLabel: "Archival Entry",
    hotspots: [
      { number: 1, label: "Witness Premiere", elementId: "premiere-screen" },
      { number: 2, label: "Publish to Cinema", elementId: "publish-btn" }
    ]
  }
};

export interface StudioMentorContextType {
  mentorModeActive: boolean;
  isOverlayOpen: boolean;
  isManualMentor: boolean;
  toggleMentor: (manual?: boolean) => void;
  triggerWhisper: (whisper: MentorWhisper) => void;
  closeOverlay: () => void;
  getWhisper: (act: number) => MentorWhisper;
}

const StudioMentorContext = createContext<StudioMentorContextType | undefined>(undefined);

export const StudioMentorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mentorModeActive, setMentorModeActive] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isManualMentor, setIsManualMentor] = useState(false);
  const [customWhisper, setCustomWhisper] = useState<MentorWhisper | null>(null);

  const toggleMentor = useCallback((manual: boolean = false) => {
    setIsManualMentor(manual);
    setMentorModeActive(prev => {
      const next = !prev;
      if (next) {
        setIsOverlayOpen(true);
        toast("Studio Mentor Online", {
          description: "ACT I Guided Walkthrough initialized. Follow the golden beacons.",
          icon: "🧠",
          duration: 5000,
        });
      } else {
        setIsOverlayOpen(false);
        setCustomWhisper(null);
        toast("Mentor Standby", {
          description: "Guided assistance has been retracted. You're in the lead.",
        });
      }
      return next;
    });
  }, []);

  const triggerWhisper = useCallback((whisper: MentorWhisper) => {
    setCustomWhisper(whisper);
    setMentorModeActive(true);
    setIsOverlayOpen(true);
  }, []);

  const closeOverlay = useCallback(() => {
    setIsOverlayOpen(false);
    setCustomWhisper(null);
  }, []);

  const getWhisper = useCallback((act: number): MentorWhisper => {
    if (customWhisper && customWhisper.act === act) {
      return customWhisper;
    }
    return WHISPERS[act as MentorshipAct] || WHISPERS[0];
  }, [customWhisper]);

  return (
    <StudioMentorContext.Provider value={{
      mentorModeActive,
      isOverlayOpen,
      isManualMentor,
      toggleMentor,
      triggerWhisper,
      closeOverlay,
      getWhisper
    }}>
      {children}
    </StudioMentorContext.Provider>
  );
};

export const useStudioMentor = () => {
  const context = useContext(StudioMentorContext);
  if (context === undefined) {
    return {
      mentorModeActive: false,
      isOverlayOpen: false,
      isManualMentor: false,
      toggleMentor: () => {},
      triggerWhisper: () => {},
      closeOverlay: () => {},
      getWhisper: () => ({ act: 0, whisper: '' })
    } as StudioMentorContextType;
  }
  return context;
};
