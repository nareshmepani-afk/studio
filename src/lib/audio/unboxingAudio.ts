/**
 * Web Audio API Acoustic Synthesizer for Memory Weaver Unboxing Rituals
 * Zero external asset dependencies — 100% reliable across all modern mobile and desktop browsers.
 */

class UnboxingAudioEngine {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Synthesizes a tactile wax seal fracture snap + resonant harmonic Solfeggio chime (528Hz & 792Hz).
   */
  public playWaxSealBreak(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ── 1. TACTILE WAX FRACTURE SNAP (Noise Burst through Bandpass Filter) ──
    const bufferSize = Math.floor(ctx.sampleRate * 0.08); // 80ms noise
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, now);
    bandpass.Q.setValueAtTime(3.0, now);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.45, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    whiteNoise.connect(bandpass);
    bandpass.connect(snapGain);
    snapGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.08);

    // ── 2. RESONANT SOLFEGGIO CHIME (528Hz Transformation & 792Hz Perfect Fifth) ──
    const fundamentalFreq = 528; // 528Hz Solfeggio frequency (transformation / heirloom legacy)
    const harmonicFreq = 792;    // 792Hz (1.5x fifth)

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const chimeGain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(fundamentalFreq, now + 0.02);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(harmonicFreq, now + 0.02);

    // Smooth envelope with warm decay over 1.4 seconds
    chimeGain.gain.setValueAtTime(0.001, now);
    chimeGain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    osc1.connect(chimeGain);
    osc2.connect(chimeGain);
    chimeGain.connect(ctx.destination);

    osc1.start(now + 0.02);
    osc2.start(now + 0.02);
    osc1.stop(now + 1.4);
    osc2.stop(now + 1.4);
  }

  /**
   * Synthesizes an ambient harmonic chime when unmuting ceremony sound.
   */
  public playAmbientChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

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
