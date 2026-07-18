import { useEffect, useRef, useCallback, useState } from 'react';

interface UseVocalPartnerOptions {
  voiceLang?: string;
  rate?: number;
  pitch?: number;
}

export function useVocalPartner(options: UseVocalPartnerOptions = {}) {
  const { voiceLang = 'en-US', rate = 1.0, pitch = 1.0 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Instantly kill stuck vocal tracks on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakCue = useCallback((text: string, onComplete?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      console.warn('[useVocalPartner] Speech Synthesis API unavailable');
      onComplete?.();
      return;
    }

    // Cancel any ongoing speech before starting a new cue
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang === voiceLang || v.lang.startsWith(voiceLang.split('-')[0]));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      onComplete?.();
    };

    utterance.onerror = (event) => {
      console.error('[useVocalPartner] Speech Synthesis Error:', event);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      onComplete?.();
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voiceLang, rate, pitch]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  return {
    isSpeaking,
    speakCue,
    stopSpeaking
  };
}
