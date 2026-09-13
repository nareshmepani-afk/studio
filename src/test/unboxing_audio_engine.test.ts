import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  unboxingAudio,
  playWaxSealFractureSound,
  playSolfeggioHarmonicChime,
  playWaxCrackAudio
} from '@/lib/audio/unboxingAudio';

describe('MW-231: Web Audio Acoustic Engine Invariant Suite', () => {
  let createdOscillators: any[] = [];
  let createdGains: any[] = [];
  let createdFilters: any[] = [];
  let createdBuffers: any[] = [];
  let createdBufferSources: any[] = [];
  let mockAudioContext: any;

  beforeEach(() => {
    createdOscillators = [];
    createdGains = [];
    createdFilters = [];
    createdBuffers = [];
    createdBufferSources = [];

    mockAudioContext = {
      state: 'running',
      currentTime: 10.0,
      sampleRate: 44100,
      destination: { id: 'destination_node' },
      resume: vi.fn().mockResolvedValue(undefined),
      createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => {
        const buffer = {
          channels,
          length,
          sampleRate,
          channelData: new Float32Array(length),
          getChannelData: vi.fn(() => new Float32Array(length)),
        };
        createdBuffers.push(buffer);
        return buffer;
      }),
      createBufferSource: vi.fn(() => {
        const source = {
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
        createdBufferSources.push(source);
        return source;
      }),
      createBiquadFilter: vi.fn(() => {
        const filter = {
          type: 'lowpass',
          frequency: {
            value: 350,
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          Q: {
            value: 1,
            setValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
        createdFilters.push(filter);
        return filter;
      }),
      createGain: vi.fn(() => {
        const gain = {
          gain: {
            value: 1.0,
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
        createdGains.push(gain);
        return gain;
      }),
      createOscillator: vi.fn(() => {
        const osc = {
          type: 'sine',
          frequency: {
            value: 440,
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          detune: {
            value: 0,
            setValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
        createdOscillators.push(osc);
        return osc;
      }),
    };

    (window as any).AudioContext = vi.fn().mockImplementation(() => mockAudioContext);
    (unboxingAudio as any).ctx = mockAudioContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. AudioContext Initialisation & SSR Safety', () => {
    it('gracefully handles missing window/AudioContext without throwing exceptions', () => {
      (unboxingAudio as any).ctx = null;
      const engine = new (unboxingAudio.constructor as any)();
      expect(() => {
        engine.playWaxSealFractureSound();
        engine.playSolfeggioHarmonicChime();
        engine.playAmbientChime();
        engine.triggerHapticFeedback();
      }).not.toThrow();
    });

    it('resumes suspended AudioContext upon user gesture', async () => {
      mockAudioContext.state = 'suspended';
      await unboxingAudio.resumeAudioContext();
      expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Wax Seal Fracture Sound Acoustics (playWaxSealFractureSound)', () => {
    it('synthesises highpass-filtered noise burst (1200Hz) and low-end parchment thump (120Hz -> 30Hz)', () => {
      playWaxSealFractureSound();

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
      const expectedLength = Math.floor(44100 * 0.08);
      expect(createdBuffers[0].length).toBe(expectedLength);

      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
      const highpass = createdFilters[0];
      expect(highpass.type).toBe('highpass');
      expect(highpass.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 10.0);
      expect(highpass.Q.setValueAtTime).toHaveBeenCalledWith(2.0, 10.0);

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      const thumpOsc = createdOscillators[0];
      expect(thumpOsc.type).toBe('sine');
      expect(thumpOsc.frequency.setValueAtTime).toHaveBeenCalledWith(120, 10.0);
      expect(thumpOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(30, 10.12);
      expect(thumpOsc.start).toHaveBeenCalledWith(10.0);
      expect(thumpOsc.stop).toHaveBeenCalledWith(10.12);

      const snapGain = createdGains[0];
      expect(snapGain.gain.setValueAtTime).toHaveBeenCalledWith(0.45, 10.0);
      expect(snapGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 10.08);
    });

    it('triggers calibrated tactile mobile haptics ([20, 50, 30])', () => {
      const vibrateMock = vi.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
        configurable: true,
      });

      playWaxSealFractureSound();
      expect(vibrateMock).toHaveBeenCalledWith([20, 50, 30]);
    });
  });

  describe('3. Resonant Solfeggio Harmonic Chime Invariants (playSolfeggioHarmonicChime)', () => {
    it('schedules the exact 528Hz triad voices (528.00Hz, 660.00Hz, 792.00Hz) and sparkle overtones', () => {
      playSolfeggioHarmonicChime();

      expect(createdOscillators.length).toBe(5);

      const scheduledFrequencies = createdOscillators.map(
        (osc) => osc.frequency.setValueAtTime.mock.calls[0][0]
      );

      expect(scheduledFrequencies).toContain(528.00);
      expect(scheduledFrequencies).toContain(660.00);
      expect(scheduledFrequencies).toContain(792.00);

      expect(scheduledFrequencies).toContain(1056);
      expect(scheduledFrequencies).toContain(1584);

      const voice1 = createdOscillators.find(
        (osc) => osc.frequency.setValueAtTime.mock.calls[0][0] === 528.00
      );
      expect(voice1.stop).toHaveBeenCalledWith(13.2);
    });

    it('enforces Master Limiter safety ceiling strictly below 0.7 to prevent clipping', () => {
      playSolfeggioHarmonicChime();

      const masterGain = createdGains[0];
      const initialMasterLevel = masterGain.gain.setValueAtTime.mock.calls[0][0];

      expect(initialMasterLevel).toBeLessThan(0.7);
      expect(initialMasterLevel).toBeGreaterThan(0.0);
    });

    it('applies subtle detuning (±3 to 5 cents) for acoustic chorus shimmer', () => {
      playSolfeggioHarmonicChime();

      const detunedOscillators = createdOscillators.filter(
        (osc) => osc.detune.setValueAtTime.mock.calls.length > 0
      );

      expect(detunedOscillators.length).toBeGreaterThanOrEqual(3);
      const detuneValues = detunedOscillators.map(
        (osc) => osc.detune.setValueAtTime.mock.calls[0][0]
      );

      detuneValues.forEach((cents) => {
        expect(Math.abs(cents)).toBeLessThanOrEqual(5);
        expect(Math.abs(cents)).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('4. Backwards Compatibility & Proxy Invariants', () => {
    it('proxies playWaxCrackAudio directly to playWaxSealFractureSound', () => {
      const spy = vi.spyOn(unboxingAudio, 'playWaxSealFractureSound').mockImplementation(() => {});
      playWaxCrackAudio();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('plays both fracture and Solfeggio chime on legacy playWaxSealBreak', () => {
      const snapSpy = vi.spyOn(unboxingAudio, 'playWaxSealFractureSound').mockImplementation(() => {});
      const chimeSpy = vi.spyOn(unboxingAudio, 'playSolfeggioHarmonicChime').mockImplementation(() => {});

      unboxingAudio.playWaxSealBreak();
      expect(snapSpy).toHaveBeenCalledTimes(1);
      expect(chimeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
