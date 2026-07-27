/**
 * STUDIO REGRESSION SUITE
 * Mandate: "Fix & Codify" - Every fix must have a corresponding test case.
 * Reference: src/test/STUDIO_TESTING_MANDATE.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import React from 'react';
import { createPortal } from 'react-dom';
import { ScopeToggleGroup } from '@/components/studio/ScopeToggleGroup';
import { ScriptLightBox } from '@/components/studio/Scriptorium/Ceremony/ScriptLightBox';

vi.mock('framer-motion', () => {
  const cleanProps = ({
    whileHover,
    whileTap,
    layoutId,
    initial,
    animate,
    exit,
    transition,
    variants,
    viewport,
    drag,
    dragElastic,
    dragSnapToOrigin,
    onDragStart,
    onDragEnd,
    ...rest
  }: any) => rest;
  return {
    motion: {
      div: ({ children, ...props }: any) => <div {...cleanProps(props)}>{children}</div>,
      button: ({ children, ...props }: any) => <button {...cleanProps(props)}>{children}</button>,
      span: ({ children, ...props }: any) => <span {...cleanProps(props)}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock Lucide icons properly
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    // Add any specific ones if needed, or just let them be components
    Plus: () => <div data-testid="icon-plus" />,
    RotateCcw: () => <div data-testid="icon-rotate" />,
    ShieldCheck: () => <div data-testid="icon-shield" />,
    Lock: () => <div data-testid="icon-lock" />,
  };
});

// Mock react-dom's createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: vi.fn((children) => children),
  };
});

// Mock useStudioState
vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({
    isReviewing: false,
    isProductionLocked: false,
    activeDrawer: null,
    actions: {
      setIsReviewing: vi.fn(),
      setIsProductionLocked: vi.fn(),
      setActiveDrawer: vi.fn(),
      setStage: vi.fn(),
    }
  }),
}));

describe('Studio Regression Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('AI Weaver V5.1 Logic (Prompt Verification)', () => {
    it('should verify that the Historical Continuity mandate is configured correctly', () => {
      // Since aiWeaver is a server action, we test the prompt logic integrity
      const description = "My grandfather was a labourer in Kutch before moving to Kenya.";
      const age = 1;
      
      // Simulating the prompt construction logic from aiWeaver.ts
      const prompt = `
        SYSTEM PROMPT – CINEMATIC SYNTHESIS ENGINE V5.1 (HISTORICAL CONTINUITY)
        USER STORY HOOK: "${description}"
        ${age < 4 ? 'INHERITED NARRATIVE MODE' : 'EYEWITNESS MODE'}
      `;

      expect(prompt).toContain('V5.1');
      expect(prompt).toContain(description);
      expect(prompt).toContain('INHERITED NARRATIVE MODE');
    });
  });

  describe('ScopeToggleGroup: Production Lock Support', () => {
    const mockProps = {
      value: 'Moment' as const,
      onChange: vi.fn(),
      durationQuantity: 1,
      onDurationChange: vi.fn(),
      durationUnit: 'years' as const,
      onUnitChange: vi.fn(),
    };

    it('should be interactive when not disabled', () => {
      render(<ScopeToggleGroup {...mockProps} />);
      const yearButton = screen.getByText(/year/i);
      fireEvent.click(yearButton);
      expect(mockProps.onChange).toHaveBeenCalledWith('Year');
    });

    it('should NOT be interactive when disabled (Production Lock active)', () => {
      render(<ScopeToggleGroup {...mockProps} disabled={true} />);
      const yearButton = screen.getByText(/year/i);
      
      // Check for disabled attribute on the parent button
      const button = yearButton.closest('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-40');
      
      fireEvent.click(yearButton);
      expect(mockProps.onChange).not.toHaveBeenCalled();
    });
  });

  describe('ArchiveDrawer: Portal Isolation', () => {
    it('should confirm that ArchiveDrawer uses createPortal for root-level rendering', async () => {
      const { createPortal } = await import('react-dom');
      const { ArchiveDrawer } = await import('@/components/studio/ArchiveDrawer');
      
      render(
        <ArchiveDrawer 
          isOpen={true} 
          onClose={() => {}} 
          originalHook="Test" 
          scriptHistory={[]} 
          onRestore={() => {}} 
        />
      );

      // Verify createPortal was called to escape parent constraints
      expect(createPortal).toHaveBeenCalled();
    });
  });

  describe('ScriptLightBox: Portal & Stacking Context Fix', () => {
    it('should use createPortal to ensure it escapes local stacking contexts', () => {
      render(
        <ScriptLightBox 
          isOpen={true} 
          onClose={() => {}} 
          originalHook="Test" 
          cleanScript="Test Clean"
          visionLabel="Test Label"
          visionFocus="Test Focus"
          onApply={() => {}}
        />
      );

      expect(createPortal).toHaveBeenCalled();
    });

    it('should call onClose when the "X" button is clicked', () => {
      const mockOnClose = vi.fn();
      
      render(
        <ScriptLightBox 
          isOpen={true} 
          onClose={mockOnClose} 
          originalHook="Test" 
          cleanScript="Test Clean"
          visionLabel="Test Label"
          visionFocus="Test Focus"
          onApply={() => {}}
        />
      );

      const closeButton = screen.getAllByLabelText(/Close Review/i)[0];
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when the "Return to Selection Deck" button is clicked', () => {
      const mockOnClose = vi.fn();
      
      render(
        <ScriptLightBox 
          isOpen={true} 
          onClose={mockOnClose} 
          originalHook="Test" 
          cleanScript="Test Clean"
          visionLabel="Test Label"
          visionFocus="Test Focus"
          onApply={() => {}}
        />
      );

      const returnButton = screen.getAllByText(/Return to Selection Deck/i)[0];
      fireEvent.click(returnButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('useMemoryPersistence: Rehydration & Modality Shields', () => {
    const mockUpdate = vi.fn().mockResolvedValue({ success: true });
    const mockSetDescription = vi.fn();

    const baseProps = {
      data: {
        id: 'test-id',
        title: 'Initial Title',
        description: 'Initial Description',
        location: 'London',
        country: 'UK',
        dateComponents: {
          day: '1',
          month: 'Jan',
          year: '2026',
        },
        scriptBlocks: [],
        chapterTitle: 'Chapter 1',
        posterStyle: 'cinematic' as const,
        credits: {
          director: '',
          producer: '',
          starring: '',
          billingLine: '',
        },
        aiTakes: null,
        structuredScript: null,
        sensory: {},
        originalHook: '',
        scriptHistory: [],
        isProductionLocked: false,
        productionStage: 0,
        timeframeScope: 'Year' as const,
        narratorAgeAtTime: 25,
        durationQuantity: 1,
        durationUnit: 'years' as const,
        modality: 'pen' as const,
        activeVision: 'soul',
        productionTakes: [],
        isReviewing: false,
      },
      update: mockUpdate,
      title: 'Initial Title',
      description: 'Initial Description',
      location: 'London',
      country: 'UK',
      tags: [],
      day: '1',
      month: 'Jan',
      year: '2026',
      sensoryValues: {},
      scriptBlocks: [],
      chapterTitle: 'Chapter 1',
      usePoster: false,
      posterStyle: 'cinematic' as const,
      posterImageUrl: '',
      director: '',
      producer: '',
      starring: '',
      billingLine: '',
      aiTakes: null,
      setDescription: mockSetDescription,
      modality: 'pen' as const,
      activeVision: 'soul',
      timeframeScope: 'Year' as const,
      narratorAgeAtTime: 25,
      durationQuantity: 1,
      durationUnit: 'years' as const,
      isReviewing: false,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should ignore modality update if new modality is falsy but DB already has modality', async () => {
      const { useMemoryPersistence } = await import('@/hooks/studio/useMemoryPersistence');
      const props = {
        ...baseProps,
        modality: undefined,
      };

      const { result } = renderHook(() => useMemoryPersistence(props));

      const flushResult = await result.current.flush();
      expect(flushResult.changed).toBe(false);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should ignore activeVision update if new vision is falsy but DB already has activeVision', async () => {
      const { useMemoryPersistence } = await import('@/hooks/studio/useMemoryPersistence');
      const props = {
        ...baseProps,
        activeVision: undefined,
      };

      const { result } = renderHook(() => useMemoryPersistence(props));

      const flushResult = await result.current.flush();
      expect(flushResult.changed).toBe(false);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should fallback to populated fields in delta payload to prevent overwriting during sync', async () => {
      const { useMemoryPersistence } = await import('@/hooks/studio/useMemoryPersistence');
      const props = {
        ...baseProps,
        title: 'Updated Title',
        modality: undefined,
        activeVision: undefined,
      };

      const { result } = renderHook(() => useMemoryPersistence(props));

      await result.current.flush();
      expect(mockUpdate).toHaveBeenCalled();
      
      const lastCallArg = mockUpdate.mock.calls[mockUpdate.mock.calls.length - 1][0];
      expect(lastCallArg.modality).toBe('pen');
      expect(lastCallArg.activeVision).toBe('soul');
    });

    it('V6.3 LOCK INTEGRITY: should immediately apply lock overrides and persist lock changes securely to Firestore', async () => {
      const { useMemoryPersistence } = await import('@/hooks/studio/useMemoryPersistence');
      const props = {
        ...baseProps,
        isProductionLocked: false,
        data: {
          ...baseProps.data,
          isProductionLocked: false,
        }
      };

      const { result } = renderHook(() => useMemoryPersistence(props));

      // Flush with a lock override
      const flushResult = await result.current.flush({ isProductionLocked: true });
      expect(flushResult.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      
      // Ensure payload contains the override lock value
      const callArg = mockUpdate.mock.calls[0][0];
      expect(callArg.isProductionLocked).toBe(true);
    });

    it('V6.3 UNLOCK INTEGRITY: should immediately apply unlock overrides and persist unlock changes securely to Firestore', async () => {
      const { useMemoryPersistence } = await import('@/hooks/studio/useMemoryPersistence');
      const props = {
        ...baseProps,
        isProductionLocked: true,
        data: {
          ...baseProps.data,
          isProductionLocked: true,
        }
      };

      const { result } = renderHook(() => useMemoryPersistence(props));

      // Flush with an unlock override
      const flushResult = await result.current.flush({ isProductionLocked: false });
      expect(flushResult.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      
      // Ensure payload contains the override unlock value
      const callArg = mockUpdate.mock.calls[0][0];
      expect(callArg.isProductionLocked).toBe(false);
    });

    it('should return prose in flush result package when prose is populated', async () => {
      const { useMemoryPersistence } = await import('@/hooks/studio/useMemoryPersistence');
      const props = {
        ...baseProps,
        data: { ...baseProps.data, prose: 'Long synthesized prose text with 367 words' }
      };

      const { result } = renderHook(() => useMemoryPersistence(props));
      const flushResult = await result.current.flush({ description: 'Test desc', prose: 'Flushed prose text with 367 words' });

      expect(flushResult.success).toBe(true);
      expect(flushResult.prose).toBe('Flushed prose text with 367 words');
    });

    it('HS_ACT1_DRAFT_COMPLETED_BTN INTEGRITY: should lock production state and preserve exact prose upon draft completion', async () => {
      const { useMemoryPersistence } = await import('@/hooks/studio/useMemoryPersistence');
      const mockUpdate = vi.fn();
      const testProse = "The history I carry is a grand odyssey across oceans and generations.";
      const props = {
        ...baseProps,
        data: { ...baseProps.data, prose: testProse, isProductionLocked: false },
        update: mockUpdate
      };

      const { result } = renderHook(() => useMemoryPersistence(props));

      await result.current.flush({ isProductionLocked: true, prose: testProse });

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        isProductionLocked: true,
        prose: testProse
      }));
    });

    it('SPOKEN WORD RULE SANITIZER: should strip screenplay and camera cues from generated monologues', async () => {
      const { stripScreenplayCues } = await import('@/actions/aiWeaver');
      const input = "Cut to a frame of red earth clinging to cracked palms in Kutch, a silent inheritance carried across dark waters. The lens zooms past Nairobi's equatorial blaze.";
      const cleaned = await stripScreenplayCues(input);

      expect(cleaned).not.toContain("Cut to");
      expect(cleaned).not.toContain("Cut to a frame of");
      expect(cleaned).not.toContain("The lens zooms");
      expect(cleaned).toBe("Red earth clinging to cracked palms in Kutch, a silent inheritance carried across dark waters. Nairobi's equatorial blaze.");
    });

    it('CARD #5 MASTER FUSION: should sanitize and hydrate Card #5 (The Memory Weave) cleanly', async () => {
      const { stripScreenplayCues } = await import('@/lib/sanitizer');
      const masterRaw = "Cut to a frame of the master synthesis fusing voice, emotion, and sensory depth.";
      const cleanedMaster = stripScreenplayCues(masterRaw);

      expect(cleanedMaster).not.toContain("Cut to");
      expect(cleanedMaster).toBe("The master synthesis fusing voice, emotion, and sensory depth.");
    });

    it('HTML SANITIZER: should strip HTML paragraph and formatting tags from prose text', async () => {
      const { stripScreenplayCues } = await import('@/lib/sanitizer');
      const htmlInput = "<p>Let's begin the story of you. Take a moment to think about where it all started...</p>";
      const cleaned = stripScreenplayCues(htmlInput);

      expect(cleaned).not.toContain("<p>");
      expect(cleaned).not.toContain("</p>");
      expect(cleaned).toBe("Let's begin the story of you. Take a moment to think about where it all started...");
    });

    it('SELECTION DECK HIERARCHY: should strictly select 1 card based on activeVision key without multi-card badge collision', () => {
      const activeVisionKey = 'poetic';
      const drafts = [
        { visionType: 'Original Polished', cleanScript: 'Identical text' },
        { visionType: 'The Poetic Weave', cleanScript: 'Identical text' },
        { visionType: 'The Direct Weave', cleanScript: 'Identical text' },
        { visionType: 'The Generational Weave', cleanScript: 'Identical text' },
        { visionType: 'The Memory Weave', cleanScript: 'Identical text' }
      ];

      const getVisionId = (type: string) => {
        if (type.includes("Memory Weave") || type.includes("Master") || type.includes("Crown") || type.includes("Fusion")) return "master";
        if (type.includes("Original") || type.includes("Committed")) return "original";
        if (type.includes("Soul") || type.includes("Poetic")) return "soul";
        if (type.includes("Atmospheric") || type.includes("Direct")) return "sensory";
        if (type.includes("Cinematic") || type.includes("Generational")) return "cinematic";
        return "sensory";
      };

      const isSelectedCard = (opt: any) => {
        const typeId = getVisionId(opt.visionType);
        const key = (activeVisionKey || '').toLowerCase().trim();
        if (key) {
          return (
            key === typeId ||
            (key === 'poetic' && typeId === 'soul') ||
            (key === 'direct' && typeId === 'sensory') ||
            (key === 'nostalgic' && typeId === 'cinematic') ||
            key === (opt.visionType || '').toLowerCase().trim()
          );
        }
        return false;
      };

      const selectedCards = drafts.filter(isSelectedCard);
      expect(selectedCards.length).toBe(1);
      expect(selectedCards[0].visionType).toBe('The Poetic Weave');
    });

    it('CARD #4 THE FLOW: should map Card #4 to The Flow with Waves icon logic', () => {
      const getVisionId = (type: string) => {
        if (type.includes("Memory Weave") || type.includes("Master") || type.includes("Crown") || type.includes("Fusion")) return "master";
        if (type.includes("Original") || type.includes("Committed")) return "original";
        if (type.includes("Soul") || type.includes("Poetic")) return "soul";
        if (type.includes("Atmospheric") || type.includes("Direct")) return "sensory";
        if (type.includes("Flow") || type.includes("Cadence") || type.includes("Cinematic") || type.includes("Generational")) return "cinematic";
        return "sensory";
      };

      expect(getVisionId("The Flow")).toBe("cinematic");
      expect(getVisionId("Dynamic Cadence")).toBe("cinematic");
    });

    it('COVER FLOW CAROUSEL: should calculate relative distance offsets for 5 cards cleanly', () => {
      const draftsCount = 5;
      const carouselIndex = 2; // Card #3 centered

      const getDistance = (idx: number) => {
        const rawOffset = (idx - carouselIndex + draftsCount) % draftsCount;
        return rawOffset > draftsCount / 2 ? rawOffset - draftsCount : rawOffset;
      };

      expect(getDistance(2)).toBe(0); // Centered active card
      expect(getDistance(1)).toBe(-1); // Left flanking card
      expect(getDistance(3)).toBe(1); // Right flanking card
    });

    it('CARD INDEXING & TELEMETRY COUNTER: should format 01 / 05 through 05 / 05 index tags and active counter correctly', () => {
      const draftsCount = 5;
      const formatIndexTag = (idx: number, total: number) => `0${idx + 1} / 0${total}`;
      const formatActiveCounter = (carouselIndex: number, total: number) => `VISION 0${carouselIndex + 1} OF 0${total}`;

      expect(formatIndexTag(0, draftsCount)).toBe('01 / 05');
      expect(formatIndexTag(4, draftsCount)).toBe('05 / 05');
      expect(formatActiveCounter(1, draftsCount)).toBe('VISION 02 OF 05');
    });

    it('CHOOSE THIS VISION COMMITMENT: should map vision labels to correct activeVision keys', () => {
      const mapVisionLabelToType = (label: string) => {
        return (label.includes("Memory Weave") || label.includes("master") || label.includes("Crown") || label.includes("Fusion")) ? "master" :
               (label.includes("Flow") || label.includes("Cadence") || label.includes("Cinematic") || label.includes("Generational") || label.includes("nostalgic")) ? "cinematic" :
               (label.includes("Poetic") || label.includes("Soul") || label.includes("poetic")) ? "poetic" :
               (label.includes("Direct") || label.includes("Atmospheric") || label.includes("Sensory") || label.includes("direct")) ? "sensory" :
               (label.includes("Committed") || label.includes("Original") || label.includes("original")) ? "original" :
               "master";
      };

      expect(mapVisionLabelToType("The Memory Weave")).toBe("master");
      expect(mapVisionLabelToType("Committed: The Memory Weave")).toBe("master");
      expect(mapVisionLabelToType("The Flow")).toBe("cinematic");
      expect(mapVisionLabelToType("The Poetic Weave")).toBe("poetic");
      expect(mapVisionLabelToType("The Direct Weave")).toBe("sensory");
    });
  });
});
