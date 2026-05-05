import { useCallback } from 'react';

export const useAudioFeedback = () => {
  const playSound = useCallback((type: 'snap' | 'error' | 'latch') => {
    const file = type === 'snap' ? 'mechanical-snap.mp3' : type === 'error' ? 'mechanical-buzz.mp3' : 'mechanical-latch.mp3';
    const audio = new Audio(`/assets/sfx/${file}`);
    audio.volume = type === 'error' ? 0.3 : 0.4;
    audio.play().catch(e => console.warn(`Audio blocked: ${file}`, e));
  }, []);

  return {
    playSnap: () => playSound('snap'),
    playError: () => playSound('error'),
    playLatch: () => playSound('latch'),
  };
};
