import { useState, useEffect } from 'react';

/**
 * 📱 Smart Viewport & Foldable Device Detection Hook
 *
 * Canonical Standard established in ProductionDeckContainer.tsx (MW-84 / commit a97fde96):
 * - Standard portrait phones have narrow aspect ratios (< 0.85) and width < 768px.
 * - Unfolded foldables (e.g., Samsung Galaxy Z Fold, Pixel Fold) have width >= 600px
 *   and near-square or landscape aspect ratios (>= 0.85).
 * - Standard tablets (iPads) and desktops have width >= 768px.
 *
 * Listens to both 'resize' and 'orientationchange' events for immediate response
 * when a user folds or unfolds their device.
 */
export interface FoldableCanvasState {
  width: number;
  height: number;
  aspectRatio: number;
  isFoldableOrTabletCanvas: boolean;
  isLargeScreen: boolean;
}

export function useFoldableCanvas(): FoldableCanvasState {
  const [canvasState, setCanvasState] = useState<FoldableCanvasState>({
    width: 0,
    height: 0,
    aspectRatio: 0,
    isFoldableOrTabletCanvas: false,
    isLargeScreen: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const evaluate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight || 1;
      const aspectRatio = width / height;

      // Unfolded foldables (e.g., Z Fold) have width >= 600px and near-square/landscape aspect ratios (>= 0.85)
      const isFoldableOrTabletCanvas = width >= 600 && aspectRatio >= 0.85;
      const isLargeScreen = width >= 768 || isFoldableOrTabletCanvas;

      setCanvasState({
        width,
        height,
        aspectRatio,
        isFoldableOrTabletCanvas,
        isLargeScreen,
      });
    };

    evaluate();
    window.addEventListener('resize', evaluate);
    window.addEventListener('orientationchange', evaluate);

    return () => {
      window.removeEventListener('resize', evaluate);
      window.removeEventListener('orientationchange', evaluate);
    };
  }, []);

  return canvasState;
}

export default useFoldableCanvas;
