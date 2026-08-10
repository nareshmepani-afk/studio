/**
 * UNIFIED STUDIO CONTROL REGISTRY (USCR) - ARCHITECTURAL MATRIX
 * 
 * Single source of truth for all UI button controls, floating hotspots, and overlay state contracts
 * across Acts I through V in Memory Weaver.
 */

export type StudioLayerTarget = 
  | 'sentence_anchors' 
  | 'mentorship_badges' 
  | 'director_ink_underlines'
  | 'tonal_pivot_sparkles'
  | 'stage_controls_dock';

export interface StudioControlStateConfig {
  label: string;
  iconName: string;
  tooltip: string;
  badgeText?: string;
}

export interface StudioControlContract {
  id: string;
  name: string;
  location: 'header' | 'dock' | 'stage_canvas' | 'inline_editor';
  visibleStages: number[]; // Stages 0 (Act I) through 4 (Act V)
  allowWhenLocked: boolean; // Must control remain accessible when Picture Locked?
  affectedLayers: StudioLayerTarget[];
  states: {
    active: StudioControlStateConfig;
    inactive: StudioControlStateConfig;
  };
}

export const STUDIO_CONTROL_MATRIX: Record<string, StudioControlContract> = {
  HS_HEADER_CLEAN_READ_BTN: {
    id: 'HS_HEADER_CLEAN_READ_BTN',
    name: 'Top Header Clean Read Mode Toggle',
    location: 'header',
    visibleStages: [0, 1, 2, 3, 4],
    allowWhenLocked: true,
    affectedLayers: ['sentence_anchors', 'mentorship_badges', 'director_ink_underlines', 'tonal_pivot_sparkles'],
    states: {
      active: {
        label: 'Clean Read',
        iconName: 'BookOpen',
        tooltip: 'Clean Read Mode Active (Icons Hidden) • Click to show Sensory Overlays'
      },
      inactive: {
        label: 'Sensory View On',
        iconName: 'Eye',
        tooltip: 'Sensory Overlays Active (Icons Shown) • Click for Clean Read Mode'
      }
    }
  },

  HS_ACT1_CLEAN_VIEW_BTN: {
    id: 'HS_ACT1_CLEAN_VIEW_BTN',
    name: 'Stage Controls Dock Clean Read Mode Toggle',
    location: 'dock',
    visibleStages: [0],
    allowWhenLocked: true,
    affectedLayers: ['sentence_anchors', 'mentorship_badges', 'director_ink_underlines', 'tonal_pivot_sparkles'],
    states: {
      active: {
        label: 'Clean Read Mode',
        iconName: 'BookOpen',
        tooltip: 'Clean Read Mode Active (Icons Hidden) • Click for Sensory View'
      },
      inactive: {
        label: 'Sensory View On',
        iconName: 'Eye',
        tooltip: 'Sensory Overlays Active (Icons Shown) • Click for Clean Read Mode'
      }
    }
  },

  HS_ACT1_MENTOR_STEP1: {
    id: 'HS_ACT1_MENTOR_STEP1',
    name: 'Act I Mentorship Step 1: Memory Title',
    location: 'inline_editor',
    visibleStages: [0],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Title your Remembrance',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Title your Remembrance',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 1',
        badgeText: '1'
      }
    }
  },

  HS_ACT1_MENTOR_STEP2: {
    id: 'HS_ACT1_MENTOR_STEP2',
    name: 'Act I Mentorship Step 2: Story Hook',
    location: 'inline_editor',
    visibleStages: [0],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Cast the Story Hook',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Cast the Story Hook',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 2',
        badgeText: '2'
      }
    }
  },

  HS_ACT1_MENTOR_STEP3: {
    id: 'HS_ACT1_MENTOR_STEP3',
    name: 'Act I Mentorship Step 3: Seal & Weave Monologue',
    location: 'dock',
    visibleStages: [0],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Seal & Weave Monologue',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Seal & Weave Monologue',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 3',
        badgeText: '3'
      }
    }
  },

  HS_ACT2_MENTOR_STEP1: {
    id: 'HS_ACT2_MENTOR_STEP1',
    name: 'Act II Mentorship Step 1: Select AI Vision Style',
    location: 'stage_canvas',
    visibleStages: [1],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Select AI Vision Style',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Select AI Vision Style',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 1',
        badgeText: '1'
      }
    }
  },

  HS_ACT2_MENTOR_STEP2: {
    id: 'HS_ACT2_MENTOR_STEP2',
    name: 'Act II Mentorship Step 2: Calibrate Teleprompter Speed',
    location: 'stage_canvas',
    visibleStages: [1],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Calibrate Teleprompter Speed & Alignment',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Calibrate Teleprompter Speed & Alignment',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 2',
        badgeText: '2'
      }
    }
  },

  HS_ACT2_MENTOR_STEP3: {
    id: 'HS_ACT2_MENTOR_STEP3',
    name: 'Act II Mentorship Step 3: Launch Recording Studio',
    location: 'dock',
    visibleStages: [1],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Launch Recording Studio',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Launch Recording Studio',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 3',
        badgeText: '3'
      }
    }
  },

  HS_ACT3_MENTOR_STEP1: {
    id: 'HS_ACT3_MENTOR_STEP1',
    name: 'Act III Mentorship Step 1: Position Camera & Check Mic',
    location: 'stage_canvas',
    visibleStages: [2],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Position Camera & Check Mic',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Position Camera & Check Mic',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 1',
        badgeText: '1'
      }
    }
  },

  HS_ACT3_MENTOR_STEP2: {
    id: 'HS_ACT3_MENTOR_STEP2',
    name: 'Act III Mentorship Step 2: Record Your Monologue',
    location: 'stage_canvas',
    visibleStages: [2],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Record Your Monologue',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Record Your Monologue',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 2',
        badgeText: '2'
      }
    }
  },

  HS_ACT3_MENTOR_STEP3: {
    id: 'HS_ACT3_MENTOR_STEP3',
    name: 'Act III Mentorship Step 3: Finalize Footage & Submit Take',
    location: 'dock',
    visibleStages: [2],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Finalize Footage & Submit Take',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Finalize Footage & Submit Take',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 3',
        badgeText: '3'
      }
    }
  },

  HS_ACT4_MENTOR_STEP1: {
    id: 'HS_ACT4_MENTOR_STEP1',
    name: 'Act IV Mentorship Step 1: Preview Recorded Takes',
    location: 'stage_canvas',
    visibleStages: [3],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Preview Recorded Takes',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Preview Recorded Takes',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 1',
        badgeText: '1'
      }
    }
  },

  HS_ACT4_MENTOR_STEP2: {
    id: 'HS_ACT4_MENTOR_STEP2',
    name: 'Act IV Mentorship Step 2: Select Master Take & Retake',
    location: 'stage_canvas',
    visibleStages: [3],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Select Master Take & Retake',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Select Master Take & Retake',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 2',
        badgeText: '2'
      }
    }
  },

  HS_ACT4_MENTOR_STEP3: {
    id: 'HS_ACT4_MENTOR_STEP3',
    name: 'Act IV Mentorship Step 3: Prepare Premiere Cut',
    location: 'dock',
    visibleStages: [3],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Prepare Premiere Cut',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Prepare Premiere Cut',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 3',
        badgeText: '3'
      }
    }
  },

  HS_ACT5_MENTOR_STEP1: {
    id: 'HS_ACT5_MENTOR_STEP1',
    name: 'Act V Mentorship Step 1: Stream to Living Room TV',
    location: 'stage_canvas',
    visibleStages: [4],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Stream to Living Room TV',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Stream to Living Room TV',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 1',
        badgeText: '1'
      }
    }
  },

  HS_ACT5_MENTOR_STEP2: {
    id: 'HS_ACT5_MENTOR_STEP2',
    name: 'Act V Mentorship Step 2: Export Autobiography PDF',
    location: 'stage_canvas',
    visibleStages: [4],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Export Autobiography PDF',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Export Autobiography PDF',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 2',
        badgeText: '2'
      }
    }
  },

  HS_ACT5_MENTOR_STEP3: {
    id: 'HS_ACT5_MENTOR_STEP3',
    name: 'Act V Mentorship Step 3: Share Cinema Package',
    location: 'dock',
    visibleStages: [4],
    allowWhenLocked: true,
    affectedLayers: ['mentorship_badges'],
    states: {
      active: {
        label: 'Share Cinema Package',
        iconName: 'CheckCircle2',
        tooltip: '✓ MENTOR STEP COMPLETED',
        badgeText: '✓'
      },
      inactive: {
        label: 'Share Cinema Package',
        iconName: 'Circle',
        tooltip: 'MENTOR STEP 3',
        badgeText: '3'
      }
    }
  }
};

/**
 * HELPER: Evaluates whether a given control should be visible under active studio conditions.
 */
export function isStudioControlVisible(
  controlId: string, 
  stage: number, 
  isCleanView: boolean, 
  isProductionLocked: boolean
): boolean {
  const contract = STUDIO_CONTROL_MATRIX[controlId];
  if (!contract) return false;

  // 1. Stage restriction check
  if (!contract.visibleStages.includes(stage)) return false;

  // 2. Lock state check
  if (isProductionLocked && !contract.allowWhenLocked) return false;

  // 3. Primary toggle controls (location: 'header' or 'dock') MUST remain visible across both CleanView states
  if (contract.location === 'header' || (contract.location === 'dock' && contract.id.includes('CLEAN_VIEW'))) {
    return true;
  }

  // 4. Clean Read Mode (isCleanView === true) hides floating mentorship badges & canvas overlays
  if (isCleanView && contract.affectedLayers.includes('mentorship_badges')) {
    return false;
  }

  return true;
}
