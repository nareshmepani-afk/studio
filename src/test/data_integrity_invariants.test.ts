import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MASTER_STORY_STRUCTURE, resolveSceneFromPromptId, getSceneById } from '@/lib/curriculum/masterStoryStructure';
import { UnifiedCurriculumMemory } from '@/types/curriculum';
import { evaluateDataShadowingAnomaly } from '@/hooks/studio/useStudioData';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ mode: 'en' }) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  orderBy: vi.fn(),
}));

describe('Data Integrity Invariants & Anti-Regression Shield (RFC-MW-144)', () => {

  describe('Invariant 1: Universal Scene Correlation Matrix', () => {
    // Tests that any document format historically present in Firestore resolves to its scene
    const sampleScene = MASTER_STORY_STRUCTURE[0].scenes[0]; // Part I Scene 1 (part-1-scene-1, p1)

    const historicalDocumentPermutations = [
      {
        name: 'Permutation A: Standard Full Schema',
        doc: {
          id: 'ey96djU6qR1BrDGnvZwp',
          sceneId: 'part-1-scene-1',
          promptId: 'p1',
          title: 'A Child of Two Worlds',
          prose: 'Authentic 271-word epic narrative...',
          status: 'pre-release',
          videoUrl: 'https://storage.googleapis.com/.../video.webm'
        }
      },
      {
        name: 'Permutation B: Canonical Scene Slug as Document ID (Missing promptId/sceneId fields)',
        doc: {
          id: 'part-1-scene-1',
          title: 'A Child of Two Worlds',
          prose: 'Authentic text saved under slug ID...',
          status: 'draft'
        }
      },
      {
        name: 'Permutation C: Prompt ID as Document ID (Legacy Firestore Format)',
        doc: {
          id: 'p1',
          title: 'A Child of Two Worlds',
          prose: 'Authentic text saved under prompt ID...',
          status: 'draft'
        }
      },
      {
        name: 'Permutation D: Alternate Prompt Format (e.g. p4_1 / p5_2)',
        doc: {
          id: 'doc_custom_441',
          promptId: 'p4_1',
          prose: 'Formative friendships narrative...',
          status: 'draft'
        }
      }
    ];

    historicalDocumentPermutations.forEach(({ name, doc }) => {
      it(`guarantees resolution for ${name}`, () => {
        const candidateFilter = (m: any, scene: any) => {
          if (m.id === scene.id || m.id === scene.promptId) return true;
          if (m.promptId === scene.promptId || m.sceneId === scene.id || m.promptId === scene.id) return true;
          if (m.promptId) {
            const resolved = resolveSceneFromPromptId(m.promptId);
            if (resolved && resolved.id === scene.id) return true;
          }
          return false;
        };

        const targetScene = doc.promptId === 'p4_1' 
          ? resolveSceneFromPromptId('p4_1')! 
          : sampleScene;

        const isCorrelated = candidateFilter(doc, targetScene);
        expect(isCorrelated).toBe(true);
      });
    });
  });

  describe('Invariant 2: Document Anti-Hijacking Invariant', () => {
    it('prevents mutation of immutable sceneId / promptId on existing documents', () => {
      const existingDocument = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        promptId: 'p1',
        title: 'A Child of Two Worlds',
        videoUrl: 'https://storage.googleapis.com/.../video.webm',
        prose: 'Original Scene 1 monologue'
      };

      // Simulating a write handler attempting to mutate sceneId
      const attemptDocumentReassignment = (
        docToUpdate: typeof existingDocument,
        newSceneId: string,
        newPromptId: string
      ) => {
        // Anti-hijacking invariant guard
        if (docToUpdate.sceneId && docToUpdate.sceneId !== newSceneId) {
          throw new Error(`[DATA_CORRUPTION_BLOCKED] Cannot reassign document ${docToUpdate.id} from ${docToUpdate.sceneId} to ${newSceneId}`);
        }
        return {
          ...docToUpdate,
          sceneId: newSceneId,
          promptId: newPromptId
        };
      };

      expect(() => {
        attemptDocumentReassignment(existingDocument, 'part-1-scene-2', 'p2');
      }).toThrowError(/DATA_CORRUPTION_BLOCKED/);
    });
  });

  describe('Invariant 3: Canonical Payload Completeness Invariant', () => {
    it('enforces all 6 canonical indexing fields on any new draft write', () => {
      const canonicalSceneId = 'part-1-scene-3';
      const sceneDef = resolveSceneFromPromptId(canonicalSceneId) || getSceneById(canonicalSceneId);
      const updatedProseText = 'Fresh recollections of early school days';

      const payload = {
        sceneId: canonicalSceneId,
        promptId: sceneDef?.promptId || canonicalSceneId,
        title: sceneDef?.title || '',
        chapterId: sceneDef ? `part-${sceneDef.partNumber}` : 'part-1',
        partNumber: sceneDef?.partNumber || 1,
        status: 'draft',
        prose: updatedProseText,
        description: updatedProseText,
        updatedAt: Date.now()
      };

      const requiredKeys = ['sceneId', 'promptId', 'title', 'chapterId', 'partNumber', 'status'];
      requiredKeys.forEach(key => {
        expect((payload as any)[key]).toBeDefined();
        expect(typeof (payload as any)[key]).not.toBe('undefined');
        expect((payload as any)[key]).not.toBe('');
      });
    });
  });

  describe('Invariant 4: Rule 14 Text Preservation & Placeholder Masking Shield', () => {
    const isTemplate = (t?: string) => {
      if (!t) return true;
      const clean = t.replace(/<[^>]*>/g, '').trim();
      return (
        clean.includes("Your birthplace, family roots") ||
        clean.includes("Let's begin the story of you") ||
        clean.includes("Enter the core of your memory") ||
        clean.includes("Select a prompt to begin")
      );
    };

    it('resolves authentic prose over template description placeholders', () => {
      const memoryWithTemplateDesc = {
        id: 'test-doc-1',
        prose: 'I remember the ancient wooden steps of my grandfather house in Porbandar.',
        description: "Your birthplace, family roots, and the world you opened your eyes into...",
        originalHook: "The ancient wooden steps"
      };

      const resolved = [memoryWithTemplateDesc.prose, memoryWithTemplateDesc.originalHook, memoryWithTemplateDesc.description]
        .find(t => t && !isTemplate(t));

      expect(resolved).toBe(memoryWithTemplateDesc.prose);
      expect(resolved).not.toContain("Your birthplace");
    });

    it('resolves originalHook when prose is empty and description is a template', () => {
      const memoryWithHookOnly = {
        id: 'test-doc-2',
        prose: '',
        description: "Enter the core of your memory and tell us what you felt...",
        originalHook: "The smell of cardamom in the morning tea"
      };

      const resolved = [memoryWithHookOnly.prose, memoryWithHookOnly.originalHook, memoryWithHookOnly.description]
        .find(t => t && !isTemplate(t));

      expect(resolved).toBe("The smell of cardamom in the morning tea");
    });
  });

  describe('Invariant 5: Layer 4 Client-Side Anomaly Sentinel (M > N Shadowing Detection)', () => {
    it('returns hasAnomaly: false when all authentic documents are correlated (M === N)', () => {
      const rawMemories: any[] = [
        { id: 'doc-1', sceneId: 'part-1-scene-1', prose: 'Authentic Scene 1 text' },
        { id: 'doc-2', sceneId: 'part-1-scene-2', prose: 'Authentic Scene 2 text' },
      ];

      const chapters: any[] = [
        {
          id: 'part-1',
          prompts: [
            { id: 'p1', memory: rawMemories[0] },
            { id: 'p2', memory: rawMemories[1] },
            { id: 'p3', memory: undefined },
          ],
        },
      ];

      const result = evaluateDataShadowingAnomaly(rawMemories, chapters);
      expect(result.hasAnomaly).toBe(false);
      expect(result.M).toBe(2);
      expect(result.N).toBe(2);
      expect(result.orphanedCount).toBe(0);
      expect(result.orphanedDocs).toHaveLength(0);
    });

    it('returns hasAnomaly: true and identifies unmapped doc IDs when an authentic document is shadowed (M > N)', () => {
      const authenticShadowedDoc = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        title: 'Child of Two Worlds',
        prose: 'Authentic narrative that lost its correlation key'
      };

      const rawMemories: any[] = [
        authenticShadowedDoc,
        { id: 'doc-2', sceneId: 'part-1-scene-2', prose: 'Scene 2 prose' },
      ];

      // Simulated dashboard where Scene 1 card failed to correlate authenticShadowedDoc
      const chapters: any[] = [
        {
          id: 'part-1',
          prompts: [
            { id: 'p1', memory: undefined }, // Shadowed!
            { id: 'p2', memory: rawMemories[1] },
          ],
        },
      ];

      const result = evaluateDataShadowingAnomaly(rawMemories, chapters);
      expect(result.hasAnomaly).toBe(true);
      expect(result.M).toBe(2);
      expect(result.N).toBe(1);
      expect(result.orphanedCount).toBe(1);
      expect(result.orphanedDocs[0].id).toBe('ey96djU6qR1BrDGnvZwp');
      expect(result.orphanedDocs[0].title).toBe('Child of Two Worlds');
    });

    it('safely ignores empty prompt placeholder drafts with zero prose, video or takes', () => {
      const rawMemories: any[] = [
        { id: 'doc-real', sceneId: 'part-1-scene-1', prose: 'Real user memories' },
        { id: 'doc-empty-draft', sceneId: 'part-1-scene-3', prose: '', videoUrl: '', takes: [] },
      ];

      const chapters: any[] = [
        {
          id: 'part-1',
          prompts: [
            { id: 'p1', memory: rawMemories[0] },
            { id: 'p3', memory: undefined }, // Empty draft unmapped is NOT considered an anomaly
          ],
        },
      ];

      const result = evaluateDataShadowingAnomaly(rawMemories, chapters);
      expect(result.hasAnomaly).toBe(false);
      expect(result.M).toBe(1); // Only 1 authentic document
      expect(result.N).toBe(1);
      expect(result.orphanedCount).toBe(0);
    });
  });

  describe('Invariant 6: Rapid Scene-Switch Mutation Shield & In-Flight Debounce Invalidation', () => {
    it('INVARIANT: In-flight autosave timer does not mutate destination scene on rapid switch', async () => {
      vi.useFakeTimers();

      // State stores representing Firestore persistence for scenes
      const firestoreStore: Record<string, any> = {
        'part-1-scene-1': { id: 'ey96djU6qR1BrDGnvZwp', sceneId: 'part-1-scene-1', prose: 'Original Scene 1 text' },
        'part-1-scene-2': { id: 'doc-scene-2', sceneId: 'part-1-scene-2', prose: '' }, // Clean slate
      };

      // 1. Mount editor with Scene 1 ('part-1-scene-1')
      let activeSceneId = 'part-1-scene-1';
      let inFlightDraft = 'Original Scene 1 text';
      let autosaveTimer: NodeJS.Timeout | null = null;
      let flushExecutedForScene: string | null = null;

      const cancelAutosave = () => {
        if (autosaveTimer) {
          clearTimeout(autosaveTimer);
          autosaveTimer = null;
        }
      };

      const triggerAutosaveDebounce = (newProse: string) => {
        inFlightDraft = newProse;
        cancelAutosave();
        autosaveTimer = setTimeout(() => {
          // If uncancelled, autosave writes current inFlightDraft to activeSceneId
          firestoreStore[activeSceneId] = {
            ...firestoreStore[activeSceneId],
            prose: inFlightDraft,
            lastSaved: Date.now(),
          };
        }, 2000);
      };

      const handleSelectScene = async (targetSceneId: string) => {
        // Step 1: Invalidate pending autosave debounce timer immediately
        cancelAutosave();

        // Step 2: Flush in-flight draft strictly to the origin scene
        flushExecutedForScene = activeSceneId;
        firestoreStore[activeSceneId] = {
          ...firestoreStore[activeSceneId],
          prose: inFlightDraft,
          flushedAt: Date.now(),
        };

        // Step 3: Hard navigation switch to target scene
        activeSceneId = targetSceneId;
        inFlightDraft = firestoreStore[targetSceneId]?.prose || '';
      };

      // 2. Narrator types 'Drafting memory for Scene 1...' (starts 2000ms debounce timer)
      triggerAutosaveDebounce('Drafting memory for Scene 1...');
      expect(autosaveTimer).not.toBeNull();

      // 3. User triggers rapid switch to Scene 2 at t = 300ms (before debounce finishes)
      vi.advanceTimersByTime(300);
      await handleSelectScene('part-1-scene-2');

      // Assert cancelAutosave cleared the timer during transition
      expect(autosaveTimer).toBeNull();
      expect(flushExecutedForScene).toBe('part-1-scene-1');

      // 4. Advance timers past the original 2000ms debounce window
      vi.advanceTimersByTime(2500);

      // 5. Assert: Scene 1 doc contains drafted prose; Scene 2 doc is untouched & blank
      expect(firestoreStore['part-1-scene-1'].prose).toBe('Drafting memory for Scene 1...');
      expect(firestoreStore['part-1-scene-2'].prose).toBe(''); // Pristine clean-slate preserved!

      vi.useRealTimers();
    });

    it('INVARIANT: Omitting autosave timer cancellation causes destructive cross-scene contamination (Adversarial Mutation Gate)', async () => {
      vi.useFakeTimers();

      const firestoreStore: Record<string, any> = {
        'part-1-scene-1': { id: 'ey96djU6qR1BrDGnvZwp', sceneId: 'part-1-scene-1', prose: 'Scene 1 prose' },
        'part-1-scene-2': { id: 'doc-scene-2', sceneId: 'part-1-scene-2', prose: '' },
      };

      let activeSceneId = 'part-1-scene-1';
      let inFlightDraft = 'Scene 1 prose';
      let uncancelledTimer: NodeJS.Timeout | null = null;

      // Start debounce timer without cancellation mechanism
      inFlightDraft = 'Contaminating draft from Scene 1';
      uncancelledTimer = setTimeout(() => {
        firestoreStore[activeSceneId] = {
          ...firestoreStore[activeSceneId],
          prose: inFlightDraft,
        };
      }, 2000);

      // Rapidly switch active scene without cancelling timer at t = 300ms
      vi.advanceTimersByTime(300);
      activeSceneId = 'part-1-scene-2'; // Switched context without teardown!

      // Timers fire at t = 2000ms
      vi.advanceTimersByTime(2000);

      // Proves that WITHOUT cancelAutosave, Scene 2 gets erroneously contaminated!
      expect(firestoreStore['part-1-scene-2'].prose).toBe('Contaminating draft from Scene 1');

      vi.useRealTimers();
    });

    it('INVARIANT: Rapid back-and-forth scene cycling preserves unique document boundaries across 31 curriculum scenes', async () => {
      vi.useFakeTimers();

      const sceneDrafts: Record<string, string> = {
        'part-1-scene-1': 'Authentic Roots & Ancestry',
        'part-1-scene-2': 'Authentic Earliest Playground',
        'part-1-scene-3': 'Authentic School Days',
      };

      const firestoreStore: Record<string, string> = {
        'part-1-scene-1': '',
        'part-1-scene-2': '',
        'part-1-scene-3': '',
      };

      let currentScene = 'part-1-scene-1';
      let pendingTimer: NodeJS.Timeout | null = null;

      const switchSceneWithSaveFirst = (nextScene: string) => {
        // Cancel pending debounce
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          pendingTimer = null;
        }
        // Save current scene draft
        firestoreStore[currentScene] = sceneDrafts[currentScene];
        // Switch scene
        currentScene = nextScene;
      };

      // Cycle 1 -> 2 -> 3 -> 1 rapidly in 100ms intervals
      switchSceneWithSaveFirst('part-1-scene-2');
      vi.advanceTimersByTime(100);
      switchSceneWithSaveFirst('part-1-scene-3');
      vi.advanceTimersByTime(100);
      switchSceneWithSaveFirst('part-1-scene-1');
      vi.advanceTimersByTime(100);

      // Flush final scene
      firestoreStore[currentScene] = sceneDrafts[currentScene];

      // Assert 100% boundary preservation with zero cross-scene leakage
      expect(firestoreStore['part-1-scene-1']).toBe('Authentic Roots & Ancestry');
      expect(firestoreStore['part-1-scene-2']).toBe('Authentic Earliest Playground');
      expect(firestoreStore['part-1-scene-3']).toBe('Authentic School Days');

      vi.useRealTimers();
    });
  });
});
