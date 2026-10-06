import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BonusMemoryDrawer } from '@/components/fireside/BonusMemoryDrawer';
import { FiresideCompletedReelCard } from '@/components/fireside/FiresideCompletedReelCard';
import { BonusMemoryNote, UnifiedCurriculumMemory } from '@/types/curriculum';

describe('MW-110: Bonus Memory Recollections CRUD & Centered Panel Ergonomics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. BonusMemoryDrawer Centered Layout & Responsive Positioning', () => {
    it('renders centered dialog container classes on desktop with responsive mobile bottom-sheet', () => {
      render(
        <BonusMemoryDrawer
          isOpen={true}
          onClose={vi.fn()}
          sceneId="part-1-scene-1"
          sceneTitle="A Child of Two Worlds"
          onSaveBonusNote={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
      // Verifies responsive centering: items-end on mobile, sm:items-center sm:justify-center on desktop
      expect(dialog.className).toContain('sm:items-center');
      expect(dialog.className).toContain('justify-center');

      // Verifies card has rounded-3xl and border styling
      const card = dialog.querySelector('.bg-stone-950');
      expect(card).toBeDefined();
      expect(card?.className).toContain('sm:rounded-3xl');
      expect(card?.className).toContain('sm:max-w-xl');
    });

    it('renders in Add mode by default with appropriate titles and actions', () => {
      render(
        <BonusMemoryDrawer
          isOpen={true}
          onClose={vi.fn()}
          sceneId="part-1-scene-1"
          sceneTitle="A Child of Two Worlds"
          onSaveBonusNote={vi.fn()}
        />
      );

      expect(screen.getByText('Add a Bonus Recollection')).toBeDefined();
      expect(screen.getByText('Additive Family Note')).toBeDefined();
      expect(screen.getByText('Save Bonus Recollection to Scene')).toBeDefined();
    });

    it('renders in Edit mode when editingNote is passed: pre-fills fields and displays edit title', async () => {
      const mockNote: BonusMemoryNote = {
        id: 'note_12345',
        authorName: 'Naresh Mepani',
        authorRole: 'family_member',
        text: 'I remember the brass key to the ancestral courtyard.',
        createdAt: new Date().toISOString(),
      };

      const handleUpdate = vi.fn().mockResolvedValue(undefined);
      const handleDelete = vi.fn().mockResolvedValue(undefined);

      render(
        <BonusMemoryDrawer
          isOpen={true}
          onClose={vi.fn()}
          sceneId="part-1-scene-1"
          sceneTitle="A Child of Two Worlds"
          editingNote={mockNote}
          onSaveBonusNote={vi.fn()}
          onUpdateBonusNote={handleUpdate}
          onDeleteBonusNote={handleDelete}
        />
      );

      expect(screen.getByText('Edit Bonus Recollection')).toBeDefined();
      expect(screen.getByText('Edit Family Note')).toBeDefined();

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('I remember the brass key to the ancestral courtyard.');

      const authorInput = screen.getByPlaceholderText('Elder Storyteller') as HTMLInputElement;
      expect(authorInput.value).toBe('Naresh Mepani');

      const roleSelect = screen.getByDisplayValue('Family Member / Listener') as HTMLSelectElement;
      expect(roleSelect.value).toBe('family_member');

      // Check update button
      const updateBtn = screen.getByText('Update Bonus Recollection');
      expect(updateBtn).toBeDefined();

      // Trigger update
      fireEvent.change(textarea, { target: { value: 'Updated: I remember the brass key and lock.' } });
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(handleUpdate).toHaveBeenCalledWith('note_12345', {
          authorName: 'Naresh Mepani',
          authorRole: 'family_member',
          text: 'Updated: I remember the brass key and lock.',
        });
      });
    });

    it('handles 2-step delete confirmation inside BonusMemoryDrawer edit mode', async () => {
      const mockNote: BonusMemoryNote = {
        id: 'note_del_999',
        authorName: 'Elder Storyteller',
        authorRole: 'storyteller',
        text: 'Temporary note to remove.',
        createdAt: new Date().toISOString(),
      };

      const handleDelete = vi.fn().mockResolvedValue(undefined);

      render(
        <BonusMemoryDrawer
          isOpen={true}
          onClose={vi.fn()}
          sceneId="part-1-scene-1"
          sceneTitle="A Child of Two Worlds"
          editingNote={mockNote}
          onSaveBonusNote={vi.fn()}
          onDeleteBonusNote={handleDelete}
        />
      );

      const deleteBtn = screen.getByText('Delete Note');
      expect(deleteBtn).toBeDefined();

      // First click: prompts confirmation
      fireEvent.click(deleteBtn);
      expect(screen.getByText('Confirm Delete Recollection?')).toBeDefined();

      // Second click: triggers deletion
      fireEvent.click(screen.getByText('Confirm Delete Recollection?'));

      await waitFor(() => {
        expect(handleDelete).toHaveBeenCalledWith('note_del_999');
      });
    });
  });

  describe('2. FiresideCompletedReelCard Bonus Recollections Edit & Delete Controls', () => {
    const sampleMemory: UnifiedCurriculumMemory = {
      id: 'mem_123',
      userId: 'usr_test',
      sceneId: 'part-1-scene-1',
      partNumber: 1,
      sceneNumber: 1,
      sceneTitle: 'A Child of Two Worlds',
      originSurface: 'fireside_mobile',
      currentStatus: 'captured',
      prose: 'Full narrative script...',
      originalHook: 'Hook text',
      status: 'completed',
      actsCompleted: ['act1', 'act2', 'act3', 'act4'],
      smartLandingTarget: 'act4',
      takes: [
        {
          id: 'take_1',
          takeNumber: 1,
          source: 'fireside_mobile',
          mediaMode: 'video',
          mediaUrl: 'https://storage.googleapis.com/test.mp4',
          durationSeconds: 45,
          createdAt: new Date().toISOString(),
          label: 'Take 1 (Fireside Mobile)',
          isPreferred: true,
          status: 'master',
        },
      ],
      bonusNotes: [
        {
          id: 'note_001',
          authorName: 'Naresh',
          authorRole: 'storyteller',
          text: 'This I remember vividly from childhood.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'note_002',
          authorName: 'Aunt Meena',
          authorRole: 'family_member',
          text: 'The veranda was full of sunshine that autumn.',
          createdAt: new Date().toISOString(),
        },
      ],
      lastModified: new Date().toISOString(),
    } as unknown as UnifiedCurriculumMemory;

    it('renders Edit and Delete buttons for each saved bonus recollection', () => {
      render(
        <FiresideCompletedReelCard
          sceneId="part-1-scene-1"
          sceneTitle="A Child of Two Worlds"
          sceneMemory={sampleMemory}
          onWatchTheatricalReel={vi.fn()}
          onAddBonusNote={vi.fn()}
          onEditBonusNote={vi.fn()}
          onDeleteBonusNote={vi.fn()}
        />
      );

      expect(screen.getByText('Saved Bonus Memory Recollections (2)')).toBeDefined();
      expect(screen.getByText('This I remember vividly from childhood.')).toBeDefined();
      expect(screen.getByText('The veranda was full of sunshine that autumn.')).toBeDefined();

      // Check edit buttons
      expect(screen.getByTestId('edit-bonus-note-note_001')).toBeDefined();
      expect(screen.getByTestId('edit-bonus-note-note_002')).toBeDefined();

      // Check delete buttons
      expect(screen.getByTestId('delete-bonus-note-note_001')).toBeDefined();
      expect(screen.getByTestId('delete-bonus-note-note_002')).toBeDefined();
    });

    it('invokes onEditBonusNote when clicking Edit on a bonus memory card', () => {
      const handleEdit = vi.fn();

      render(
        <FiresideCompletedReelCard
          sceneId="part-1-scene-1"
          sceneTitle="A Child of Two Worlds"
          sceneMemory={sampleMemory}
          onWatchTheatricalReel={vi.fn()}
          onAddBonusNote={vi.fn()}
          onEditBonusNote={handleEdit}
          onDeleteBonusNote={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('edit-bonus-note-note_001'));
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(sampleMemory.bonusNotes[0]);
    });

    it('supports 2-step inline confirmation before invoking onDeleteBonusNote', () => {
      const handleDelete = vi.fn();

      render(
        <FiresideCompletedReelCard
          sceneId="part-1-scene-1"
          sceneTitle="A Child of Two Worlds"
          sceneMemory={sampleMemory}
          onWatchTheatricalReel={vi.fn()}
          onAddBonusNote={vi.fn()}
          onEditBonusNote={vi.fn()}
          onDeleteBonusNote={handleDelete}
        />
      );

      const deleteBtn = screen.getByTestId('delete-bonus-note-note_001');
      expect(deleteBtn.textContent).toContain('Delete');

      // Click once: enters Confirm? state without deleting
      fireEvent.click(deleteBtn);
      expect(deleteBtn.textContent).toContain('Confirm?');
      expect(handleDelete).not.toHaveBeenCalled();

      // Click second time: invokes deletion
      fireEvent.click(deleteBtn);
      expect(handleDelete).toHaveBeenCalledTimes(1);
      expect(handleDelete).toHaveBeenCalledWith('note_001');
    });
  });
});
