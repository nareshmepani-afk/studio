import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudioState } from './useStudioState';

interface UseCaptureLogicOptions {
  stream: MediaStream | null;
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
}

const speakCount = (count: number) => {
  if (typeof window !== 'undefined' && window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
    window.speechSynthesis.cancel();
    const text = count === 0 ? 'Action' : count.toString();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.3; // Speed up slightly for responsive timing
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    window.speechSynthesis.speak(utterance);
  }
};

export function useCaptureLogic({
  stream,
  startRecording,
  stopRecording,
  isRecording
}: UseCaptureLogicOptions) {
  const [countIn, setCountIn] = useState<number | null>(null);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string>('STUDIO READY');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { actions } = useStudioState();
  const setScrolling = actions ? (actions as any).setScrolling : null;

  const startCapture = useCallback(() => {
    if (!stream) return;

    setIsCountingIn(true);
    setCountIn(5);
    setStatusLabel('Initialising Capture');
    speakCount(5);

    // Ensure teleprompter scrolling is locked during count-in
    if (typeof setScrolling === 'function') {
      setScrolling(false);
    }
  }, [stream, setScrolling]);

  const cancelCapture = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsCountingIn(false);
    setCountIn(null);
    setStatusLabel('STUDIO READY');
    if (isRecording) {
      stopRecording();
    }
    if (typeof setScrolling === 'function') {
      setScrolling(false);
    }
  }, [isRecording, stopRecording, setScrolling]);

  useEffect(() => {
    if (!isCountingIn || countIn === null) return;

    if (countIn > 0) {
      timerRef.current = setTimeout(() => {
        const nextCount = countIn - 1;
        setCountIn(nextCount);
        speakCount(nextCount);

        // UK English Labels:
        // 5s and 4s: "Initialising Capture"
        // 3s, 2s, 1s: "Optimising Stream"
        if (nextCount === 5 || nextCount === 4) {
          setStatusLabel('Initialising Capture');
        } else if (nextCount === 3 || nextCount === 2 || nextCount === 1) {
          setStatusLabel('Optimising Stream');
        } else if (nextCount === 0) {
          setStatusLabel('Recording Active');
        }
      }, 1000);
    } else {
      // Countdown hit 0!
      setIsCountingIn(false);
      setCountIn(null);
      startRecording();

      // Synchronize prompter scroll frame: start scrolling on 0!
      if (typeof setScrolling === 'function') {
        setScrolling(true);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isCountingIn, countIn, startRecording, setScrolling]);

  return {
    countIn,
    isCountingIn,
    statusLabel,
    startCapture,
    cancelCapture
  };
}
