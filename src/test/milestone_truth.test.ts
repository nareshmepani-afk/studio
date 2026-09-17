import { describe, it, expect } from 'vitest';
import {
  resolveMemoryMilestones,
  isActMilestoneCompleted,
  type MemoryMilestones,
} from '@/lib/curriculum/milestoneTruth';
import type { Memory } from '@/types';

describe('Milestone Truth Resolver (Unit & Boundary Shield)', () => {
  describe('Boundary Conditions & Null Safety', () => {
    it('returns all false when memory is null or undefined', () => {
      const nullResult = resolveMemoryMilestones(null);
      expect(nullResult).toEqual({
        hasScript: false,
        hasWeave: false,
        hasRecordedMedia: false,
        hasCompletedCut: false,
        isPublished: false,
      });

      const undefResult = resolveMemoryMilestones(undefined);
      expect(undefResult).toEqual({
        hasScript: false,
        hasWeave: false,
        hasRecordedMedia: false,
        hasCompletedCut: false,
        isPublished: false,
      });

      // Acts 0..4 should all evaluate to false
      for (let actId = 0; actId <= 4; actId++) {
        expect(isActMilestoneCompleted(actId, nullResult)).toBe(false);
        expect(isActMilestoneCompleted(actId, undefResult)).toBe(false);
      }
    });

    it('returns all false for an empty object', () => {
      const result = resolveMemoryMilestones({});
      expect(result.hasScript).toBe(false);
      expect(result.hasWeave).toBe(false);
      expect(result.hasRecordedMedia).toBe(false);
      expect(result.hasCompletedCut).toBe(false);
      expect(result.isPublished).toBe(false);
    });

    it('rejects stub script prose with less than 30 characters', () => {
      const result = resolveMemoryMilestones({
        prose: 'Too short.',
        description: 'Short.',
      });
      expect(result.hasScript).toBe(false);
      expect(isActMilestoneCompleted(0, result)).toBe(false);
    });
  });

  describe('Act I: Inciting Memory / Script Recognition', () => {
    it('resolves hasScript: true when prose is >= 30 characters', () => {
      const result = resolveMemoryMilestones({
        prose: 'This is a genuine autobiographical monologue about growing up in Nairobi and transitioning to London.',
      });
      expect(result.hasScript).toBe(true);
      expect(isActMilestoneCompleted(0, result)).toBe(true);
    });

    it('resolves hasScript: true when description is >= 30 characters', () => {
      const result = resolveMemoryMilestones({
        description: 'A detailed prompt description capturing early childhood memories.',
      });
      expect(result.hasScript).toBe(true);
      expect(isActMilestoneCompleted(0, result)).toBe(true);
    });
  });

  describe('Act II: The Weave Recognition', () => {
    it('resolves hasWeave: true when videoStory is present', () => {
      const result = resolveMemoryMilestones({
        prose: 'Monologue script of substantial length for testing.',
        videoStory: 'Fused narrative combining childhood memories and adult reflections.',
      });
      expect(result.hasWeave).toBe(true);
      expect(isActMilestoneCompleted(1, result)).toBe(true);
    });

    it('resolves hasWeave: true when selectedHook is present', () => {
      const result = resolveMemoryMilestones({
        selectedHook: 'Between two worlds, a journey began.',
      } as any);
      expect(result.hasWeave).toBe(true);
      expect(isActMilestoneCompleted(1, result)).toBe(true);
    });

    it('resolves hasWeave: true when aiTakes contains a master or poetic draft', () => {
      const result = resolveMemoryMilestones({
        aiTakes: {
          master: 'The auteur cinematic treatment of the memory.',
        },
      });
      expect(result.hasWeave).toBe(true);
      expect(isActMilestoneCompleted(1, result)).toBe(true);
    });
  });

  describe('Act III: Media Recording Recognition', () => {
    it('resolves hasRecordedMedia: true when videoUrl is populated', () => {
      const result = resolveMemoryMilestones({
        videoUrl: 'https://storage.googleapis.com/vault/reel.mp4',
      });
      expect(result.hasRecordedMedia).toBe(true);
      expect(isActMilestoneCompleted(2, result)).toBe(true);
    });

    it('resolves hasRecordedMedia: true for audio-only memoirs with audioUrl', () => {
      const result = resolveMemoryMilestones({
        audioUrl: 'https://storage.googleapis.com/vault/voice.webm',
      });
      expect(result.hasRecordedMedia).toBe(true);
      expect(isActMilestoneCompleted(2, result)).toBe(true);
    });

    it('resolves hasRecordedMedia: true when takes array has items', () => {
      const result = resolveMemoryMilestones({
        takes: [{ id: 'take-1', duration: 42 }],
      });
      expect(result.hasRecordedMedia).toBe(true);
      expect(isActMilestoneCompleted(2, result)).toBe(true);
    });

    it('resolves hasRecordedMedia: false when takes is an empty array and URLs are absent', () => {
      const result = resolveMemoryMilestones({
        takes: [],
        productionTakes: [],
        videoUrl: '',
        audioUrl: '',
      });
      expect(result.hasRecordedMedia).toBe(false);
      expect(isActMilestoneCompleted(2, result)).toBe(false);
    });
  });

  describe('Act IV & Act V: Cut Review & Premiere Publication', () => {
    it('requires BOTH recorded media AND review status to complete Act IV (The Cut)', () => {
      // Case A: Recorded media with pre-release status -> Act IV complete
      const completeCut = resolveMemoryMilestones({
        videoUrl: 'https://storage.googleapis.com/vault/take.mp4',
        status: 'pre-release',
      });
      expect(completeCut.hasCompletedCut).toBe(true);
      expect(isActMilestoneCompleted(3, completeCut)).toBe(true);

      // Case B: NO media, even if status erroneously marked 'pre-release' -> Act IV INCOMPLETE
      const falsePreRelease = resolveMemoryMilestones({
        videoUrl: '',
        status: 'pre-release',
      });
      expect(falsePreRelease.hasCompletedCut).toBe(false);
      expect(isActMilestoneCompleted(3, falsePreRelease)).toBe(false);
    });

    it('resolves isPublished: true only when status is published', () => {
      const published = resolveMemoryMilestones({
        videoUrl: 'https://storage.googleapis.com/vault/take.mp4',
        status: 'published',
      });
      expect(published.isPublished).toBe(true);
      expect(isActMilestoneCompleted(4, published)).toBe(true);

      const preRelease = resolveMemoryMilestones({
        videoUrl: 'https://storage.googleapis.com/vault/take.mp4',
        status: 'pre-release',
      });
      expect(preRelease.isPublished).toBe(false);
      expect(isActMilestoneCompleted(4, preRelease)).toBe(false);
    });
  });

  describe('Target Case: Memory ey96djU6qR1BrDGnvZwp Simulation', () => {
    it('truthfully isolates unrecorded draft so Acts I and II are complete while Acts III, IV, and V are incomplete', () => {
      const memoryStub: Partial<Memory> & Record<string, any> = {
        id: 'ey96djU6qR1BrDGnvZwp',
        title: 'Child of Two Worlds',
        prose: 'I was born between two worlds, navigating cultures and continents with curiosity.',
        originalHook: 'Between two worlds, roots began to form.',
        status: 'draft',
        productionStage: 2,
        actsCompleted: ['act1', 'act2'] as any,
        videoUrl: undefined,
        mediaAttachments: [],
      };

      const milestones = resolveMemoryMilestones(memoryStub);

      expect(milestones.hasScript).toBe(true); // Act I (✓)
      expect(milestones.hasWeave).toBe(true);  // Act II (✓)
      expect(milestones.hasRecordedMedia).toBe(false); // Act III (Pending)
      expect(milestones.hasCompletedCut).toBe(false);   // Act IV (Pending)
      expect(milestones.isPublished).toBe(false);      // Act V (Pending)

      expect(isActMilestoneCompleted(0, milestones)).toBe(true);
      expect(isActMilestoneCompleted(1, milestones)).toBe(true);
      expect(isActMilestoneCompleted(2, milestones)).toBe(false);
      expect(isActMilestoneCompleted(3, milestones)).toBe(false);
      expect(isActMilestoneCompleted(4, milestones)).toBe(false);
    });
  });
});
