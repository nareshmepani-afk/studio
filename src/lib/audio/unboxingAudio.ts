/**
 * Web Audio API Acoustic Synthesiser for Memory Weaver Unboxing Rituals
 * Zero external asset dependencies — 100% reliable across all modern mobile and desktop browsers.
 */

class UnboxingAudioEngine {
  private ctx: AudioContext | null = null;

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          this.ctx = null;
        }
      }
    }
    return this.ctx;
  }

  public async resumeAudioContext(): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Ignore resume errors on unsupported browsers
      }
    }
  }

  public triggerHapticFeedback(pattern: number[] = [20, 50, 30]): void {
    if (typeof window === 'undefined') return;
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Haptic feedback ignored on unsupported/blocked devices
      }
    }
  }

  /**
   * Synthesises an organic wax seal fracture snap:
   * - Highpass-filtered white noise burst (1200Hz) fading out within 80ms
   * - Low-end parchment resonance thump (sine osc 120Hz -> 30Hz exponential drop within 120ms)
   * - Calibrated haptic vibration pulse ([20, 50, 30])
   */
  public playWaxSealFractureSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.resumeAudioContext().catch(() => {});
    const now = ctx.currentTime;

    // ── 1. TACTILE WAX FRACTURE SNAP (Noise Burst through Highpass Filter) ──
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.08)); // 80ms noise
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1200, now);
    highpass.Q.setValueAtTime(2.0, now);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.45, now);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    whiteNoise.connect(highpass);
    highpass.connect(snapGain);
    snapGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.08);

    // ── 2. LOW-END PARCHMENT RESONANCE THUMP ──
    const thumpOsc = ctx.createOscillator();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(120, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.35, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(ctx.destination);

    thumpOsc.start(now);
    thumpOsc.stop(now + 0.12);

    // ── 3. CALIBRATED TACTILE HAPTICS ──
    this.triggerHapticFeedback([20, 50, 30]);
  }

  /**
   * Generates a multi-voice triad anchored on the 528Hz transformation frequency:
   * Voice 1: 528.00Hz (Root)
   * Voice 2: 660.00Hz (Major Third)
   * Voice 3: 792.00Hz (Fifth / Octave Harmonic)
   * With high-frequency sparkle overtones (1056Hz, 1584Hz) and subtle detuning (±3 to 5 cents).
   * Amplitude shaped via exponential decay over 3.2s with a master limiter strictly < 0.7.
   */
  public playSolfeggioHarmonicChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.resumeAudioContext().catch(() => {});
    const now = ctx.currentTime;

    // Master Limiter / Bus Gain (strictly below 0.7 to prevent clipping distortion)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.65, now);
    masterGain.connect(ctx.destination);

    // 528Hz Solfeggio Triad Voices
    const triadVoices = [
      { freq: 528.00, detune: 3, gain: 0.20 },  // Voice 1: Root
      { freq: 660.00, detune: -4, gain: 0.18 }, // Voice 2: Major Third
      { freq: 792.00, detune: 5, gain: 0.18 },  // Voice 3: Fifth
    ];

    triadVoices.forEach(({ freq, detune, gain: peakGain }) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      if (osc.detune) {
        osc.detune.setValueAtTime(detune, now);
      }

      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(peakGain, now + 0.04);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(voiceGain);
      voiceGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 3.2);
    });

    // High-frequency sparkle overtones (1056Hz, 1584Hz) with initial gain 0.05
    const sparkleOvertones = [1056, 1584];
    sparkleOvertones.forEach((freq) => {
      const osc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      sparkleGain.gain.setValueAtTime(0.001, now);
      sparkleGain.gain.linearRampToValueAtTime(0.05, now + 0.06);
      sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc.connect(sparkleGain);
      sparkleGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 2.4);
    });
  }

  /**
   * Backwards-compatible alias for legacy callers.
   * Plays the fracture sound followed by Solfeggio harmonic chimes.
   */
  public playWaxSealBreak(): void {
    this.playWaxSealFractureSound();
    this.playSolfeggioHarmonicChime();
  }

  /**
   * Synthesises an ambient harmonic chime when unmuting ceremony sound.
   */
  public playAmbientChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.resumeAudioContext().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(528, now + 0.3);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.1);
  }
}

export const unboxingAudio = new UnboxingAudioEngine();

/**
 * Procedural wax seal fracture acoustic trigger
 */
export function playWaxSealFractureSound(): void {
  unboxingAudio.playWaxSealFractureSound();
}

/**
 * Resonant Solfeggio 528Hz harmonic triad chime trigger
 */
export function playSolfeggioHarmonicChime(): void {
  unboxingAudio.playSolfeggioHarmonicChime();
}

/**
 * Procedural wax crack audio trigger (backwards compatibility alias)
 */
export function playWaxCrackAudio(): void {
  unboxingAudio.playWaxSealFractureSound();
}
