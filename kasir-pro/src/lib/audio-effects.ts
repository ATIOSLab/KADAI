/**
 * Web Audio API Synthesis Engine for KADAI POS & KDS
 * Synthesizes crisp, latency-free audio cues entirely in-browser
 * Zero external MP3 asset dependency - 100% resilient
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Crisp POS Barcode Scanner Beep
   * Short 1400Hz frequency tone (50ms)
   */
  public playScannerBeep(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio autoplay policy fail-safe
    }
  }

  /**
   * Dual-Chime Kitchen Order Bell (G5 + C6 Chord)
   * Resonates like a pleasant brass bell to alert busy chefs
   */
  public playKitchenChime(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: 784 Hz (G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Note 2: 1046.5 Hz (C6) with slight delay
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1046.5, now + 0.08);
      gain2.gain.setValueAtTime(0.15, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.7);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.85);
    } catch {
      // Audio autoplay policy fail-safe
    }
  }

  /**
   * Cash Register Drawer Kick & Transaction Ding
   * Double ratchet click followed by affirmative ding
   */
  public playCashRegisterDing(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Ding tone (E6 ~ 1318.5 Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1318.51, now);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Audio autoplay policy fail-safe
    }
  }

  /**
   * Low Buzz Warning Sound (Void, Error, Reject)
   */
  public playWarningBuzz(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio fail-safe
    }
  }
}

export const soundEffects = new AudioEngine();
