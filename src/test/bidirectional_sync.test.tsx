import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import {
  NarrativeScriptInput,
  clearDraftScratchpad,
  type ScriptSyncMessage,
} from '@/components/studio/shared/NarrativeScriptInput';

describe('ARCH-MW-136: Bidirectional Cross-Surface Script Sync & Zero-Loss Autosave', () => {
  let originalBroadcastChannel: any;
  let mockChannels: Map<string, Array<{ onmessage?: ((e: any) => void) | null; postMessage: any }>>;

  beforeEach(() => {
    localStorage.clear();
    mockChannels = new Map();

    originalBroadcastChannel = globalThis.BroadcastChannel;
    // Mock BroadcastChannel for hermetic testing in jsdom
    globalThis.BroadcastChannel = class MockBroadcastChannel {
      name: string;
      onmessage: ((e: any) => void) | null = null;

      constructor(name: string) {
        this.name = name;
        const list = mockChannels.get(name) || [];
        list.push(this);
        mockChannels.set(name, list);
      }

      postMessage(data: any) {
        const list = mockChannels.get(this.name) || [];
        list.forEach((target) => {
          if (target !== this && target.onmessage) {
            target.onmessage({ data } as MessageEvent);
          }
        });
      }

      close() {
        const list = mockChannels.get(this.name) || [];
        const filtered = list.filter((ch) => ch !== this);
        mockChannels.set(this.name, filtered);
      }
    } as any;
  });

  afterEach(() => {
    globalThis.BroadcastChannel = originalBroadcastChannel;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. SentenceWrapper Unicode Word-Boundary Tokenizer & Substring Shield', () => {
    it('isolates "parents" anchor without splitting or double-highlighting "Grandparents"', () => {
      // Simulate the exact SentenceWrapper Unicode lookaround regex logic
      const anchors = [{ word: 'parents', type: 'heritage' }];
      const sortedAnchors = [...anchors].sort((a, b) => b.word.length - a.word.length);
      const anchorPattern = sortedAnchors.map((a) => a.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

      const regex = new RegExp(
        `(?<![\\p{L}\\p{N}\\p{M}])(${anchorPattern})(?![\\p{L}\\p{N}\\p{M}])|([^\\p{L}\\p{N}\\p{M}]+)`,
        'gui'
      );

      const inputText = 'Looking back my Grandparents and parents, walking in the courtyard.';
      const tokens = inputText.split(regex).filter((t) => t !== undefined && t !== '');

      // Assert "Grandparents" remains a whole token, not sliced into "Grand" and "parents"
      expect(tokens).toContain('Grandparents');
      expect(tokens).not.toContain('Grand');

      // Assert "parents" is isolated as its own standalone token
      const parentOccurrences = tokens.filter((t) => t.toLowerCase() === 'parents');
      expect(parentOccurrences).toHaveLength(1);

      // Verify token mapping recognizes only the true standalone anchor
      const recognizedAnchors = tokens.filter((token) => {
        const clean = token.toLowerCase();
        return anchors.some((a) => a.word.toLowerCase() === clean);
      });
      expect(recognizedAnchors).toEqual(['parents']);
    });

    it('respects diaspora compound words and diacritics without splitting prefixes or suffixes', () => {
      const anchors = [{ word: 'chai', type: 'aroma' }];
      const sortedAnchors = [...anchors].sort((a, b) => b.word.length - a.word.length);
      const anchorPattern = sortedAnchors.map((a) => a.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

      const regex = new RegExp(
        `(?<![\\p{L}\\p{N}\\p{M}])(${anchorPattern})(?![\\p{L}\\p{N}\\p{M}])|([^\\p{L}\\p{N}\\p{M}]+)`,
        'gui'
      );

      // "masalachai" should NOT be split into "masala" and "chai" when "chai" is the anchor
      const inputText = 'We drank authentic masalachai and morning chai together.';
      const tokens = inputText.split(regex).filter((t) => t !== undefined && t !== '');

      expect(tokens).toContain('masalachai');
      expect(tokens).not.toContain('masala');
      const chaiMatches = tokens.filter((t) => t.toLowerCase() === 'chai');
      expect(chaiMatches).toHaveLength(1);
    });
  });

  describe('2. BroadcastChannel Cross-Surface Synchronization Contract', () => {
    it('dispatches ScriptSyncMessage on user text input with origin instance tagging', () => {
      const handleChange = vi.fn();
      let capturedMessage: ScriptSyncMessage | null = null;

      // Create an external channel to listen for broadcasts
      const externalChannel = new BroadcastChannel('mw_script_sync');
      externalChannel.onmessage = (event: MessageEvent<ScriptSyncMessage>) => {
        capturedMessage = event.data;
      };

      render(
        <NarrativeScriptInput
          value="Initial text"
          onChange={handleChange}
          syncSceneId="part-1-scene-1"
          enableBroadcastSync={true}
          dataTestId="sync-input"
        />
      );

      const textarea = screen.getByTestId('sync-input');
      fireEvent.change(textarea, { target: { value: 'Updated from Fireside' } });

      expect(handleChange).toHaveBeenCalledWith('Updated from Fireside');
      expect(capturedMessage).not.toBeNull();
      const msg = capturedMessage as ScriptSyncMessage | null;
      expect(msg?.sceneId).toBe('part-1-scene-1');
      expect(msg?.prose).toBe('Updated from Fireside');
      expect(msg?.sourceInstanceId).toMatch(/^inst_/);
      expect(typeof msg?.timestamp).toBe('number');

      externalChannel.close();
    });

    it('receives foreign broadcast and updates prose when not focused', () => {
      const handleChange = vi.fn();

      render(
        <NarrativeScriptInput
          value="Original prose"
          onChange={handleChange}
          syncSceneId="part-1-scene-1"
          enableBroadcastSync={true}
          dataTestId="sync-target-input"
        />
      );

      // Broadcast an update from a foreign instance (e.g. Desktop Studio)
      const foreignChannel = new BroadcastChannel('mw_script_sync');
      act(() => {
        foreignChannel.postMessage({
          sceneId: 'part-1-scene-1',
          prose: 'New prose from Desktop Studio',
          sourceInstanceId: 'desk_external_123',
          timestamp: Date.now(),
        } satisfies ScriptSyncMessage);
      });

      expect(handleChange).toHaveBeenCalledWith('New prose from Desktop Studio');
      foreignChannel.close();
    });

    it('ignores foreign broadcast if active editor is focused (Caret Shield Guardrail)', () => {
      const handleChange = vi.fn();

      render(
        <NarrativeScriptInput
          value="Narrator typing in Fireside"
          onChange={handleChange}
          syncSceneId="part-1-scene-1"
          enableBroadcastSync={true}
          dataTestId="shielded-input"
        />
      );

      const textarea = screen.getByTestId('shielded-input');
      // Simulate narrator focusing into the textarea
      fireEvent.focus(textarea);

      const foreignChannel = new BroadcastChannel('mw_script_sync');
      act(() => {
        foreignChannel.postMessage({
          sceneId: 'part-1-scene-1',
          prose: 'Overwriting prose from Desktop',
          sourceInstanceId: 'desk_external_999',
          timestamp: Date.now(),
        } satisfies ScriptSyncMessage);
      });

      // Assert caret shield protected the active typing session
      expect(handleChange).not.toHaveBeenCalledWith('Overwriting prose from Desktop');
      foreignChannel.close();
    });

    it('ignores foreign broadcast intended for a different scene', () => {
      const handleChange = vi.fn();

      render(
        <NarrativeScriptInput
          value="Scene 1 Prose"
          onChange={handleChange}
          syncSceneId="part-1-scene-1"
          enableBroadcastSync={true}
          dataTestId="scene1-input"
        />
      );

      const foreignChannel = new BroadcastChannel('mw_script_sync');
      act(() => {
        foreignChannel.postMessage({
          sceneId: 'part-2-scene-3',
          prose: 'Text for Scene 2',
          sourceInstanceId: 'desk_external_456',
          timestamp: Date.now(),
        } satisfies ScriptSyncMessage);
      });

      expect(handleChange).not.toHaveBeenCalled();
      foreignChannel.close();
    });
  });

  describe('3. Zero-Loss LocalStorage Scratchpad & Rehydration', () => {
    it('saves draft to localStorage on keystroke with scene and user scoping', () => {
      const handleChange = vi.fn();

      render(
        <NarrativeScriptInput
          value=""
          onChange={handleChange}
          syncSceneId="part-1-scene-1"
          userId="user_elder_77"
          enableLocalScratchpad={true}
          dataTestId="scratchpad-input"
        />
      );

      const textarea = screen.getByTestId('scratchpad-input');
      fireEvent.change(textarea, { target: { value: 'My sacred childhood memories under the banyan tree.' } });

      const cached = localStorage.getItem('mw_draft_user_elder_77_part-1-scene-1');
      expect(cached).toBe('My sacred childhood memories under the banyan tree.');
    });

    it('rehydrates buffered draft on mount when cached text is longer than initial value', () => {
      // Pre-seed localStorage with unsaved draft
      localStorage.setItem(
        'mw_draft_part-1-scene-1',
        'Preserved memory text after accidental browser reload.'
      );

      const handleChange = vi.fn();

      render(
        <NarrativeScriptInput
          value=""
          onChange={handleChange}
          syncSceneId="part-1-scene-1"
          enableLocalScratchpad={true}
          dataTestId="rehydrate-input"
        />
      );

      expect(handleChange).toHaveBeenCalledWith(
        'Preserved memory text after accidental browser reload.'
      );
    });

    it('clearDraftScratchpad removes cached draft from localStorage', () => {
      localStorage.setItem('mw_draft_user_1_part-1-scene-1', 'Draft to be cleared');
      expect(localStorage.getItem('mw_draft_user_1_part-1-scene-1')).toBe('Draft to be cleared');

      clearDraftScratchpad('part-1-scene-1', 'user_1');
      expect(localStorage.getItem('mw_draft_user_1_part-1-scene-1')).toBeNull();
    });
  });
});
