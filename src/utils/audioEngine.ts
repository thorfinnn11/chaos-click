/**
 * Procedural Web Audio Engine for CHAOS.exe
 * Zero external audio files required. Uses Web Audio API oscillator,
 * gain nodes, noise buffers, and distortion wave shapers.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on the first user interaction
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.25;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.25, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Click sound that gets dirtier, higher pitched, and more unstable as chaos increases
   */
  public playClickSound(chaosLevel: number = 0) {
    try {
      this.init();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Escalating frequency based on chaos (300Hz normal -> 1400Hz overloaded)
      const baseFreq = 260 + (chaosLevel * 10);
      const randomJitter = (Math.random() - 0.5) * (chaosLevel * 6);
      const freq = Math.max(120, baseFreq + randomJitter);

      // Choose wave shape based on chaos stage
      if (chaosLevel < 25) {
        osc.type = 'sine';
      } else if (chaosLevel < 60) {
        osc.type = 'triangle';
      } else if (chaosLevel < 85) {
        osc.type = 'square';
      } else {
        osc.type = 'sawtooth';
      }

      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.4), now + 0.12);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      // Add noise burst at higher chaos
      if (chaosLevel > 40) {
        this.playNoiseBurst(0.05, chaosLevel / 100 * 0.3);
      }

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // AudioContext failure recovery
    }
  }

  /**
   * White noise burst for glitch/corruption events
   */
  public playGlitchBurst() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      this.playNoiseBurst(0.14, 0.45);

      // Fast random pitch blip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(1400, now + 0.04);
      osc.frequency.setValueAtTime(320, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // AudioContext failure recovery
    }
  }

  /**
   * Reality shift / mode change whoosh sound
   */
  public playRealityShift() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.4);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch {
      // recovery
    }
  }

  /**
   * Reboot sound on reset
   */
  public playResetJingle() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const notes = [330, 440, 554, 659, 880];
      notes.forEach((note, index) => {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime + (index * 0.06);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.16);
      });
    } catch {
      // recovery
    }
  }

  /**
   * Orwellian Two Minutes Hate / Surveillance Alert ping
   */
  public playSurveillanceAlert() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.29);
      this.playNoiseBurst(0.08, 0.2);
    } catch {
      // recovery
    }
  }

  /**
   * Full stage 5 / Overlord fanfare
   */
  public playOverlordTakeover() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      // Dissonant minor second drone
      [110, 116.54, 220, 233.08, 440].forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.25);
      });
    } catch {
      // recovery
    }
  }

  private playNoiseBurst(duration: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }
}

export const audioEngine = new AudioEngine();
