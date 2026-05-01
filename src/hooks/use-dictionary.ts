'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useDictionary: A high-performance Web Speech API wrapper for 
 * real-time transcription in the Cinematic Studio.
 */
export const useDictionary = (onFinalize?: (text: string) => void) => {
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);
  const onFinalizeRef = useRef(onFinalize);

  useEffect(() => {
    onFinalizeRef.current = onFinalize;
  }, [onFinalize]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        if (final && onFinalizeRef.current) {
          onFinalizeRef.current(final);
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // It's just silence, don't kill the session entirely.
          return;
        }
        console.error('Speech recognition error:', event.error);
        manualStopRef.current = true;
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (!manualStopRef.current && recognitionRef.current) {
          // Restart automatically to maintain continuous dictation across pauses
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        manualStopRef.current = false;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      manualStopRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
  }, []);

  return { 
    interimTranscript, 
    isListening, 
    startListening, 
    stopListening, 
    resetTranscript 
  };
};
