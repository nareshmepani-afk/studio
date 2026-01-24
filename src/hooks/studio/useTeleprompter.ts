import { useState, useCallback, useEffect, useRef } from 'react';

export interface TeleprompterQuestion {
  id: string;
  text: string;
}

export function useTeleprompter(questions: TeleprompterQuestion[] = []) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // Speed in pixels per second
  const [fontSize, setFontSize] = useState(48);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const startScrolling = useCallback(() => {
    setIsScrolling(true);
  }, []);

  const stopScrolling = useCallback(() => {
    setIsScrolling(false);
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const toggleScrolling = useCallback(() => {
    if (isScrolling) {
      stopScrolling();
    } else {
      startScrolling();
    }
  }, [isScrolling, startScrolling, stopScrolling]);

  const increaseSpeed = useCallback(() => {
    setScrollSpeed(speed => Math.min(speed + 0.5, 10));
  }, []);

  const decreaseSpeed = useCallback(() => {
    setScrollSpeed(speed => Math.max(speed - 0.5, 0.5));
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize(size => Math.min(size + 4, 120));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(size => Math.max(size - 4, 12));
  }, []);

  const nextQuestion = useCallback(() => {
    stopScrolling();
    setCurrentQuestionIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= questions.length) {
        return 0; // Loop back to the first question
      }
      return nextIndex;
    });
  }, [questions.length, stopScrolling]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  return {
    isScrolling,
    scrollSpeed,
    fontSize,
    setFontSize,
    currentQuestion,
    currentQuestionIndex,
    startScrolling,
    stopScrolling,
    toggleScrolling,
    increaseSpeed,
    decreaseSpeed,
    increaseFontSize,
    decreaseFontSize,
    nextQuestion,
    setScrollSpeed,
  };
}
