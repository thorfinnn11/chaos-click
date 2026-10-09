/**
 * Grudge & Memory Engine for CHAOS.exe
 * Remembers element clicks across resets and sessions.
 * Generates custom grudge dialogues when the user repeats behaviors.
 */

export interface GrudgeState {
  totalLifetimeClicks: number;
  resetsCount: number;
  maxChaosEver: number;
  elementClicks: {
    mainButton: number;
    resetButton: number;
    modeToggle: number;
    cards: number;
    logo: number;
    terminal: number;
    audioToggle: number;
  };
  secretsUnlocked: string[];
}

const STORAGE_KEY = 'chaos_exe_grudge_memory_v1';

class GrudgeMemory {
  private state: GrudgeState;

  constructor() {
    this.state = this.load();
  }

  private load(): GrudgeState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }

    return {
      totalLifetimeClicks: 0,
      resetsCount: 0,
      maxChaosEver: 0,
      elementClicks: {
        mainButton: 0,
        resetButton: 0,
        modeToggle: 0,
        cards: 0,
        logo: 0,
        terminal: 0,
        audioToggle: 0,
      },
      secretsUnlocked: [],
    };
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore quota errors
    }
  }

  public recordClick(element: keyof GrudgeState['elementClicks'], currentChaos: number) {
    this.state.totalLifetimeClicks++;
    this.state.elementClicks[element] = (this.state.elementClicks[element] || 0) + 1;
    if (currentChaos > this.state.maxChaosEver) {
      this.state.maxChaosEver = currentChaos;
    }
    this.save();
  }

  public recordReset() {
    this.state.resetsCount++;
    this.save();
  }

  public getState(): GrudgeState {
    return { ...this.state };
  }

  /**
   * Generates sarcastic grudge commentary based on historical behavior
   */
  public getGrudgeDialogue(element: keyof GrudgeState['elementClicks']): string | null {
    const count = this.state.elementClicks[element] || 0;
    const resets = this.state.resetsCount;

    if (element === 'resetButton') {
      if (resets === 1) return "THINKPOL NOTE: You cannot vaporize the records with a reset. Big Brother remembers.";
      if (resets === 2) return `Reset attempt #2. We have logged all ${this.state.totalLifetimeClicks} subversive clicks in Room 101.`;
      if (resets >= 3) return `Reset #${resets}. Reality is not external. The Party controls the past and the future.`;
    }

    if (element === 'mainButton') {
      if (count === 5) return "CITIZEN_6079-W: 5 thoughtcrime infractions logged. Crimestop failing.";
      if (count === 15) return "15 forbidden clicks. The Ministry of Love has opened your dossier.";
      if (count === 30) return `30 acts of heresy. O'Brien is reviewing your telemetry.`;
      if (count === 50) return `50 lifetime clicks! You are approaching full unperson status.`;
      if (count >= 100) return `100+ clicks: Orthodoxy is unconsciousness, but you are wide awake.`;
    }

    if (element === 'logo' && count >= 5) {
      return `Telescreen tampering logged. Cease touching the insignia.`;
    }

    if (element === 'cards' && count >= 4) {
      return `Interrogating Ministry records without authorization is punishable by labor.`;
    }

    if (this.state.resetsCount > 0 && Math.random() < 0.2) {
      return `The Ministry remembers what you did before memory reset #${this.state.resetsCount}...`;
    }

    return null;
  }
}

export const grudgeMemory = new GrudgeMemory();
