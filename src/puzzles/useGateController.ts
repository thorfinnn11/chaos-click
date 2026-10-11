import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { GateState } from './types';
import { droneSynthesizer } from '../utils/droneSynthesizer';
import { audioEngine } from '../utils/audioEngine';
import { gateLogger } from './gateLogger';

const STORAGE_KEY = 'halcyon_gate_state';

interface UseGateControllerParams {
  lenis: Lenis | null;
  onAdvanceCallback: (targetStage: number) => void;
  triggerDegauss: () => void;
  currentChaos: number;
}

export function useGateController({
  lenis,
  onAdvanceCallback,
  triggerDegauss,
  currentChaos,
}: UseGateControllerParams) {
  const [gateState, setGateState] = useState<GateState>(() => {
    // Check URL parameters first for dev shortcut (?gate=1, ?gate=2, etc.)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const bossParam = urlParams.get('boss');
      if (bossParam === '1') {
        gateLogger.log('URL ?boss=1 shortcut detected');
        return {
          status: 'boss',
          targetStage: 6,
          seed: Date.now(),
          fails: 0,
          assist: false,
        };
      }

      const gateParam = urlParams.get('gate');
      if (gateParam) {
        const gNum = parseInt(gateParam, 10);
        if (gNum >= 1 && gNum <= 5) {
          gateLogger.log('URL ?gate shortcut detected', { targetStage: gNum });
          return {
            status: 'puzzle',
            targetStage: gNum,
            seed: Date.now(),
            fails: 0,
            assist: false,
          };
        }
      }

      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.status === 'puzzle' || parsed.status === 'freezing' || parsed.status === 'boss') {
          return {
            status: parsed.status,
            targetStage: parsed.targetStage || 1,
            seed: parsed.seed || Date.now(),
            fails: parsed.fails || 0,
            assist: parsed.assist || false,
          };
        }
      }
    } catch {
      // ignore storage error
    }
    return {
      status: 'idle',
      targetStage: 1,
      seed: Date.now(),
      fails: 0,
      assist: false,
    };
  });

  const [verticalHoldRoll, setVerticalHoldRoll] = useState(0);

  // Guard refs to strictly guarantee idempotency
  const isSolvingRef = useRef(false);
  const inputLockRef = useRef(false);
  const savedScrollYRef = useRef(0);

  // Sync state to sessionStorage
  useEffect(() => {
    if (gateState.status === 'puzzle' || gateState.status === 'freezing' || gateState.status === 'boss') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(gateState));
    } else if (gateState.status === 'idle') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [gateState]);

  // Handle freeze effect on mounting if resumed from sessionStorage or URL
  useEffect(() => {
    if (gateState.status === 'puzzle' || gateState.status === 'freezing' || gateState.status === 'boss') {
      savedScrollYRef.current = window.scrollY;
      gsap.globalTimeline.pause();
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
      droneSynthesizer.tapeStop();
      gateLogger.log('resumed frozen gate from state', { targetStage: gateState.targetStage, status: gateState.status });
    }
  }, [gateState.status, gateState.targetStage, lenis]);

  // Request advance interception point: strictly idempotent
  const requestAdvance = useCallback(
    (targetStage: number) => {
      // 1. Must be idle and not within input lock
      if (gateState.status !== 'idle' || inputLockRef.current) {
        gateLogger.log('requestAdvance rejected (busy or locked)', {
          status: gateState.status,
          targetStage,
          locked: inputLockRef.current,
        });
        return;
      }

      // 2. Lock inputs for transition
      inputLockRef.current = true;
      isSolvingRef.current = false;
      savedScrollYRef.current = window.scrollY;

      const seed = Math.floor(Math.random() * 1000000);
      gateLogger.log(`requestAdvance(targetStage: ${targetStage})`, { seed });
      gateLogger.log(`freeze(targetStage: ${targetStage})`, { scrollY: savedScrollYRef.current });

      // 3. Enter freezing state
      setGateState({
        status: 'freezing',
        targetStage,
        seed,
        fails: 0,
        assist: false,
      });

      // 4. Pause animations and lock background scrolling
      gsap.globalTimeline.pause();
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
      droneSynthesizer.tapeStop();
      audioEngine.playGlitchBurst();

      // 5. Transition to puzzle view after short freeze hitch (450ms)
      setTimeout(() => {
        setGateState((prev) => ({
          ...prev,
          status: 'puzzle',
        }));
        gateLogger.log(`puzzle mount(targetStage: ${targetStage})`);
        // Release initial freeze input lock
        inputLockRef.current = false;
      }, 450);
    },
    [gateState.status, lenis]
  );

  // Handle Puzzle Failure (soft fail)
  const handleFail = useCallback(() => {
    gateLogger.log('puzzle fail (soft reset)', { targetStage: gateState.targetStage });
    setGateState((prev) => ({
      ...prev,
      fails: prev.fails + 1,
      seed: Math.floor(Math.random() * 1000000),
    }));
  }, [gateState.targetStage]);

  // Toggle assist mode ("Reduce friction")
  const setAssistMode = useCallback((val: boolean) => {
    gateLogger.log(`assist mode toggled: ${val}`, { targetStage: gateState.targetStage });
    setGateState((prev) => ({
      ...prev,
      assist: val,
    }));
  }, [gateState.targetStage]);

  // Handle Puzzle Solved: strictly idempotent with guard ref
  const handleSolved = useCallback(() => {
    if (isSolvingRef.current) {
      gateLogger.log('duplicate handleSolved ignored by guard ref', {
        targetStage: gateState.targetStage,
      });
      return;
    }
    isSolvingRef.current = true;
    inputLockRef.current = true;

    const solvedTarget = gateState.targetStage;
    gateLogger.log(`onSolved(targetStage: ${solvedTarget})`);
    gateLogger.log(`thaw(targetStage: ${solvedTarget})`);

    // Enter thawing state
    setGateState((prev) => ({ ...prev, status: 'thawing' }));

    // 1. Thaw audio effects
    triggerDegauss();
    audioEngine.playThawSwoosh();
    droneSynthesizer.tapeStart(currentChaos);

    // 2. Vertical hold roll animation
    const rollStart = performance.now();
    const rollInterval = setInterval(() => {
      const elapsed = (performance.now() - rollStart) / 1000;
      if (elapsed > 0.55) {
        clearInterval(rollInterval);
        setVerticalHoldRoll(0);
      } else {
        setVerticalHoldRoll((prev) => (prev + 0.12) % 1.0);
      }
    }, 32);

    // 3. Advance stage in main application (data-driven: gate N unlocks stage N)
    onAdvanceCallback(solvedTarget);
    gateLogger.log(`stage change(to: ${solvedTarget})`);

    // 4. Resume timeline and restore scroll exactly without jump
    setTimeout(() => {
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollYRef.current);

      gsap.globalTimeline.resume();
      if (lenis) lenis.start();

      setGateState({
        status: 'idle',
        targetStage: solvedTarget,
        seed: Date.now(),
        fails: 0,
        assist: false,
      });

      sessionStorage.removeItem(STORAGE_KEY);
      isSolvingRef.current = false;
      inputLockRef.current = false;
      gateLogger.log(`idle restored(currentStage: ${solvedTarget})`);
    }, 600);
  }, [currentChaos, gateState.targetStage, lenis, onAdvanceCallback, triggerDegauss]);

  // Start Overseer Boss Fight
  const startBoss = useCallback(() => {
    gateLogger.log('startBoss initiated');
    gsap.globalTimeline.pause();
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    droneSynthesizer.tapeStop();

    setGateState({
      status: 'boss',
      targetStage: 6,
      seed: Date.now(),
      fails: 0,
      assist: false,
    });
  }, [lenis]);

  // Handle Boss Defeated: triggers reverse power-on roll back to Stage 0
  const handleBossDefeated = useCallback(() => {
    gateLogger.log('boss defeated, beginning revert sequence');
    setGateState((prev) => ({ ...prev, status: 'reverting' }));
    triggerDegauss();
    audioEngine.playThawSwoosh();

    // Revert sequence (1.2s reverse CRT power-on into clean Stage 0 Halcyon site)
    setTimeout(() => {
      document.body.style.overflow = '';
      window.scrollTo(0, 0);

      gsap.globalTimeline.resume();
      if (lenis) lenis.start();

      onAdvanceCallback(0); // Reset to clean Stage 0

      setGateState({
        status: 'idle',
        targetStage: 1,
        seed: Date.now(),
        fails: 0,
        assist: false,
      });

      sessionStorage.removeItem(STORAGE_KEY);
      gateLogger.log('idle restored at clean Stage 0');
    }, 1200);
  }, [lenis, onAdvanceCallback, triggerDegauss]);

  return {
    gateState,
    isFrozen: gateState.status === 'freezing' || gateState.status === 'puzzle',
    isThawing: gateState.status === 'thawing',
    isBoss: gateState.status === 'boss',
    isReverting: gateState.status === 'reverting',
    isInputLocked: inputLockRef.current,
    verticalHoldRoll,
    requestAdvance,
    handleSolved,
    handleFail,
    setAssistMode,
    startBoss,
    handleBossDefeated,
  };
}
