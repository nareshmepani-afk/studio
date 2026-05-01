'use client';

import { useCallback, useRef, useEffect } from 'react';

/**
 * usePrimaryFocus
 * 
 * A robust "Invisible Guide" hook that ensures the user's focus is automatically directed
 * to the most critical action point. Uses a callback ref to handle asynchronous mounting.
 * 
 * @param condition - Optional condition to trigger focus (e.g., currentStage === 0)
 * @param delay - Optional delay to allow for animations/transitions to settle
 * @param trigger - Optional dependency to re-trigger focus
 */
export function usePrimaryFocus(
  condition: boolean = true,
  delay: number = 300,
  trigger?: any
) {
  const elementRef = useRef<HTMLElement | null>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const clearTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  const focusElement = useCallback(() => {
    const el = elementRef.current;
    if (!el || !condition) return;

    el.focus();
    
    if (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && ['text', 'search', 'url', 'tel', 'password'].includes(el.type))) {
      const input = el as HTMLTextAreaElement | HTMLInputElement;
      const val = input.value;
      input.selectionStart = input.selectionEnd = val.length;
    }
  }, [condition]);

  const triggerFocusSequence = useCallback(() => {
    clearTimeouts();
    if (!condition || !elementRef.current) return;

    // 1. Immediate
    focusElement();
    
    // 2. Progressive attempts
    timeoutRefs.current.push(setTimeout(focusElement, 100));
    timeoutRefs.current.push(setTimeout(focusElement, delay));
    timeoutRefs.current.push(setTimeout(focusElement, 1000)); // Safety net
  }, [condition, delay, focusElement]);

  // Handle trigger changes
  useEffect(() => {
    triggerFocusSequence();
  }, [trigger, triggerFocusSequence]);

  // The callback ref that the component will attach
  const setRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
    if (node) {
      triggerFocusSequence();
    } else {
      clearTimeouts();
    }
  }, [triggerFocusSequence]);

  return setRef;
}
