import { describe, it, expect } from 'vitest';

describe('SoloStage Briefing Suppression on Recorded Memory', () => {
  function shouldTriggerBriefing(params: {
    productionStage: number;
    hasSeenTour: boolean;
    recordedSegments?: any[];
    data?: any;
  }) {
    const { productionStage, hasSeenTour, recordedSegments, data } = params;
    const hasExistingFootage = Boolean(
      (recordedSegments && recordedSegments.length > 0) ||
      data?.videoUrl ||
      (data?.productionTakes && data.productionTakes.length > 0) ||
      data?.isProductionLocked ||
      (data?.productionStage && data.productionStage > 2)
    );

    return productionStage === 2 && !hasSeenTour && !hasExistingFootage;
  }

  it('triggers briefing for brand new memory on Act III (stage 2) without existing footage', () => {
    const result = shouldTriggerBriefing({
      productionStage: 2,
      hasSeenTour: false,
      recordedSegments: [],
      data: {
        id: 'new-memory',
        productionStage: 2,
        status: 'draft',
      }
    });

    expect(result).toBe(true);
  });

  it('suppresses briefing when memory already has videoUrl', () => {
    const result = shouldTriggerBriefing({
      productionStage: 2,
      hasSeenTour: false,
      recordedSegments: [],
      data: {
        id: 'ey96djU6qR1BrDGnvZwp',
        videoUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/master.webm',
        productionStage: 2,
        status: 'pre-release',
      }
    });

    expect(result).toBe(false);
  });

  it('suppresses briefing when memory has recordedSegments in buffer', () => {
    const result = shouldTriggerBriefing({
      productionStage: 2,
      hasSeenTour: false,
      recordedSegments: [{ id: 'take-1', duration: 15 }],
      data: {
        id: 'ey96djU6qR1BrDGnvZwp',
        productionStage: 2,
        status: 'draft',
      }
    });

    expect(result).toBe(false);
  });

  it('suppresses briefing when memory is productionLocked or past Act III', () => {
    const result = shouldTriggerBriefing({
      productionStage: 2,
      hasSeenTour: false,
      data: {
        id: 'ey96djU6qR1BrDGnvZwp',
        isProductionLocked: true,
        productionStage: 4,
      }
    });

    expect(result).toBe(false);
  });
});
