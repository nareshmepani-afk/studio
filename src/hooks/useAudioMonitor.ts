import { useEffect, useState, useRef } from 'react';
import { CameraErrorDetails } from './useCamera';

export function useAudioMonitor(stream: MediaStream | null, cameraError: CameraErrorDetails | null) {
  const [volume, setVolume] = useState<number>(0);
  const [waveform, setWaveform] = useState<number[]>(new Array(64).fill(0));
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Handle permission errors or empty stream states gracefully
    if (!stream || cameraError?.type === 'permission') {
      setVolume(0);
      setWaveform(new Array(64).fill(0));
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setVolume(0);
      setWaveform(new Array(64).fill(0));
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("AudioContext not supported in this environment");
        return;
      }
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128; // Standard bin count to yield 64 frequency bins
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMonitor = () => {
        if (!analyserRef.current || !audioContextRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Average volume calculation
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avgVolume = bufferLength > 0 ? sum / bufferLength : 0;
        setVolume(Math.min(100, Math.round((avgVolume / 255) * 100)));

        // Normalise waveform values between 0 and 1
        const wave = Array.from(dataArray).map(val => val / 255);
        setWaveform(wave);

        animationFrameRef.current = requestAnimationFrame(updateMonitor);
      };

      animationFrameRef.current = requestAnimationFrame(updateMonitor);
    } catch (err) {
      console.warn("Failed to initialise Web Audio API:", err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream, cameraError]);

  return { volume, waveform };
}
