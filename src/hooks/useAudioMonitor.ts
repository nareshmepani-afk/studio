import { useEffect, useState, useRef } from 'react';
import { CameraErrorDetails } from './useCamera';

/**
 * Maps a linear time-domain RMS/peak amplitude (0..1) onto a broadcast-calibrated
 * logarithmic dBFS meter percentage:
 *  - <= -54 dBFS -> 0%
 *  -    -12 dBFS -> ~78% (healthy speech level on DJI Mic / lapel / USB condensers)
 *  -     -3 dBFS -> ~95%
 *  -      0 dBFS -> 100%
 */
export function mapAmplitudeToBroadcastPercent(amplitude: number): number {
  if (!Number.isFinite(amplitude) || amplitude <= 0.00001) {
    return 0;
  }
  const db = 20 * Math.log10(Math.min(1, amplitude));
  const floorDb = -54;
  if (db <= floorDb) return 0;
  const normalised = (db - floorDb) / (0 - floorDb);
  return Math.max(0, Math.min(100, Math.round(normalised * 100)));
}

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
        console.warn('AudioContext not supported in this environment');
        return;
      }
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended' && typeof audioContext.resume === 'function') {
        audioContext.resume().catch(() => {});
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const timeDomainData = new Float32Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const hasFloatTimeDomain = typeof analyser.getFloatTimeDomainData === 'function';
      const byteTimeDomain = new Uint8Array(analyser.fftSize);

      const updateMonitor = () => {
        if (!analyserRef.current || !audioContextRef.current) return;

        if (audioContextRef.current.state === 'suspended' && typeof audioContextRef.current.resume === 'function') {
          audioContextRef.current.resume().catch(() => {});
        }

        // Compute true time-domain RMS & peak for accurate broadcast dBFS voice metering
        let sumSquares = 0;
        let peak = 0;
        if (hasFloatTimeDomain) {
          analyserRef.current.getFloatTimeDomainData(timeDomainData);
          for (let i = 0; i < timeDomainData.length; i++) {
            const sample = Math.abs(timeDomainData[i]);
            sumSquares += sample * sample;
            if (sample > peak) peak = sample;
          }
          const rms = Math.sqrt(sumSquares / timeDomainData.length);
          const effectiveAmplitude = Math.max(rms * 1.4, peak * 0.75);
          setVolume(mapAmplitudeToBroadcastPercent(effectiveAmplitude));
        } else {
          analyserRef.current.getByteTimeDomainData(byteTimeDomain);
          for (let i = 0; i < byteTimeDomain.length; i++) {
            const sample = Math.abs((byteTimeDomain[i] - 128) / 128);
            sumSquares += sample * sample;
            if (sample > peak) peak = sample;
          }
          const rms = Math.sqrt(sumSquares / byteTimeDomain.length);
          const effectiveAmplitude = Math.max(rms * 1.4, peak * 0.75);
          setVolume(mapAmplitudeToBroadcastPercent(effectiveAmplitude));
        }

        // Populate 64 visual waveform bars focused on speech-relevant lower frequency bins
        analyserRef.current.getByteFrequencyData(freqData);
        const wave = new Array<number>(64);
        for (let i = 0; i < 64; i++) {
          const binVal = (freqData[i] ?? 0) / 255;
          wave[i] = Math.min(1, Math.pow(binVal, 0.75));
        }
        setWaveform(wave);

        animationFrameRef.current = requestAnimationFrame(updateMonitor);
      };

      animationFrameRef.current = requestAnimationFrame(updateMonitor);
    } catch (err) {
      console.warn('Failed to initialise Web Audio API:', err);
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
