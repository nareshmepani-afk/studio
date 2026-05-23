import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';
import { ScriptBlock, Catalyst, CatalystType } from '@/types';

export const useStoryScript = (initialBlocks: ScriptBlock[]) => {
  const [blocks, setBlocks] = useState<ScriptBlock[]>(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      return initialBlocks.map(b => ({
        ...b,
        id: b.id && b.id.trim() !== "" ? b.id : uuidv4()
      }));
    }
    // Stable placeholder for hydration safety
    return [{ id: 'initial-block', type: 'hook', text: '', catalysts: [] }];
  });
  
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      const firstId = initialBlocks[0].id;
      return firstId && firstId.trim() !== "" ? firstId : null;
    }
    return null;
  });

  // Ensure first block is focused if none is set
  useEffect(() => {
    if (!focusedBlockId && blocks.length > 0) {
      setFocusedBlockId(blocks[0].id);
    }
  }, [blocks, focusedBlockId]);

  // 1. Update Prose within a block
  const updateBlockText = useCallback((id: string, text: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, text } : block
    ));
  }, []);

  // 2. The "Smart Deploy" Logic (with Collision Detection)
  const addCatalyst = useCallback((blockId: string, type: CatalystType, value?: string) => {
    let collisionDetected = false;

    setBlocks(prev => prev.map(block => {
      if (block.id === blockId) {
        if (block.catalysts.length >= 3) {
          collisionDetected = true;
          return block; // Don't add the 4th catalyst
        }
        const newCatalyst: Catalyst = {
          id: uuidv4(),
          type,
          value: value || '',
          timestamp: Date.now(),
        };
        return { ...block, catalysts: [...block.catalysts, newCatalyst] };
      }
      return block;
    }));

    return { collisionDetected };
  }, []);

  // 3. The "Block Split" (Triggered by Enter key)
  const splitBlock = useCallback((id: string, cursorPosition: number) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index === -1) return prev;

      const currentBlock = prev[index];
      const textBefore = currentBlock.text.slice(0, cursorPosition);
      const textAfter = currentBlock.text.slice(cursorPosition);

      const newBlock: ScriptBlock = {
        id: uuidv4(),
        type: 'beat',
        text: textAfter,
        catalysts: [],
      };

      const updatedBlocks = [...prev];
      updatedBlocks[index] = { ...currentBlock, text: textBefore };
      updatedBlocks.splice(index + 1, 0, newBlock);

      setFocusedBlockId(newBlock.id); // Move focus to the new "Frame"
      return updatedBlocks;
    });
  }, []);

  // 4. The "Block Merge" (Triggered by Backspace at start of block)
  const mergeWithPrevious = useCallback((id: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index <= 0) return prev; // Cannot merge the first block

      const prevBlock = prev[index - 1];
      const currentBlock = prev[index];

      const updatedBlocks = [...prev];
      updatedBlocks[index - 1] = {
        ...prevBlock,
        text: prevBlock.text + currentBlock.text,
        catalysts: [...prevBlock.catalysts, ...currentBlock.catalysts].slice(0, 3), // Keep max 3
      };
      updatedBlocks.splice(index, 1);

      setFocusedBlockId(prevBlock.id);
      return updatedBlocks;
    });
  }, []);

  // 5. Bulk Insert (Handle Pastes)
  const bulkInsertBlocks = useCallback((id: string, texts: string[]) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index === -1) return prev;

      const currentBlock = prev[index];
      const newBlocks: ScriptBlock[] = texts.map((text, i) => ({
        id: uuidv4(),
        type: (index === 0 && i === 0) ? 'hook' : 'beat',
        text: text.trim(),
        catalysts: [],
      }));

      const updatedBlocks = [...prev];
      // Replace the current block with the first pasted block, or insert all if current is empty
      if (currentBlock.text.trim() === '') {
        updatedBlocks.splice(index, 1, ...newBlocks);
      } else {
        updatedBlocks.splice(index + 1, 0, ...newBlocks);
      }

      setFocusedBlockId(newBlocks[newBlocks.length - 1].id);
      return updatedBlocks;
    });
  }, []);

  // 6. The "Block Reorder" (Drag-and-Drop)
  const reorderBlocks = useCallback((activeId: string, overId: string) => {
    setBlocks((prev) => {
      const oldIndex = prev.findIndex((block) => block.id === activeId);
      const newIndex = prev.findIndex((block) => block.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(prev, oldIndex, newIndex);
      }
      return prev;
    });
  }, []);

  return {
    blocks,
    focusedBlockId,
    setFocusedBlockId,
    updateBlockText,
    addCatalyst,
    splitBlock,
    mergeWithPrevious,
    reorderBlocks,
    bulkInsertBlocks,
    setBlocks
  };
};
