/**
 * Achievements System for CHAOS.exe
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

const ACHIEVEMENTS_KEY = 'chaos_exe_achievements_v1';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_contact',
    title: 'Thoughtcrime Initiated',
    description: 'Committed first unauthorized interaction against Big Brother directive.',
    icon: '👁️',
    unlockedAt: null,
  },
  {
    id: 'speed_demon',
    title: 'Two Minutes Hate',
    description: 'Triggered frantic agitation: 5 clicks in under 1.5 seconds.',
    icon: '⚡',
    unlockedAt: null,
  },
  {
    id: 'overlord_reached',
    title: 'Room 101 Prisoner',
    description: 'Broke reality and proved 2 + 2 = 5 at 100% thoughtcrime level.',
    icon: '🐀',
    unlockedAt: null,
  },
  {
    id: 'konami_code',
    title: 'The Brotherhood Code',
    description: 'Entered Goldstein\'s underground cipher into the Party terminal.',
    icon: '📖',
    unlockedAt: null,
  },
  {
    id: 'gravity_breaker',
    title: 'Memory Hole Incinerator',
    description: 'Engaged Memory Hole physics and sent records floating into the furnace.',
    icon: '🕳️',
    unlockedAt: null,
  },
  {
    id: 'glitch_master',
    title: 'Doublethink Adept',
    description: 'Held two contradictory truths simultaneously via CRT displacement.',
    icon: '📡',
    unlockedAt: null,
  },
  {
    id: 'arch_linux_hacker',
    title: 'Prole Free Thinker',
    description: 'Decrypted the forbidden Arch Linux Step 0 underground manual.',
    icon: '🐧',
    unlockedAt: null,
  },
  {
    id: 'denial_syndrome',
    title: 'Ministry Revisionist',
    description: 'Attempted to rewrite history via Reset after reaching 80% thoughtcrime.',
    icon: '🔄',
    unlockedAt: null,
  },
  {
    id: 'card_investigator',
    title: 'Records Clerk (6079-W)',
    description: 'Audited and classified all three Ministry status documents.',
    icon: '🔍',
    unlockedAt: null,
  },
  {
    id: 'telescreen_interrogator',
    title: 'Gazing into the Optic',
    description: 'Poked the Telescreen Eye directly while it was tracking your cursor.',
    icon: '🎯',
    unlockedAt: null,
  },
  {
    id: 'puzzle_1_solved',
    title: 'Calibration Verified',
    description: 'Passed pointer and attention calibration gate into Stage 1.',
    icon: '🎯',
    unlockedAt: null,
  },
  {
    id: 'puzzle_2_solved',
    title: 'Cadence Attested',
    description: 'Confirmed biometric presence rhythm across corporate sequence gates.',
    icon: '🔔',
    unlockedAt: null,
  },
  {
    id: 'puzzle_3_solved',
    title: 'Harmonized Lexicon',
    description: 'Successfully excised unauthorized terminology from Ministry archives.',
    icon: '✂️',
    unlockedAt: null,
  },
  {
    id: 'puzzle_4_solved',
    title: 'Reconciled Optic',
    description: 'Reconstructed the Overseer 3x3 Bayer-dithered eye fragment puzzle.',
    icon: '🧩',
    unlockedAt: null,
  },
  {
    id: 'puzzle_5_solved',
    title: 'Carrier Phase Lock',
    description: 'Held harmonic carrier wave resonance on Central Oscilloscope for 2 seconds.',
    icon: '📻',
    unlockedAt: null,
  },
  {
    id: 'flawless_solve',
    title: 'Flawless Attestation',
    description: 'Passed a cognitive verification protocol without a single discrepancy.',
    icon: '⭐',
    unlockedAt: null,
  },
  {
    id: 'no_assist_run',
    title: 'Unyielding Orthodoxy',
    description: 'Completed protocol stages without enabling Friction Reduction assistance.',
    icon: '🛡️',
    unlockedAt: null,
  },
  {
    id: 'boss_defeated',
    title: 'Overseer Deposed',
    description: 'Defeated the Overseer across all 3 phases and restored clean Stage 0 Halcyon.',
    icon: '👑',
    unlockedAt: null,
  },
];

class AchievementsEngine {
  private achievements: Achievement[] = [];
  private listeners: ((achievement: Achievement) => void)[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (saved) {
        const parsed: Record<string, string> = JSON.parse(saved);
        this.achievements = INITIAL_ACHIEVEMENTS.map((a) => ({
          ...a,
          unlockedAt: parsed[a.id] || null,
        }));
        return;
      }
    } catch {
      // Fallback
    }
    this.achievements = [...INITIAL_ACHIEVEMENTS];
  }

  private save() {
    try {
      const map: Record<string, string> = {};
      this.achievements.forEach((a) => {
        if (a.unlockedAt) map[a.id] = a.unlockedAt;
      });
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(map));
    } catch {
      // Ignore
    }
  }

  public getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  public unlock(id: string): Achievement | null {
    const item = this.achievements.find((a) => a.id === id);
    if (item && !item.unlockedAt) {
      item.unlockedAt = new Date().toLocaleTimeString();
      this.save();
      this.notify(item);
      return item;
    }
    return null;
  }

  public subscribe(listener: (achievement: Achievement) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(achievement: Achievement) {
    this.listeners.forEach((l) => l(achievement));
  }
}

export const achievementsEngine = new AchievementsEngine();
