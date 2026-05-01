"use client";

import { useMemo } from 'react';

interface ChargeMetrics {
  text: string;
  anchors: any[]; // Anchors from useDirectorInk
}

export type SensoryType = 'aroma' | 'soundscape' | 'visual' | 'none';

/**
 * useProductionCharge
 * 
 * Calculates the "Scene Clarity" based on text density and sensory richness.
 * 50% comes from word count (target: 30 words)
 * 50% comes from sensory anchors (target: 2 anchors)
 */
export const useProductionCharge = ({ text, anchors }: ChargeMetrics) => {
  return useMemo(() => {
    // 1. Calculate Word Density
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    
    // 50% of the charge comes from having enough volume (target: 30 words)
    const wordWeight = Math.min(wordCount / 30, 1) * 50;
    
    // 2. Calculate Sensory Quality
    // 50% of the charge comes from quality anchors (target: 2 anchors)
    const anchorWeight = Math.min(anchors.length / 2, 1) * 50;
    
    const totalCharge = Math.floor(wordWeight + anchorWeight);
    const isReady = totalCharge >= 100;

    // 3. Calculate Sensory Dominance for Aura
    const sensoryDist = {
      aroma: anchors.filter(a => a.type === 'aroma').length,
      soundscape: anchors.filter(a => a.type === 'soundscape').length,
      visual: anchors.filter(a => a.type === 'visual' || a.type === 'texture').length,
    };

    let dominantType: SensoryType = 'none';
    const maxVal = Math.max(sensoryDist.aroma, sensoryDist.soundscape, sensoryDist.visual);
    
    if (maxVal > 0) {
      // Prioritize Visual if tied (standard cinematic preference)
      if (sensoryDist.visual === maxVal) dominantType = 'visual';
      else if (sensoryDist.aroma === maxVal) dominantType = 'aroma';
      else dominantType = 'soundscape';
    }

    return { 
      totalCharge, 
      isReady,
      wordCount,
      anchorCount: anchors.length,
      dominantType,
      sensoryDist
    };
  }, [text, anchors]);
};
