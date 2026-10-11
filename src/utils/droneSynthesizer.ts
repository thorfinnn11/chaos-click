/**
 * Procedural Generative Drone Synthesizer for CHAOS.exe / Halcyon
 * Generates continuous real-time soundscapes using native Web Audio API:
 * - Stage 0: Gentle, soothing 432Hz corporate meditation harmonic sine wash.
 * - Stage 1-2: Subtle electrical 50/60Hz mains ground hum and light fluorescent buzz.
 * - Stage 3-4: Detuned tritone discordance, pulsing binaural beats, sub-bass throbbing.
 * - Stage 5-6: Unsettling industrial drone, Geiger clicks, resonance filter sweep.
 * Driven strictly read-only by chaos level (0 - 100).
 */

class DroneSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isRunning: boolean = false;

  private masterGain: GainNode | null = null;
  private humGain: GainNode | null = null;
  private calmGain: GainNode | null = null;
  private dreadGain: GainNode | null = null;

  // Oscillators
  private oscHum1: OscillatorNode | null = null;
  private oscHum2: OscillatorNode | null = null;
  private oscCalm1: OscillatorNode | null = null;
  private oscCalm2: OscillatorNode | null = null;
  private oscDread: OscillatorNode | null = null;

  private filterLowPass: BiquadFilterNode | null = null;
  private crackleInterval: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.2, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Low pass filter to control darkness
      this.filterLowPass = this.ctx.createBiquadFilter();
      this.filterLowPass.type = 'lowpass';
      this.filterLowPass.frequency.setValueAtTime(400, this.ctx.currentTime);
      this.filterLowPass.Q.setValueAtTime(3.5, this.ctx.currentTime);
      this.filterLowPass.connect(this.masterGain);

      // Gain buses
      this.calmGain = this.ctx.createGain();
      this.calmGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.calmGain.connect(this.filterLowPass);

      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.humGain.connect(this.filterLowPass);

      this.dreadGain = this.ctx.createGain();
      this.dreadGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.dreadGain.connect(this.filterLowPass);

      // 1. Calm oscillators (corporate wellbeing chime chord: 216Hz & 432Hz)
      this.oscCalm1 = this.ctx.createOscillator();
      this.oscCalm1.type = 'sine';
      this.oscCalm1.frequency.setValueAtTime(216, this.ctx.currentTime);
      this.oscCalm1.connect(this.calmGain);
      this.oscCalm1.start();

      this.oscCalm2 = this.ctx.createOscillator();
      this.oscCalm2.type = 'sine';
      this.oscCalm2.frequency.setValueAtTime(432, this.ctx.currentTime);
      this.oscCalm2.connect(this.calmGain);
      this.oscCalm2.start();

      // 2. Mains Ground Hum (60Hz & 120Hz harmonic)
      this.oscHum1 = this.ctx.createOscillator();
      this.oscHum1.type = 'triangle';
      this.oscHum1.frequency.setValueAtTime(60, this.ctx.currentTime);
      this.oscHum1.connect(this.humGain);
      this.oscHum1.start();

      this.oscHum2 = this.ctx.createOscillator();
      this.oscHum2.type = 'sawtooth';
      this.oscHum2.frequency.setValueAtTime(119.4, this.ctx.currentTime); // Slight 0.6Hz beating
      this.oscHum2.connect(this.humGain);
      this.oscHum2.start();

      // 3. Dread Dissonant Sub Oscillator (Tritone wobble at high chaos)
      this.oscDread = this.ctx.createOscillator();
      this.oscDread.type = 'sawtooth';
      this.oscDread.frequency.setValueAtTime(42, this.ctx.currentTime);
      this.oscDread.connect(this.dreadGain);
      this.oscDread.start();

      this.isRunning = true;
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.22, this.ctx.currentTime, 0.05);
    }
  }

  public start() {
    this.initContext();
  }

  /**
   * Updates drone parameter balance smoothly based on current chaos (0 to 100)
   */
  public updateChaos(chaos: number) {
    if (!this.isRunning) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const norm = Math.min(1, Math.max(0, chaos / 100));

    // Calm wash fades out as chaos rises
    if (this.calmGain) {
      const calmTarget = Math.max(0.0001, (1 - norm * 1.3) * 0.07);
      this.calmGain.gain.setTargetAtTime(calmTarget, t, 0.1);
    }

    // Mains electrical hum fades in starting around 15% chaos
    if (this.humGain) {
      const humTarget = norm > 0.1 ? Math.min(0.22, (norm - 0.1) * 0.28) : 0.0001;
      this.humGain.gain.setTargetAtTime(humTarget, t, 0.1);
    }

    // Dread low sub-bass tritone screams at > 50% chaos
    if (this.dreadGain) {
      const dreadTarget = norm > 0.45 ? Math.min(0.28, (norm - 0.45) * 0.45) : 0.0001;
      this.dreadGain.gain.setTargetAtTime(dreadTarget, t, 0.15);
    }

    // Open up filter cutoff as decay worsens
    if (this.filterLowPass) {
      const targetCutoff = 240 + Math.pow(norm, 1.8) * 3200;
      this.filterLowPass.frequency.setTargetAtTime(targetCutoff, t, 0.2);
    }

    // Procedural Geiger crackle above 55% chaos
    if (norm > 0.55 && !this.crackleInterval) {
      this.crackleInterval = window.setInterval(() => {
        if (!this.isMuted && Math.random() < norm * 0.4) {
          this.triggerGeigerClick();
        }
      }, 140);
    } else if (norm <= 0.55 && this.crackleInterval) {
      clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }
  }

  private triggerGeigerClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800 + Math.random() * 1200, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  /**
   * Tape-Stop effect on freeze: low-pass closes down, pitch drops to a held stall tone
   */
  public tapeStop() {
    if (!this.ctx || !this.isRunning) return;
    const now = this.ctx.currentTime;

    if (this.filterLowPass) {
      this.filterLowPass.frequency.cancelScheduledValues(now);
      this.filterLowPass.frequency.setValueAtTime(this.filterLowPass.frequency.value, now);
      this.filterLowPass.frequency.exponentialRampToValueAtTime(90, now + 0.75);
    }

    if (this.oscCalm1) {
      this.oscCalm1.frequency.cancelScheduledValues(now);
      this.oscCalm1.frequency.setValueAtTime(this.oscCalm1.frequency.value, now);
      this.oscCalm1.frequency.exponentialRampToValueAtTime(110, now + 0.75);
    }

    if (this.oscHum1) {
      this.oscHum1.frequency.cancelScheduledValues(now);
      this.oscHum1.frequency.setValueAtTime(this.oscHum1.frequency.value, now);
      this.oscHum1.frequency.exponentialRampToValueAtTime(32, now + 0.75);
    }
  }

  /**
   * Tape-Start swoosh on thaw: filter opens back up, oscillators ramp back to normal
   */
  public tapeStart(currentChaos: number = 0) {
    if (!this.ctx || !this.isRunning) return;
    const now = this.ctx.currentTime;

    if (this.oscCalm1) {
      this.oscCalm1.frequency.cancelScheduledValues(now);
      this.oscCalm1.frequency.setValueAtTime(110, now);
      this.oscCalm1.frequency.exponentialRampToValueAtTime(216, now + 0.5);
    }

    if (this.oscHum1) {
      this.oscHum1.frequency.cancelScheduledValues(now);
      this.oscHum1.frequency.setValueAtTime(32, now);
      this.oscHum1.frequency.exponentialRampToValueAtTime(60, now + 0.5);
    }

    if (this.filterLowPass) {
      this.filterLowPass.frequency.cancelScheduledValues(now);
      this.filterLowPass.frequency.setValueAtTime(90, now);
      this.filterLowPass.frequency.exponentialRampToValueAtTime(2800, now + 0.35);
      this.filterLowPass.frequency.exponentialRampToValueAtTime(800, now + 0.6);
    }

    setTimeout(() => {
      this.updateChaos(currentChaos);
    }, 600);
  }
}

export const droneSynthesizer = new DroneSynthesizer();
