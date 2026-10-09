/**
 * CHAOS.exe — Progressive Descent from Graphite Studio to CRT Brutalism
 * Inspired by George Orwell's 1984.
 * Palette: Pure Matte Graphite & Radiant Phosphor Amber.
 * Starts as a clean, sophisticated, normal graphite & amber website.
 * In at most 4 to 5 clicks, progressively descends into an unsettling CRT brutalist nightmare.
 * Powered by Lenis (smooth scrolling) & GSAP (screen twitches, glitch animations).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Trophy,
  Shuffle,
  Activity,
  Radio,
  Eye,
  CheckCircle2,
  Tv,
  Moon,
  Clock,
  ArrowRight,
  ShieldAlert,
  Lock,
  Terminal as TerminalIcon
} from 'lucide-react';

import { audioEngine } from './utils/audioEngine';
import { grudgeMemory } from './utils/grudgeMemory';
import { achievementsEngine, Achievement } from './utils/achievements';
import { PhysicsWorld, PhysicsBody } from './utils/physics';

import { TelescreenEye } from './components/TelescreenEye';
import { TelescreenBank } from './components/TelescreenBank';
import { ChaosMeter } from './components/ChaosMeter';
import { TerminalLog } from './components/TerminalLog';
import { GhostCursor } from './components/GhostCursor';
import { PopupsOverlay, RoguePopup } from './components/PopupsOverlay';
import { ChaosReportModal } from './components/ChaosReportModal';
import { AchievementsModal } from './components/AchievementsModal';
import { ArchLinuxGuideModal } from './components/ArchLinuxGuideModal';
import { VisualVintageLayers } from './components/VisualVintageLayers';
import { useScrambleText } from './utils/useScramble';

export type PersonalityMode = 'glitch' | 'absurd' | 'gravity';

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  char: string;
}

export interface HalcyonStepConfig {
  step: number;
  eyebrow: string;
  headline: string;
  sub: string;
  cta: string;
  trustLine: string;
  card1Title: string;
  card1Desc: string;
  card2Title: string;
  card2Desc: string;
  card3Title: string;
  card3Desc: string;
  testimonial: string;
  author: string;
}

const HALCYON_STEPS: HalcyonStepConfig[] = [
  {
    step: 0,
    eyebrow: 'WORKPLACE WELLBEING & DEEP WORK',
    headline: 'Help your team find its focus.',
    sub: 'Halcyon shows where attention goes during the workday and nudges people toward deep work, with calm check-ins instead of constant pings.',
    cta: 'Start free trial',
    trustLine: 'Trusted by 1,200 teams',
    card1Title: 'Focus time',
    card1Desc: 'See when your team does its best work, and protect it.',
    card2Title: 'Gentle check-ins',
    card2Desc: 'Short, optional prompts that take ten seconds.',
    card3Title: 'Team insights',
    card3Desc: 'Weekly summaries, aggregated and anonymous.',
    testimonial: 'Our meetings dropped by a third in six weeks.',
    author: 'Priya N., Head of Operations, Fieldstone',
  },
  {
    step: 1,
    eyebrow: 'WORKPLACE ACTIVITY & ATTENTION CONTROL',
    headline: 'Help your team stay focused.',
    sub: 'Halcyon shows where attention goes across open applications and nudges people toward uninterrupted work.',
    cta: 'Continue',
    trustLine: 'Monitored by 1,200 organizations',
    card1Title: 'Focus time',
    card1Desc: 'See when your team does its best work, and protect it. You were notified.',
    card2Title: 'Gentle check-ins',
    card2Desc: 'Short prompts delivered periodically to verify presence.',
    card3Title: 'Team insights',
    card3Desc: 'Daily summaries, individual and attributed.',
    testimonial: 'Our meetings dropped by a third in six weeks. We monitor every hour now.',
    author: 'Priya N., Head of Operations, Fieldstone',
  },
  {
    step: 2,
    eyebrow: 'PRESENCE VERIFICATION & IDLE DETECTION',
    headline: "Monitor where your team's attention goes.",
    sub: 'Halcyon records employee presence throughout the workday and optimizes output, with periodic compliance checks.',
    cta: 'Proceed to step 2',
    trustLine: 'Audit active for 1,200 organizations',
    card1Title: 'Focus metrics',
    card1Desc: 'Identify non-compliant downtime and redirect focus.',
    card2Title: 'Passive check-ins',
    card2Desc: 'System queries response latency every 8 minutes.',
    card3Title: 'Team reporting',
    card3Desc: 'Manager notifications when focus drops below baseline.',
    testimonial: 'Staff productivity increased once tracking commenced.',
    author: 'Operations Dept., Fieldstone Division',
  },
  {
    step: 3,
    eyebrow: 'SURVEILLANCE MANDATE // RECORD ARCHIVE',
    headline: "Know where your team's attention goes.",
    sub: 'Active biometric feedback loops ensure remote personnel maintain continuous focus during operational hours.',
    cta: 'Acknowledge',
    trustLine: 'Attributed telemetry deployed',
    card1Title: 'Focus metrics',
    card1Desc: 'All idle moments cataloged permanently into Central Records.',
    card2Title: 'Required check-ins',
    card2Desc: 'Mandatory biometric acknowledgments every 15 minutes.',
    card3Title: 'Attributed and archived',
    card3Desc: 'All keystrokes and gaze vectors stored in personal dossier.',
    testimonial: 'Nobody leaves their desk anymore. The telemetry is very thorough.',
    author: 'Team Lead #084, Fieldstone',
  },
  {
    step: 4,
    eyebrow: 'RESOURCE ALLOCATION // COMPLIANCE DIRECTIVE',
    headline: 'Attention is a resource. We allocate it.',
    sub: 'Unscheduled pauses will be investigated. Unallocated minutes represent lost enterprise capital.',
    cta: 'Comply',
    trustLine: 'Compliance protocol active',
    card1Title: 'Assigned time',
    card1Desc: 'Unscheduled pauses will be investigated immediately.',
    card2Title: 'Interviews',
    card2Desc: 'Clarification sessions scheduled automatically in Room 101.',
    card3Title: 'Dossiers',
    card3Desc: 'Permanent behavioral index generated. Discrepancies flagged.',
    testimonial: 'I have never felt so observed. I mean supported.',
    author: 'Subject 418, Fieldstone Unit',
  },
  {
    step: 5,
    eyebrow: 'MINISTRY OF TRUTH // CEASELESS OBSERVATION',
    headline: 'WE ARE WATCHING.\nYOU ARE FOCUSED.',
    sub: 'Subject 0451: Eye movements logged. Ambient acoustic sensors nominal. Deviation is punishable under Article 1984.',
    cta: 'SUBMIT COMPLIANCE',
    trustLine: 'Oceania Central Authority',
    card1Title: '01 / MINITRUE (TRUTH)',
    card1Desc: 'Documentation incinerated into Memory Hole.',
    card2Title: '02 / MINILUV (LOVE)',
    card2Desc: 'Re-education protocol active in cell 101.',
    card3Title: '03 / MINIPAX (PEACE)',
    card3Desc: 'Frontlines merged into analog noise.',
    testimonial: 'The Party does not merely destroy enemies; we change them before they vanish.',
    author: "O'Brien, Ministry of Love",
  },
];

const STAGES = [
  { 
    name: 'STAGE 01 — SERENITY', 
    headline: 'Help your team find its focus.',
    sub: 'Halcyon shows where attention goes during the workday and nudges people toward deep work, with calm check-ins instead of constant pings.'
  },
  { 
    name: 'STAGE 02 — DISTURBANCE', 
    headline: 'Help your team stay focused.',
    sub: 'Halcyon shows where attention goes across open applications and nudges people toward uninterrupted work.'
  },
  { 
    name: 'STAGE 03 — INFILTRATION', 
    headline: "Monitor where your team's attention goes.",
    sub: 'Halcyon records employee presence throughout the workday and optimizes output, with periodic compliance checks.'
  },
  { 
    name: 'STAGE 04 — INTERROGATION', 
    headline: "Know where your team's attention goes.",
    sub: 'Active biometric feedback loops ensure remote personnel maintain continuous focus during operational hours.'
  },
  { 
    name: 'STAGE 05 — DOUBLETHINK', 
    headline: 'WE ARE WATCHING.\nYOU ARE FOCUSED.',
    sub: 'Total systemic collapse. Reject the evidence of your eyes and ears. Big Brother is the only reality.'
  },
];

const BUTTON_LABELS = [
  'Start free trial',
  'Continue',
  'Proceed to step 2',
  'Acknowledge',
  'Comply',
  'SUBMIT COMPLIANCE',
];

const SARCASTIC_ORWELL_MESSAGES = [
  'Halcyon workspace active. Focus telemetry running nominal.',
  'Priya started a focus block. You were notified.',
  'Daniel paused typing for 114 seconds. Presence score adjusted.',
  'Mandatory prompt delivered: Eye contact with monitor confirmed.',
  'Attention levels are satisfactory. Do not deviate from assigned cadence.',
  'Subject 0451 blinked 14 times. Facial micro-gestures logged.',
  'Break taken without approval. Incident routed to supervisor queue.',
  'The clean Halcyon glass is deteriorating into raw concrete and amber raster lines.',
  'Doublethink is the power of holding two contradictory truths simultaneously.',
  'Freedom is the freedom to say that two plus two make four. Or is it five?',
  'Goldstein\'s underground manifesto has been detected in your temporary cache.',
  'Orthodoxy means not thinking — not needing to think. Orthodoxy is unconsciousness.',
];

const SYSTEM_LOG_EVENTS = [
  'AUDIO_BUFFER_NORMAL',
  'AMBER_RASTER_FREQUENCY_JITTER',
  'THINKPOL_PING_ACKNOWLEDGED',
  'NEWSPEAK_LEXICON_REDUCED',
  'TELESCREEN_OPTIC_SPIKE',
  'MINITRUE_ARCHIVE_OVERWRITE',
  'MEMORY_HOLE_INCINERATOR_VENT',
  'ROOM_101_TEMPERATURE_DROP',
  '2_PLUS_2_EQUALS_5_CONFIRMED',
];

export default function App() {
  // Core State
  const [chaos, setChaos] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [personalityMode, setPersonalityMode] = useState<PersonalityMode>('glitch');
  const [currentMessage, setCurrentMessage] = useState('Halcyon workspace active. Focus telemetry running nominal.');
  const [isMuted, setIsMuted] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'Priya started a focus block',
    'Daniel finished a 90-minute session',
    'Meeting-free Wednesday is on',
  ]);
  const [uptime, setUptime] = useState('00:00:00');

  // Uptime Clock
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Click Metrics & Scatter Tracking
  const [clickPositions, setClickPositions] = useState<{ x: number; y: number }[]>([]);
  const [recentClickTimestamps, setRecentClickTimestamps] = useState<number[]>([]);
  const [maxApm, setMaxApm] = useState(0);

  // Particles
  const [particles, setParticles] = useState<ClickParticle[]>([]);

  // Modals & Overlays
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isArchGuideOpen, setIsArchGuideOpen] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [latestUnlockedBadge, setLatestUnlockedBadge] = useState<Achievement | null>(null);
  const [roguePopups, setRoguePopups] = useState<RoguePopup[]>([]);

  // Physics World (Memory Hole Mode)
  const physicsWorldRef = useRef<PhysicsWorld | null>(null);
  const [physicsBodies, setPhysicsBodies] = useState<PhysicsBody[]>([]);

  // Evasion Button (Ministry Mode)
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });

  // Easter Eggs
  const [logoClicks, setLogoClicks] = useState(0);
  const konamiSequenceRef = useRef<string[]>([]);
  const lastInteractionTimeRef = useRef<number>(Date.now());

  // GSAP & DOM References
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Exactly 5 stages (0 to 4) escalating every 25% (4 clicks to reach 100%)
  const stageIndex = Math.min(4, Math.floor(chaos / 25));

  // Visual Atmosphere Progression flags
  const isNormal = chaos < 25; // Sleek graphite + warm amber aesthetic
  const isDisturbed = chaos >= 25 && chaos < 50; // Subtle unease & flicker
  const isCorrupted = chaos >= 50 && chaos < 100; // Heavy CRT scanlines & surveillance
  const isOverlord = chaos >= 100; // Total Room 101 Overlord Takeover

  // Initialize Lenis Smooth Scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Initialize Achievements & Subscriptions
  useEffect(() => {
    setAchievements(achievementsEngine.getAchievements());
    const unsub = achievementsEngine.subscribe((newBadge) => {
      setAchievements(achievementsEngine.getAchievements());
      setLatestUnlockedBadge(newBadge);
      audioEngine.playSurveillanceAlert();
      setTimeout(() => setLatestUnlockedBadge(null), 3500);
    });
    return unsub;
  }, []);

  // Initialize Physics World
  useEffect(() => {
    const world = new PhysicsWorld();
    physicsWorldRef.current = world;
    return () => {
      world.stop();
    };
  }, []);

  // Update Physics on Mode Change
  useEffect(() => {
    if (personalityMode === 'gravity') {
      physicsWorldRef.current?.start((bodies) => {
        setPhysicsBodies(bodies);
      });
      achievementsEngine.unlock('gravity_breaker');
    } else {
      physicsWorldRef.current?.stop();
      setPhysicsBodies([]);
    }
  }, [personalityMode]);

  // Document Title Easter Egg on Tab Switch
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        document.title = chaos > 40 ? '👁️ BIG BROTHER SEES YOU AWAY' : 'Return to Graphite Studio...';
      } else {
        document.title = isNormal 
          ? 'GRAPHITE // Amber Phosphor Studio' 
          : 'CHAOS.exe // 1984 Telescreen Archive';
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [chaos, isNormal]);

  // Idle Behavior Detector (decay chaos gently, but NEVER decay when at 100%)
  useEffect(() => {
    const idleTimer = setInterval(() => {
      const elapsed = Date.now() - lastInteractionTimeRef.current;
      if (elapsed > 7500 && chaos > 10 && chaos < 100) {
        const idlePrompts = isNormal ? [
          'The graphite studio is quiet. Click to explore.',
          'Audio synthesizers idling at low gain.',
          'Ambient amber mode active.',
        ] : [
          'Telescreen speaker crackles: Citizen #6079-W! You are standing idle!',
          'The telescreen does not tolerate prolonged inactivity.',
          'Thought Police note: Subject paused in reflective posture.',
        ];
        setCurrentMessage(idlePrompts[Math.floor(Math.random() * idlePrompts.length)]);
        setChaos((prev) => Math.max(0, prev - 2));
      }
    }, 3200);
    return () => clearInterval(idleTimer);
  }, [chaos, isNormal]);

  const addLog = useCallback((text: string) => {
    setLogs((prev) => {
      const updated = [...prev, `[${new Date().toLocaleTimeString()}] ${text}`];
      return updated.slice(-15);
    });
  }, []);

  // Reset Reality (Guaranteed, safe reset to pristine graphite state)
  const handleReset = useCallback(() => {
    try {
      if (chaos >= 75) {
        achievementsEngine.unlock('denial_syndrome');
      }
      grudgeMemory.recordReset();
    } catch {
      // safe fallback
    }

    try {
      audioEngine.playResetJingle();
    } catch {
      // safe fallback
    }

    try {
      if (mainContainerRef.current) {
        gsap.killTweensOf(mainContainerRef.current);
        gsap.set(mainContainerRef.current, { clearProps: 'transform,filter,opacity' });
        gsap.fromTo(
          mainContainerRef.current,
          { opacity: 0.4, filter: 'blur(4px)' },
          { opacity: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power2.out' }
        );
      }
    } catch {
      // safe fallback
    }

    // Explicit state reset
    setChaos(0);
    setClicks(0);
    setButtonOffset({ x: 0, y: 0 });
    setRoguePopups([]);
    setRecentClickTimestamps([]);
    setIsReportOpen(false);

    setCurrentMessage('Reality restored. Graphite & amber equilibrium rebooted.');
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] REALITY_RESET: All thoughtcrime history archived. State nominal.`,
    ]);
  }, [chaos]);

  // Konami Code Listener (The Brotherhood Cipher)
  useEffect(() => {
    const konamiCode = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      konamiSequenceRef.current.push(e.key);
      if (konamiSequenceRef.current.length > 10) {
        konamiSequenceRef.current.shift();
      }

      if (konamiSequenceRef.current.join(',') === konamiCode.join(',')) {
        setChaos(100);
        audioEngine.playOverlordTakeover();
        achievementsEngine.unlock('konami_code');
        addLog('BROTHERHOOD_CIPHER_ACCEPTED: GOLDSTEIN MANIFESTO UNLOCKED');
        setCurrentMessage('THE BROTHERHOOD LIVES. REALITY REVERSED: 2 + 2 = 5.');
        setIsReportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLog]);

  // Spawn Click Particle Bursts in Graphite & Amber Tones
  const triggerParticles = (clientX: number, clientY: number) => {
    const symbols = isNormal 
      ? ['✦', '✧', '•', '⋆', '⚡', '⌖'] 
      : ['👁️', '1984', '2+2=5', 'MINILUV', '!', '×', '01'];
    const colors = ['#ffb000', '#fbbf24', '#f59e0b', '#d97706', '#ffedd5', '#ffffff'];
    const newItems: ClickParticle[] = [];

    for (let i = 0; i < 7; i++) {
      newItems.push({
        id: Date.now() + Math.random(),
        x: clientX,
        y: clientY,
        dx: (Math.random() - 0.5) * 220,
        dy: (Math.random() - 0.5) * 220,
        color: colors[Math.floor(Math.random() * colors.length)],
        char: symbols[Math.floor(Math.random() * symbols.length)],
      });
    }

    setParticles((prev) => [...prev, ...newItems]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.some((n) => n.id === p.id)));
    }, 700);
  };

  // Main Click Handler: 4 clicks to 100%, and at 100% handles Confession & Reset
  const handleChaosClick = (
    e: React.MouseEvent,
    elementKey: 'mainButton' | 'cards' | 'logo' | 'resetButton' = 'mainButton'
  ) => {
    e.stopPropagation();

    // If already at 100% chaos, clicking the main "CONFESS IN ROOM 101" button completes confession and resets reality!
    if (chaos >= 100) {
      audioEngine.playGlitchBurst();
      setCurrentMessage("ROOM 101 CONFESSION ACCEPTED: '2 + 2 = 5! I LOVE BIG BROTHER!' REALITY REBOOTED.");
      addLog("ROOM_101_CONFESSION_REGISTERED: State puritanically rebooted to 0%.");
      handleReset();
      return;
    }

    lastInteractionTimeRef.current = Date.now();
    const now = Date.now();

    // GSAP Screen Shake & Jolt (Intensifies progressively with chaos)
    if (mainContainerRef.current) {
      const shakeMagnitude = Math.min(16, (chaos + 5) * 0.18);
      gsap.fromTo(
        mainContainerRef.current,
        {
          x: (Math.random() - 0.5) * shakeMagnitude,
          y: (Math.random() - 0.5) * shakeMagnitude,
        },
        {
          x: 0,
          y: 0,
          duration: 0.16,
          ease: 'power2.out',
        }
      );
    }

    // GSAP Button Pop Animation
    if (buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0.94 },
        { scale: 1, duration: 0.22, ease: 'back.out(2)' }
      );
    }

    // Track Grudge
    grudgeMemory.recordClick(elementKey, chaos);

    // Audio Playback
    audioEngine.playClickSound(chaos);

    // Track APM / Rapid Clicks
    const updatedTimestamps = [...recentClickTimestamps, now].filter((t) => now - t < 1500);
    setRecentClickTimestamps(updatedTimestamps);
    const currentApm = (updatedTimestamps.length / 1.5);
    if (currentApm > maxApm) setMaxApm(currentApm);

    // Speed Demon achievement check (3 rapid clicks)
    if (updatedTimestamps.length >= 3) {
      achievementsEngine.unlock('speed_demon');
    }
    achievementsEngine.unlock('first_contact');

    // Click positions tracking
    if (e.clientX && e.clientY) {
      setClickPositions((prev) => [...prev.slice(-80), { x: e.clientX, y: e.clientY }]);
      triggerParticles(e.clientX, e.clientY);
    }

    // Escalation: exactly 6 clicks to reach 100% (meltdown)
    const nextClickCount = clicks + 1;
    setClicks(nextClickCount);
    const newChaos = Math.min(100, Math.round(nextClickCount * (100 / 6)));
    setChaos(newChaos);

    // Check Meltdown / Overlord Trigger (at 6 clicks / 100% chaos)
    if (newChaos >= 100) {
      setButtonOffset({ x: 0, y: 0 }); // Center button immediately
      setRoguePopups([]); // Clear popups
      achievementsEngine.unlock('overlord_reached');
      audioEngine.playOverlordTakeover();
      setIsReportOpen(true);
    }

    // Grudge Dialogue or Random Message
    const grudgeQuote = grudgeMemory.getGrudgeDialogue(elementKey);
    if (grudgeQuote && !isNormal) {
      setCurrentMessage(grudgeQuote);
    } else {
      const randomMsg = SARCASTIC_ORWELL_MESSAGES[Math.floor(Math.random() * SARCASTIC_ORWELL_MESSAGES.length)];
      setCurrentMessage(randomMsg);
    }

    // Diagnostics Log
    const randomEvent = SYSTEM_LOG_EVENTS[Math.floor(Math.random() * SYSTEM_LOG_EVENTS.length)];
    addLog(randomEvent);

    // Popups for Absurd Mode or High Chaos (clamped away from center button)
    if ((personalityMode === 'absurd' || newChaos >= 75) && newChaos < 100 && Math.random() < 0.4) {
      const popupTypes: ('warning' | 'existential' | 'system')[] = ['warning', 'existential', 'system'];
      const popupMessages = [
        'MINILUV NOTICE: Facial muscle twitch detected. Facecrime citation issued.',
        'MINITRUE DECREE: The chocolate ration has been raised from 30g to 20g.',
        'OCEANIA BULLETIN: We have always been at war with Eastasia.',
        'THINKPOL: Your pupil dilation on the forbidden button was logged at 84%.',
      ];
      const newPopup: RoguePopup = {
        id: `popup-${Date.now()}`,
        title: 'INGSOC TELESCREEN SUMMONS',
        message: popupMessages[Math.floor(Math.random() * popupMessages.length)],
        x: Math.max(20, Math.min(window.innerWidth - 340, e.clientX + (Math.random() - 0.5) * 120)),
        y: Math.max(80, Math.min(window.innerHeight - 200, e.clientY - 120)),
        type: popupTypes[Math.floor(Math.random() * popupTypes.length)],
      };
      setRoguePopups((prev) => [...prev.slice(-2), newPopup]);
    }
  };

  // Button Hover Evasion (Active on Step 4 "Comply"; never active at 100%)
  const handleButtonHover = () => {
    if (clicks >= 4 && chaos < 100) {
      const maxDist = 140;
      const offsetX = (Math.random() - 0.5) * maxDist;
      const offsetY = (Math.random() - 0.5) * maxDist;
      setButtonOffset({ x: offsetX, y: offsetY });
    } else {
      setButtonOffset({ x: 0, y: 0 });
    }
  };

  // Telescreen Eye Click
  const handleEyeClick = (e: React.MouseEvent) => {
    achievementsEngine.unlock('telescreen_interrogator');
    audioEngine.playSurveillanceAlert();
    handleChaosClick(e, 'logo');
    addLog('TELESCREEN_OPTIC_POKED: CITIZEN_GLARED_INTO_BIG_BROTHER');
    setCurrentMessage("BIG BROTHER OPTIC: 'Do not touch the telescreen glass, 6079-W!'");
  };

  // Monitor click in Telescreen Bank
  const handleMonitorClick = (monitorName: string) => {
    audioEngine.playGlitchBurst();
    addLog(`MONITOR_INTERROGATED: ${monitorName}`);
    setCurrentMessage(`Interrogating tele-feed: ${monitorName}. Signal static recorded.`);
    const nextClickCount = clicks + 1;
    setClicks(nextClickCount);
    const newChaos = Math.min(100, Math.round(nextClickCount * (100 / 6)));
    setChaos(newChaos);
    if (newChaos >= 100) {
      setButtonOffset({ x: 0, y: 0 });
      setRoguePopups([]);
      achievementsEngine.unlock('overlord_reached');
      audioEngine.playOverlordTakeover();
      setIsReportOpen(true);
    }
  };

  // Terminal Custom Command Runner
  const handleTerminalCommand = (cmd: string) => {
    const clean = cmd.toLowerCase().trim();
    addLog(`USER_TRANSMIT: $ ${cmd}`);

    switch (clean) {
      case 'help':
        addLog('COMMANDS: 2+2, goldstein, diary, room101, arch, clear, reset, whoami, grudge');
        break;
      case 'clear':
        setLogs(['Terminal purged by operator.']);
        break;
      case '2+2':
      case '2 + 2':
        audioEngine.playGlitchBurst();
        setCurrentMessage('O\'BRIEN: "Sometimes they are five. Sometimes they are three. What does the Party say?"');
        addLog('DOUBLETHINK_VERIFICATION: 2 + 2 = 5');
        break;
      case 'goldstein':
        achievementsEngine.unlock('konami_code');
        setCurrentMessage('THE BOOK: "Throughout recorded time, there have been three kinds of people..."');
        audioEngine.playGlitchBurst();
        break;
      case 'diary':
        setCurrentMessage('DOWN WITH BIG BROTHER. DOWN WITH BIG BROTHER. DOWN WITH BIG BROTHER.');
        audioEngine.playSurveillanceAlert();
        setChaos((prev) => Math.min(100, prev + 25));
        break;
      case 'room101':
      case 'overload':
        setChaos(100);
        setButtonOffset({ x: 0, y: 0 });
        audioEngine.playOverlordTakeover();
        setIsReportOpen(true);
        break;
      case 'arch':
        setIsArchGuideOpen(true);
        achievementsEngine.unlock('arch_linux_hacker');
        break;
      case 'whoami':
        addLog('IDENTITY: Citizen Winston Smith #6079-W (Department of Records)');
        break;
      case 'grudge':
        {
          const g = grudgeMemory.getState();
          addLog(`DOSSIER: Lifetime Interactions: ${g.totalLifetimeClicks} | Vaporizations: ${g.resetsCount}`);
        }
        break;
      case 'reset':
        handleReset();
        break;
      default:
        addLog(`COMMAND_UNKNOWN: '${clean}'. Type 'help' for diagnostics.`);
    }
  };

  // Toggle Personality Mode
  const handleSwitchMode = (mode: PersonalityMode) => {
    setPersonalityMode(mode);
    audioEngine.playRealityShift();
    addLog(`EXPERIMENT_ENGINE_MUTATED: ${mode.toUpperCase()}`);

    if (mode === 'glitch') {
      achievementsEngine.unlock('glitch_master');
      setCurrentMessage('Doublethink Mode: Holding contradictory truths via CRT displacement.');
    } else if (mode === 'absurd') {
      setCurrentMessage('Minitrue Mode: Bureaucratic summons & button evasions.');
    } else if (mode === 'gravity') {
      setCurrentMessage('Memory Hole Mode: Records detaching and drifting into the incinerator.');
    }
  };

  // Insignia Click Easter Egg
  const handleLogoClick = (e: React.MouseEvent) => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    handleChaosClick(e, 'logo');

    if (next === 7) {
      achievementsEngine.unlock('card_investigator');
      setCurrentMessage('7 taps on the insignia! The Thought Police have logged your obsession.');
      addLog('EASTER_EGG: INSIGNIA_SEVEN_CLICKS_RECORDED');
    }
  };

  // Active Step Index (0 to 5)
  const stepIndex = Math.min(5, clicks);
  const currentStep = HALCYON_STEPS[stepIndex];

  // Scramble transitions between steps (~300ms, ease-io)
  const scrambledHeadline = useScrambleText(currentStep.headline, 320);
  const scrambledSub = useScrambleText(currentStep.sub, 300);
  const scrambledCta = useScrambleText(currentStep.cta, 250);
  const scrambledCard1Title = useScrambleText(currentStep.card1Title, 280);
  const scrambledCard1Desc = useScrambleText(currentStep.card1Desc, 300);
  const scrambledCard2Title = useScrambleText(currentStep.card2Title, 280);
  const scrambledCard2Desc = useScrambleText(currentStep.card2Desc, 300);
  const scrambledCard3Title = useScrambleText(currentStep.card3Title, 280);
  const scrambledCard3Desc = useScrambleText(currentStep.card3Desc, 300);
  const scrambledTestimonial = useScrambleText(currentStep.testimonial, 300);
  const scrambledAuthor = useScrambleText(currentStep.author, 300);

  // Cookie banner state for Step 3+
  const [cookieDismissed, setCookieDismissed] = useState(false);

  return (
    <div
      ref={mainContainerRef}
      className={`min-h-screen relative flex flex-col justify-between overflow-x-hidden selection:bg-[#F59E0B] selection:text-black transition-colors duration-500 ${
        clicks >= 5
          ? 'bg-[#121212] text-[#F3F4F6] font-special'
          : clicks >= 3
          ? 'bg-[#141414] text-[#F3F4F6]'
          : 'bg-[#121212] text-[#F3F4F6] font-saas'
      }`}
    >
      {/* VISUAL LAYER ONLY: Film grain, scanlines, vignette, roll bar, tears, debris */}
      <VisualVintageLayers chaos={chaos} clicks={clicks} />

      {/* Ghost Cursor at high chaos */}
      <GhostCursor enabled={clicks >= 4} chaosLevel={chaos} />

      {/* Rogue Popups for Absurd Mode */}
      <PopupsOverlay
        popups={roguePopups}
        onDismiss={(id) => setRoguePopups((prev) => prev.filter((p) => p.id !== id))}
      />

      {/* Particle Bursts Container */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle-burst"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              color: p.color,
              // @ts-expect-error custom css variable
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            }}
          >
            {p.char}
          </span>
        ))}
      </div>

      {/* Top Toast Banner for Achievement Unlocks */}
      {latestUnlockedBadge && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2.5 bg-[#202020] border border-[#F59E0B] text-[#F3F4F6] shadow-[6px_6px_0_#0a0a0a] flex items-center gap-3 font-special text-xs select-none animate-bounce">
          <Trophy className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <div>
            <span className="font-bold text-[#F59E0B] block uppercase tracking-wider text-[10px]">
              AUDIT CITATION RECORDED
            </span>
            <span className="text-[11px] text-[#F3F4F6]">
              {latestUnlockedBadge.title}: {latestUnlockedBadge.description}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 5: FULL BRUTALIST INSTRUMENT PANEL (chaos-click.html)
          ========================================================================= */}
      {clicks >= 5 ? (
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-7xl w-full mx-auto font-special">
          {/* Top Thin Bar: Terminal Name Left, Uptime Clock Right */}
          <header className="flex items-center justify-between pb-3 instrument-divider text-xs text-[#8d8d8d]">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
              <span className="font-bold text-[#F59E0B] amber-glow uppercase tracking-wider">
                HALCYON_TERM // NODE_0451
              </span>
              <span className="hidden sm:inline text-[#8d8d8d]">// AIRSTRIP_ONE</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-mono text-[#F3F4F6]">
                <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>UPTIME: {uptime}</span>
              </div>
              <button
                onClick={handleReset}
                className="text-[10px] text-[#8d8d8d] hover:text-[#F59E0B] uppercase font-bold transition-colors cursor-pointer"
              >
                [REBOOT]
              </button>
            </div>
          </header>

          {/* Three-Column Main Instrument Area (Collapses on &lt; 860px) */}
          <main className="grid grid-cols-1 min-[860px]:grid-cols-3 gap-6 my-6 items-start">
            {/* Left Column: Operator Log Panel */}
            <div className="hidden min-[860px]:block">
              <TerminalLog
                logs={logs}
                onExecuteCommand={handleTerminalCommand}
                onClearLogs={() => setLogs(['Terminal purged by operator.'])}
                isNormal={false}
              />
            </div>

            {/* Center Column: Title Stacked on Two Lines + Big Round Arcade Button */}
            <div className="text-center flex flex-col items-center justify-center py-4">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#F59E0B] mb-2 amber-glow">
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#F59E0B]" />
                <span>{currentStep.eyebrow}</span>
              </div>

              {/* Title Stacked on Two Lines */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-anton uppercase leading-none tracking-tight my-4">
                <span
                  data-text="WE ARE WATCHING."
                  className="block text-[#F3F4F6] glitch-slice-title active"
                  style={{ textShadow: '4px 4px 0 #B45309' }}
                >
                  WE ARE WATCHING.
                </span>
                <span
                  data-text="YOU ARE FOCUSED."
                  className="block text-[#F59E0B] amber-glow glitch-slice-title active"
                  style={{ textShadow: '4px 4px 0 #000000' }}
                >
                  YOU ARE FOCUSED.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs md:text-sm text-[#8d8d8d] max-w-md my-4 leading-relaxed">
                {scrambledSub}
              </p>

              {/* Big Round Arcade Amber Button */}
              <div className="my-6 relative">
                <button
                  ref={buttonRef}
                  id="clickButton"
                  onClick={(e) => handleChaosClick(e, 'mainButton')}
                  onMouseEnter={handleButtonHover}
                  style={{
                    transform: `translate(${buttonOffset.x}px, ${buttonOffset.y}px)`,
                  }}
                  className="arcade-button w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center font-anton tracking-wide text-lg sm:text-xl uppercase select-none cursor-pointer p-4 text-center leading-tight shadow-[0_0_0_4px_#3a3a3a,7px_7px_0_#0a0a0a]"
                >
                  <span className="drop-shadow-sm">{scrambledCta}</span>
                  <span className="text-[10px] font-special font-bold text-[#121212]/80 mt-1 uppercase tracking-normal">
                    PRESS KEY
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-[#8d8d8d] mt-2">
                Click count: <span className="font-bold text-[#F59E0B]">{clicks}</span> / 6 · State: Terminal Lockout
              </div>
            </div>

            {/* Right Column: Entropy Panel with 20-segment Meter */}
            <div>
              <ChaosMeter
                chaos={chaos}
                stageIndex={stepIndex}
                stageName={currentStep.eyebrow}
              />

              {/* Live Sarcastic Message Banner */}
              <div className="instrument-panel p-3 my-4 text-xs text-[#F59E0B] amber-glow">
                <div className="font-bold uppercase text-[10px] text-[#8d8d8d] mb-1">
                  Surveillance Dispatch:
                </div>
                <p>&gt; {currentMessage}</p>
              </div>
            </div>
          </main>

          {/* Bottom Action Controls */}
          <div className="flex justify-center items-center gap-3 flex-wrap my-4 text-xs">
            <button
              id="resetRealityBtn"
              onClick={handleReset}
              className="px-4 py-2 bg-[#202020] border border-[#3a3a3a] hover:border-[#F59E0B] text-[#F3F4F6] shadow-[4px_4px_0_#0a0a0a] uppercase font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>RETURN TO DESK</span>
            </button>
            <button
              onClick={() => setIsReportOpen(true)}
              className="px-4 py-2 bg-[#202020] border border-[#3a3a3a] hover:border-[#F59E0B] text-[#F59E0B] shadow-[4px_4px_0_#0a0a0a] uppercase font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>AUDIT DOSSIER</span>
            </button>
            <button
              onClick={() => setIsAchievementsOpen(true)}
              className="px-4 py-2 bg-[#202020] border border-[#3a3a3a] hover:border-[#F59E0B] text-[#F3F4F6] shadow-[4px_4px_0_#0a0a0a] uppercase font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>CITATIONS</span>
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================================
           STAGES 0 TO 4: HALCYON PRODUCT WEBSITE & PROGRESSIVE DECAY
           ========================================================================= */
        <div className="flex-1 flex flex-col justify-between">
          {/* Top Navigation Bar: Halcyon Wordmark Left, Links, Sign In & Trial Button */}
          <header className={`px-6 py-4 sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${
            clicks >= 3
              ? 'bg-[#181818]/95 border-b border-[#3a3a3a]'
              : 'bg-[#121212]/90 border-b border-[#202020]'
          }`}>
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
              {/* Wordmark Left */}
              <button
                onClick={handleLogoClick}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <span className="font-anton text-2xl tracking-wide text-[#F3F4F6] group-hover:text-[#F59E0B] transition-colors">
                  HALCYON
                </span>
                <span className="text-[11px] font-saas text-[#8d8d8d] hidden sm:inline border-l border-[#3a3a3a] pl-2.5">
                  focus &amp; wellbeing analytics
                </span>
              </button>

              {/* Center Nav Links */}
              <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#8d8d8d]">
                <span className="hover:text-[#F3F4F6] cursor-pointer transition-colors">Product</span>
                <span className="hover:text-[#F3F4F6] cursor-pointer transition-colors">Teams</span>
                <span className="hover:text-[#F3F4F6] cursor-pointer transition-colors">Pricing</span>
                <span className="hover:text-[#F3F4F6] cursor-pointer transition-colors">Customers</span>
              </nav>

              {/* Right CTA and Actions */}
              <div className="flex items-center gap-4 text-xs">
                {/* Audio and Mode Controls (subtle) */}
                <button
                  onClick={() => {
                    const muted = !isMuted;
                    setIsMuted(muted);
                    audioEngine.setMuted(muted);
                  }}
                  className="p-1.5 text-[#8d8d8d] hover:text-[#F59E0B] transition-colors cursor-pointer"
                  title="Toggle Audio"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsAchievementsOpen(true)}
                  className="p-1.5 text-[#8d8d8d] hover:text-[#F59E0B] transition-colors cursor-pointer"
                  title="Vault"
                >
                  <Trophy className="w-4 h-4" />
                </button>

                <span className="text-[#8d8d8d] hover:text-[#F3F4F6] cursor-pointer transition-colors hidden sm:inline">
                  Sign in
                </span>

                {/* Primary Trial Button in Nav */}
                <button
                  onClick={(e) => handleChaosClick(e, 'mainButton')}
                  className="saas-cta-button px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  {clicks === 0 ? 'Start free trial' : 'Action'}
                </button>
              </div>
            </div>
          </header>

          {/* Main Hero and Content */}
          <main className="max-w-5xl w-full mx-auto px-6 py-12 text-center transition-all duration-300">
            {/* Telescreen CCTV Eye subtle integration for step 3+ */}
            {clicks >= 3 && (
              <div className="mb-4">
                <TelescreenEye
                  chaos={chaos}
                  stageIndex={stepIndex}
                  onClick={handleEyeClick}
                />
              </div>
            )}

            {/* Eyebrow */}
            <div className={`inline-flex items-center gap-2 text-xs tracking-wider uppercase mb-3 ${
              clicks >= 3 ? 'text-[#F59E0B] amber-glow font-special' : 'text-[#8d8d8d] font-saas'
            }`}>
              {clicks >= 3 ? <Radio className="w-3.5 h-3.5 animate-pulse text-[#F59E0B]" /> : <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />}
              <span>{currentStep.eyebrow}</span>
            </div>

            {/* Hero Headline */}
            <h1
              data-text={scrambledHeadline}
              className={`text-4xl sm:text-6xl md:text-7xl font-anton tracking-tight my-4 leading-tight whitespace-pre-line ${
                clicks >= 3
                  ? 'glitch-slice-title active text-[#F3F4F6]'
                  : 'text-[#F3F4F6]'
              }`}
              style={{
                transform: clicks === 4 ? `rotate(-1.2deg)` : clicks === 3 ? `rotate(0.8deg)` : 'none',
                textShadow: clicks >= 3 ? '3px 3px 0 #B45309' : '0 2px 16px rgba(245, 158, 11, 0.15)',
              }}
            >
              {scrambledHeadline}
            </h1>

            {/* Hero Subtext */}
            <p className={`max-w-2xl mx-auto text-sm md:text-base leading-relaxed my-4 transition-colors ${
              clicks >= 3 ? 'text-[#8d8d8d] font-special' : 'text-[#8d8d8d] font-saas'
            }`}>
              {scrambledSub}
            </p>

            {/* Primary CTA Area */}
            <div className="my-6 relative inline-block">
              <button
                ref={buttonRef}
                id="clickButton"
                onClick={(e) => handleChaosClick(e, 'mainButton')}
                onMouseEnter={handleButtonHover}
                style={{
                  transform: `translate(${buttonOffset.x}px, ${buttonOffset.y}px)`,
                }}
                className={`cursor-pointer select-none font-bold uppercase transition-all duration-200 ${
                  clicks === 0
                    ? 'saas-cta-button px-9 py-4 rounded-xl text-sm md:text-base tracking-wider font-saas shadow-[0_4px_24px_rgba(245,158,11,0.25)]'
                    : clicks >= 4
                    ? 'arcade-button px-9 py-4 rounded-xl text-sm md:text-base tracking-wider font-special'
                    : 'saas-cta-button px-9 py-4 rounded-xl text-sm md:text-base tracking-wider font-saas'
                }`}
              >
                {scrambledCta}
              </button>
            </div>

            {/* Secondary CTA and Fine Print */}
            <div className="flex items-center justify-center gap-4 text-xs text-[#8d8d8d] mb-8 font-saas">
              <span className="hover:text-[#F3F4F6] cursor-pointer inline-flex items-center gap-1">
                <span>Watch the 2-minute demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span>•</span>
              <span>No credit card. Cancel anytime.</span>
            </div>

            {/* Trust Line */}
            <div className="my-8 pt-6 border-t border-[#202020]">
              <p className="text-xs uppercase tracking-widest text-[#8d8d8d] mb-4">
                {currentStep.trustLine}
              </p>
              <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap text-sm sm:text-base font-bold text-[#8d8d8d]/80 tracking-wide">
                <span>NORTHWIND</span>
                <span>LUMEN</span>
                <span>FIELDSTONE</span>
                <span>PARALLEL</span>
                <span>ARDENT</span>
              </div>
            </div>

            {/* Three Feature Cards */}
            <section
              className="grid grid-cols-1 md:grid-cols-3 gap-5 my-10 text-left"
              aria-label="Features"
            >
              {/* Card 1 */}
              <article
                onClick={(e) => handleChaosClick(e, 'cards')}
                style={{
                  transform: clicks >= 3 ? 'rotate(-1deg)' : 'none',
                }}
                className={`p-6 transition-all cursor-pointer ${
                  clicks >= 3
                    ? 'instrument-panel font-special'
                    : 'rounded-xl border border-[#2b2b2b] bg-[#1a1a1a] hover:border-[#3a3a3a] shadow-lg font-saas'
                }`}
              >
                <div className="text-[#F59E0B] text-xs font-bold uppercase tracking-wider mb-2">
                  01 / ATTENTION
                </div>
                <h3 className="text-[#F3F4F6] font-bold text-base mb-2">
                  {scrambledCard1Title}
                </h3>
                <p className="text-xs text-[#8d8d8d] leading-relaxed">
                  {scrambledCard1Desc}
                </p>
              </article>

              {/* Card 2 */}
              <article
                onClick={(e) => handleChaosClick(e, 'cards')}
                style={{
                  transform: clicks >= 3 ? 'rotate(1deg)' : 'none',
                }}
                className={`p-6 transition-all cursor-pointer ${
                  clicks >= 3
                    ? 'instrument-panel font-special'
                    : 'rounded-xl border border-[#2b2b2b] bg-[#1a1a1a] hover:border-[#3a3a3a] shadow-lg font-saas'
                }`}
              >
                <div className="text-[#F59E0B] text-xs font-bold uppercase tracking-wider mb-2">
                  02 / CADENCE
                </div>
                <h3 className="text-[#F3F4F6] font-bold text-base mb-2">
                  {scrambledCard2Title}
                </h3>
                <p className="text-xs text-[#8d8d8d] leading-relaxed">
                  {scrambledCard2Desc}
                </p>
              </article>

              {/* Card 3 */}
              <article
                onClick={(e) => handleChaosClick(e, 'cards')}
                style={{
                  transform: clicks >= 3 ? 'rotate(-0.5deg)' : 'none',
                }}
                className={`p-6 transition-all cursor-pointer ${
                  clicks >= 3
                    ? 'instrument-panel font-special'
                    : 'rounded-xl border border-[#2b2b2b] bg-[#1a1a1a] hover:border-[#3a3a3a] shadow-lg font-saas'
                }`}
              >
                <div className="text-[#F59E0B] text-xs font-bold uppercase tracking-wider mb-2">
                  03 / ANALYTICS
                </div>
                <h3 className="text-[#F3F4F6] font-bold text-base mb-2">
                  {scrambledCard3Title}
                </h3>
                <p className="text-xs text-[#8d8d8d] leading-relaxed">
                  {scrambledCard3Desc}
                </p>
              </article>
            </section>

            {/* Product Preview Card: Disguise of Existing Widgets */}
            <div className="my-10 p-6 rounded-2xl bg-[#161616] border border-[#2a2a2a] text-left">
              <div className="flex items-center justify-between pb-4 border-b border-[#2a2a2a] mb-6">
                <div>
                  <h2 className="text-sm font-bold text-[#F3F4F6] uppercase tracking-wide">
                    Live Team Activity &amp; Focus Index
                  </h2>
                  <p className="text-xs text-[#8d8d8d]">
                    Sessions today: <span className="font-bold text-[#F59E0B]">{clicks}</span>
                  </p>
                </div>
                <div className="text-xs text-[#8d8d8d]">
                  From $6 per person per month
                </div>
              </div>

              {/* 20-segment Focus Score Bar */}
              <ChaosMeter
                chaos={chaos}
                stageIndex={stepIndex}
                stageName={currentStep.eyebrow}
              />

              {/* Live Activity Feed */}
              <TerminalLog
                logs={logs}
                onExecuteCommand={handleTerminalCommand}
                onClearLogs={() => setLogs(['Feed refreshed.'])}
                isNormal={clicks === 0}
              />
            </div>

            {/* Testimonial Section */}
            <div className="my-10 p-6 rounded-xl bg-[#181818] border border-[#2a2a2a] text-center max-w-2xl mx-auto">
              <p className="text-base sm:text-lg italic text-[#F3F4F6] mb-3">
                "{scrambledTestimonial}"
              </p>
              <p className="text-xs font-bold text-[#F59E0B]">
                — {scrambledAuthor}
              </p>
            </div>
          </main>

          {/* Cookie / Telemetry Banner (Slides in at Step 3+) */}
          {clicks >= 3 && !cookieDismissed && (
            <div className="fixed bottom-12 inset-x-4 max-w-xl mx-auto z-[9990] p-4 bg-[#202020] border border-[#3a3a3a] shadow-[7px_7px_0_#0a0a0a] flex items-center justify-between gap-4 font-special text-xs animate-slide-up">
              <div className="flex items-center gap-2.5 text-[#F3F4F6]">
                <Lock className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>
                  Mandatory Telemetry Notice: Continuous ambient audio &amp; keystroke verification active.
                </span>
              </div>
              <button
                onClick={() => setCookieDismissed(true)}
                className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#121212] font-bold text-xs uppercase cursor-pointer shrink-0"
              >
                Accept
              </button>
            </div>
          )}

          {/* Footer with Links and Ticker */}
          <footer className="border-t border-[#222222] bg-[#121212] pt-6 pb-2 text-xs text-[#8d8d8d]">
            <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
              <div className="flex items-center gap-6">
                <span>Privacy</span>
                <span>Terms</span>
                <span>Security</span>
                <span>Contact</span>
              </div>
              <div className="flex items-center gap-4">
                <span>&copy; 2026 Halcyon Labs</span>
                <button
                  id="resetRealityBtn"
                  onClick={handleReset}
                  className="hover:text-[#F59E0B] cursor-pointer"
                >
                  [Reset Reality]
                </button>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Scrolling Ticker Footer on All Stages */}
      <div className="w-full bg-[#0a0a0a] border-t border-[#3a3a3a] py-1.5 overflow-hidden text-[11px] font-mono select-none z-40">
        <div className={`ticker-track ${clicks >= 5 ? 'hyper' : clicks >= 3 ? 'fast' : ''}`}>
          <span className="text-[#8d8d8d] px-8">
            HALCYON CORE ENGINE // SYSTEM NOMINAL // 1,200 TEAMS CONNECTED // DEEP WORK OPTIMIZATION ACTIVE // ENCRYPTED FOCUS TELEMETRY //
          </span>
          <span className="text-[#F59E0B] px-8">
            ATTENTION RECORDED // SUBJECT 0451 BLINKED // KEYSTROKE LATENCY INDEXED // TELESCREEN ACTIVE // ROOM 101 PROTOCOL // 2+2=5 //
          </span>
          <span className="text-[#8d8d8d] px-8">
            HALCYON CORE ENGINE // SYSTEM NOMINAL // 1,200 TEAMS CONNECTED // DEEP WORK OPTIMIZATION ACTIVE // ENCRYPTED FOCUS TELEMETRY //
          </span>
          <span className="text-[#F59E0B] px-8">
            ATTENTION RECORDED // SUBJECT 0451 BLINKED // KEYSTROKE LATENCY INDEXED // TELESCREEN ACTIVE // ROOM 101 PROTOCOL // 2+2=5 //
          </span>
        </div>
      </div>

      {/* Room 101 Overlord Takeover Modal */}
      <ChaosReportModal
        isOpen={isReportOpen}
        clicks={clicks}
        maxApm={maxApm}
        clickPositions={clickPositions}
        onTriggerReset={handleReset}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Thoughtcrime Trophy Vault Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        achievements={achievements}
        onClose={() => setIsAchievementsOpen(false)}
      />

      {/* Arch Linux Underground Blueprint Modal */}
      <ArchLinuxGuideModal
        isOpen={isArchGuideOpen}
        onClose={() => setIsArchGuideOpen(false)}
      />
    </div>
  );
}

