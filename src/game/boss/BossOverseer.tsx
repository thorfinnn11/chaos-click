import React, { useState, useEffect, useRef, useCallback } from 'react';
import { bossAudio } from './bossAudio';
import { Heart, Shield, Radio, AlertTriangle, Crosshair, Award, FastForward } from 'lucide-react';

interface BossOverseerProps {
  onDefeated: () => void;
  onExit?: () => void;
}

interface ScanBeam {
  id: number;
  y: number;
  height: number;
  state: 'charging' | 'firing';
  timer: number; // seconds remaining in state
}

interface FallingStamp {
  id: number;
  x: number;
  y: number;
  size: number;
  vy: number;
}

interface FallingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  redacted: boolean;
}

const FORBIDDEN_WORDS_PHASE3 = ['PRIVACY', 'DISSENT', 'FREEDOM', 'FATIGUE', 'AUTONOMOUS', 'INDIVIDUAL'];

export const BossOverseer: React.FC<BossOverseerProps> = ({ onDefeated, onExit }) => {
  // Game loop canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Focus points (player HP): 3 max
  const [focusPoints, setFocusPoints] = useState(3);
  const [bossHp, setBossHp] = useState(100);
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [isStunned, setIsStunned] = useState(false);
  const [stunTimeLeft, setStunTimeLeft] = useState(0);

  // Simon sequence for Phase 2
  const [simonTarget, setSimonTarget] = useState<number[]>([0, 2, 1]);
  const [simonInputIndex, setSimonInputIndex] = useState(0);
  const [activeSimonPad, setActiveSimonPad] = useState<number | null>(null);

  // Victory / Defeat animation states
  const [isDying, setIsDying] = useState(false);
  const [isRespawning, setIsRespawning] = useState(false);

  // Player position & keys
  const playerPosRef = useRef({ x: 400, y: 480 });
  const keysPressedRef = useRef<{ [k: string]: boolean }>({});
  const lastDamageTimeRef = useRef(0);

  // Boss internal references
  const bossHpRef = useRef(100);
  const phaseRef = useRef<1 | 2 | 3>(1);
  const focusPointsRef = useRef(3);
  const pupilOpenRef = useRef(false);
  const pupilTimerRef = useRef(0);
  const isStunnedRef = useRef(false);

  const beamsRef = useRef<ScanBeam[]>([]);
  const stampsRef = useRef<FallingStamp[]>([]);
  const wordsRef = useRef<FallingWord[]>([]);
  const nextSpawnTimeRef = useRef({ beam: 1.5, stamp: 1.0, word: 2.0 });

  // Dither fragments on defeat
  const fragmentsRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number }[]>([]);

  // Phase start HP checkpoints: Phase 1 = 100, Phase 2 = 66, Phase 3 = 33
  const phaseStartHpRef = useRef({ 1: 100, 2: 66, 3: 33 });

  // Sync state refs
  useEffect(() => {
    bossHpRef.current = bossHp;
  }, [bossHp]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    focusPointsRef.current = focusPoints;
  }, [focusPoints]);

  // Handle player damage
  const damagePlayer = useCallback(() => {
    const now = performance.now();
    if (now - lastDamageTimeRef.current < 1200) return; // 1.2s invulnerability
    lastDamageTimeRef.current = now;

    bossAudio.playPlayerHit();
    const nextHp = focusPointsRef.current - 1;
    focusPointsRef.current = nextHp;
    setFocusPoints(nextHp);

    if (nextHp <= 0) {
      // Restart CURRENT phase with boss HP kept at phase start
      setIsRespawning(true);
      const curPhase = phaseRef.current;
      const resetHp = phaseStartHpRef.current[curPhase];
      bossHpRef.current = resetHp;
      setBossHp(resetHp);
      focusPointsRef.current = 3;
      setFocusPoints(3);
      beamsRef.current = [];
      stampsRef.current = [];
      wordsRef.current = [];

      setTimeout(() => {
        setIsRespawning(false);
      }, 1000);
    }
  }, []);

  // Handle damage dealt to Boss
  const damageBoss = useCallback(
    (amount: number) => {
      if (bossHpRef.current <= 0 || isDying) return;

      bossAudio.playBossHit();
      const newHp = Math.max(0, bossHpRef.current - amount);
      bossHpRef.current = newHp;
      setBossHp(newHp);

      // Phase transitions
      if (newHp <= 66 && phaseRef.current === 1) {
        phaseRef.current = 2;
        setPhase(2);
        bossAudio.playPhaseTransition();
        setSimonTarget([0, 2, 1]);
        setSimonInputIndex(0);
      } else if (newHp <= 33 && phaseRef.current === 2) {
        phaseRef.current = 3;
        setPhase(3);
        bossAudio.playPhaseTransition();
      } else if (newHp <= 0) {
        // Boss Defeated!
        setIsDying(true);
        bossAudio.playBossDefeat();

        // Spawn 150 dither fragments
        const frags = [];
        for (let i = 0; i < 150; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 60 + Math.random() * 260;
          frags.push({
            x: 400 + (Math.random() - 0.5) * 60,
            y: 190 + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            size: 3 + Math.random() * 5,
          });
        }
        fragmentsRef.current = frags;

        setTimeout(() => {
          onDefeated();
        }, 2400);
      }
    },
    [isDying, onDefeated]
  );

  // Phase 2: Simon Input handler
  const handleSimonInput = useCallback(
    (padIndex: number) => {
      if (phaseRef.current !== 2 || isStunnedRef.current) return;
      setActiveSimonPad(padIndex);
      setTimeout(() => setActiveSimonPad(null), 200);

      const expected = simonTarget[simonInputIndex];
      if (padIndex === expected) {
        const nextIdx = simonInputIndex + 1;
        setSimonInputIndex(nextIdx);

        if (nextIdx >= simonTarget.length) {
          // Stun the boss!
          isStunnedRef.current = true;
          setIsStunned(true);
          setStunTimeLeft(3.5);
          bossAudio.playBossStun();
          damageBoss(12);

          let remain = 3.5;
          const interval = setInterval(() => {
            remain -= 0.5;
            setStunTimeLeft(Math.max(0, remain));
            if (remain <= 0) {
              clearInterval(interval);
              isStunnedRef.current = false;
              setIsStunned(false);
              setSimonInputIndex(0);
              // Next pattern
              setSimonTarget([
                Math.floor(Math.random() * 4),
                Math.floor(Math.random() * 4),
                Math.floor(Math.random() * 4),
              ]);
            }
          }, 500);
        }
      } else {
        // Wrong simon sequence: resets input
        setSimonInputIndex(0);
      }
    },
    [simonTarget, simonInputIndex, damageBoss]
  );

  // Phase 3: Redact Falling Word
  const handleWordClick = useCallback(
    (wordId: number) => {
      if (phaseRef.current !== 3) return;
      const target = wordsRef.current.find((w) => w.id === wordId && !w.redacted);
      if (target) {
        target.redacted = true;
        damageBoss(8);
      }
    },
    [damageBoss]
  );

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressedRef.current[k] = true;

      // Number keys for Phase 2 Simon
      if (e.key === '1') handleSimonInput(0);
      if (e.key === '2') handleSimonInput(1);
      if (e.key === '3') handleSimonInput(2);
      if (e.key === '4') handleSimonInput(3);

      // Spacebar/Enter to strike pupil if hovering near it
      if (e.key === ' ' || e.key === 'Enter') {
        const px = playerPosRef.current.x;
        const py = playerPosRef.current.y;
        const distToPupil = Math.hypot(px - 400, py - 190);
        if (distToPupil < 65 && (pupilOpenRef.current || isStunnedRef.current)) {
          damageBoss(7);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleSimonInput, damageBoss]);

  // Pointer move inside canvas
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.max(20, Math.min(canvas.width - 20, (e.clientX - rect.left) * scaleX));
    const y = Math.max(40, Math.min(canvas.height - 20, (e.clientY - rect.top) * scaleY));
    playerPosRef.current = { x, y };
  }, []);

  // Main 60fps Boss Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;

      // 1. Clear CRT background with scanlines
      ctx.fillStyle = '#060709';
      ctx.fillRect(0, 0, cw, ch);

      // CRT scanlines grid
      ctx.strokeStyle = 'rgba(255, 176, 0, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y < ch; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      // 2. Keyboard Reticle velocity integration
      const keys = keysPressedRef.current;
      let kx = 0;
      let ky = 0;
      if (keys['arrowup'] || keys['w']) ky -= 1;
      if (keys['arrowdown'] || keys['s']) ky += 1;
      if (keys['arrowleft'] || keys['a']) kx -= 1;
      if (keys['arrowright'] || keys['d']) kx += 1;

      if (kx !== 0 || ky !== 0) {
        const len = Math.hypot(kx, ky);
        const spd = 360;
        playerPosRef.current.x = Math.max(20, Math.min(cw - 20, playerPosRef.current.x + (kx / len) * spd * dt));
        playerPosRef.current.y = Math.max(40, Math.min(ch - 20, playerPosRef.current.y + (ky / len) * spd * dt));
      }

      const px = playerPosRef.current.x;
      const py = playerPosRef.current.y;

      // 3. Boss Pupil Cycle (Phase 1 & 2)
      pupilTimerRef.current += dt;
      if (pupilTimerRef.current > 3.0) {
        pupilOpenRef.current = !pupilOpenRef.current;
        pupilTimerRef.current = 0;
      }

      // 4. Update & Spawn Hazards
      const curPhase = phaseRef.current;

      // Spawn Beams: telegraphed for 0.6s
      nextSpawnTimeRef.current.beam -= dt;
      if (nextSpawnTimeRef.current.beam <= 0 && !isStunnedRef.current && !isDying) {
        nextSpawnTimeRef.current.beam = curPhase === 3 ? 1.4 : 1.8;
        const beamY = 160 + Math.random() * (ch - 200);
        beamsRef.current.push({
          id: Date.now() + Math.random(),
          y: beamY,
          height: 24,
          state: 'charging',
          timer: 0.6,
        });
        bossAudio.playBeamCharge();
      }

      // Update Beams
      beamsRef.current.forEach((b) => {
        b.timer -= dt;
        if (b.state === 'charging' && b.timer <= 0) {
          b.state = 'firing';
          b.timer = 0.22;
          bossAudio.playBeamFire();
        }
      });
      beamsRef.current = beamsRef.current.filter((b) => b.timer > 0);

      // Beam Hit Test on Player
      beamsRef.current.forEach((b) => {
        if (b.state === 'firing') {
          if (py >= b.y - b.height / 2 && py <= b.y + b.height / 2) {
            damagePlayer();
          }
        }
      });

      // Spawn Falling Audit Stamps
      nextSpawnTimeRef.current.stamp -= dt;
      if (nextSpawnTimeRef.current.stamp <= 0 && !isStunnedRef.current && !isDying) {
        nextSpawnTimeRef.current.stamp = curPhase === 1 ? 0.9 : 1.3;
        stampsRef.current.push({
          id: Date.now() + Math.random(),
          x: 40 + Math.random() * (cw - 80),
          y: -20,
          size: 26,
          vy: 160 + Math.random() * 80,
        });
      }

      // Update Falling Stamps
      stampsRef.current.forEach((s) => {
        s.y += s.vy * dt;
        // Collision with player
        if (Math.abs(px - s.x) < 22 && Math.abs(py - s.y) < 22) {
          damagePlayer();
        }
      });
      stampsRef.current = stampsRef.current.filter((s) => s.y < ch + 30);

      // Phase 3: Spawn Falling Words
      if (curPhase === 3 && !isDying) {
        nextSpawnTimeRef.current.word -= dt;
        if (nextSpawnTimeRef.current.word <= 0) {
          nextSpawnTimeRef.current.word = 2.4;
          const wordText = FORBIDDEN_WORDS_PHASE3[Math.floor(Math.random() * FORBIDDEN_WORDS_PHASE3.length)];
          wordsRef.current.push({
            id: Date.now() + Math.random(),
            text: wordText,
            x: 60 + Math.random() * (cw - 160),
            y: -10,
            vy: 65,
            redacted: false,
          });
        }

        wordsRef.current.forEach((w) => {
          w.y += w.vy * dt;
          if (w.y > ch - 20 && !w.redacted) {
            damagePlayer();
            w.redacted = true;
          }
        });
        wordsRef.current = wordsRef.current.filter((w) => w.y < ch + 20 && !w.redacted);
      }

      // 5. Draw Beams
      beamsRef.current.forEach((b) => {
        if (b.state === 'charging') {
          // Blinking dashed telegraph line
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(0, b.y);
          ctx.lineTo(cw, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Intense Laser Beam
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 20;
          ctx.fillRect(0, b.y - b.height / 2, cw, b.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, b.y - 3, cw, 6);
          ctx.shadowBlur = 0;
        }
      });

      // 6. Draw Falling Stamps
      stampsRef.current.forEach((s) => {
        ctx.fillStyle = '#1e212b';
        ctx.strokeStyle = '#ffb000';
        ctx.lineWidth = 1.5;
        ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
        ctx.strokeRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);

        ctx.fillStyle = '#ffb000';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AUDIT', s.x, s.y + 3);
      });

      // 7. Draw Phase 3 Falling Words
      if (curPhase === 3) {
        wordsRef.current.forEach((w) => {
          ctx.fillStyle = '#181b24';
          ctx.strokeStyle = '#ffb000';
          ctx.lineWidth = 1.5;
          const textWidth = ctx.measureText(w.text).width + 16;
          ctx.fillRect(w.x, w.y, textWidth, 24);
          ctx.strokeRect(w.x, w.y, textWidth, 24);

          ctx.fillStyle = '#f3f4f6';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(w.text, w.x + 8, w.y + 16);
        });
      }

      // 8. Render "THE OVERSEER" Central Eye (unless dying and fragmented)
      const bossX = 400;
      const bossY = 190;

      if (!isDying) {
        // Orbital Outer Ring
        ctx.strokeStyle = isStunnedRef.current ? '#38bdf8' : '#ffb000';
        ctx.lineWidth = 4;
        ctx.shadowColor = isStunnedRef.current ? '#38bdf8' : '#ffb000';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(bossX, bossY, 120, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Eyeball Sclera
        ctx.fillStyle = '#14161f';
        ctx.beginPath();
        ctx.ellipse(bossX, bossY, 120, 72, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris tracking player reticle
        const dx = px - bossX;
        const dy = py - bossY;
        const angle = Math.atan2(dy, dx);
        const dist = Math.min(32, Math.hypot(dx, dy) * 0.08);
        const irisX = bossX + Math.cos(angle) * dist;
        const irisY = bossY + Math.sin(angle) * dist;

        const isVulnerable = pupilOpenRef.current || isStunnedRef.current;

        // Iris ring
        ctx.fillStyle = isVulnerable ? '#ffb000' : '#454856';
        ctx.beginPath();
        ctx.arc(irisX, irisY, 44, 0, Math.PI * 2);
        ctx.fill();

        // Pupil: Opens or dilates when vulnerable
        const pupilRadius = isVulnerable ? 28 : 14;
        ctx.fillStyle = isVulnerable ? '#000000' : '#08090c';
        ctx.beginPath();
        ctx.arc(irisX, irisY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupil Core Target Cross
        if (isVulnerable) {
          ctx.strokeStyle = '#ffb000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(irisX, irisY, 18, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffb000';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(isStunnedRef.current ? 'STUNNED' : 'OPEN', irisX, irisY - 32);
        }
      } else {
        // Render Defeat Dither Fragments
        fragmentsRef.current.forEach((f) => {
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          ctx.fillStyle = '#ffb000';
          ctx.fillRect(f.x, f.y, f.size, f.size);
        });
      }

      // 9. Render Player Reticle (Ghost-ring cursor)
      const isInvuln = performance.now() - lastDamageTimeRef.current < 1200;
      ctx.strokeStyle = isInvuln ? '#38bdf8' : '#ffb000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Center crosshair dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Distance line from player to boss pupil when in damage range
      const distToPupil = Math.hypot(px - 400, py - 190);
      if (distToPupil < 85 && (pupilOpenRef.current || isStunnedRef.current)) {
        ctx.strokeStyle = 'rgba(255, 176, 0, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(400, 190);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [damagePlayer]);

  // Click on canvas to attack boss pupil or redact words
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked near boss pupil while open or stunned
    const distToPupil = Math.hypot(clickX - 400, clickY - 190);
    if (distToPupil < 70 && (pupilOpenRef.current || isStunnedRef.current)) {
      damageBoss(7);
      return;
    }

    // Phase 3: Check if clicked a falling word
    if (phaseRef.current === 3) {
      const clickedWord = wordsRef.current.find(
        (w) => !w.redacted && clickX >= w.x && clickX <= w.x + 120 && clickY >= w.y && clickY <= w.y + 30
      );
      if (clickedWord) {
        handleWordClick(clickedWord.id);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="The Overseer Boss Encounter"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-between p-4 bg-[#050608] select-none cursor-crosshair font-mono text-[#f3f4f6]"
    >
      {/* Top Status & Boss Health Bar */}
      <header className="w-full max-w-4xl flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-[#ffb000] animate-pulse" />
            <div>
              <span className="text-[10px] text-[#8d8d8d] uppercase tracking-widest block font-bold">
                FINAL CONFRONTATION // SECTOR 101
              </span>
              <h1 className="text-xl sm:text-2xl font-anton tracking-wide text-[#ffb000] uppercase">
                THE OVERSEER
              </h1>
            </div>
          </div>

          {/* Player Focus Points Health & Temporary Dev Skip Button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDefeated();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ef4444]/20 hover:bg-[#ef4444] text-[#ef4444] hover:text-white border border-[#ef4444]/70 transition-all font-mono text-[10px] uppercase font-bold tracking-wider shadow-[0_0_12px_rgba(239,68,68,0.35)] cursor-pointer"
              title="Dev bypass: Defeat boss and restore clean Stage 0 site"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Dev Skip (Defeat Boss)</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#a0a1ab] font-bold">FOCUS:</span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rotate-45 border-2 transition-all ${
                      i < focusPoints
                        ? 'bg-[#ffb000] border-white shadow-[0_0_10px_#ffb000]'
                        : 'bg-[#1a1c22] border-[#393b45]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="relative w-full h-4 bg-[#14161e] border-2 border-[#ffb000]/80 rounded-none overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#d97706] to-[#ffb000] transition-all duration-100"
            style={{ width: `${bossHp}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold">
            <span className="text-black drop-shadow">PHASE {phase} / 3</span>
            <span className="text-white drop-shadow font-mono">{bossHp} / 100 HP</span>
          </div>
        </div>
      </header>

      {/* Main Boss CRT Canvas Arena */}
      <div className="relative my-auto w-full max-w-4xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={520}
          onClick={handleCanvasClick}
          onPointerMove={handlePointerMove}
          className="w-full max-h-[64vh] rounded-none border-2 border-[#ffb000]/40 bg-black block shadow-[0_0_50px_rgba(255,176,0,0.2)]"
        />

        {/* Phase 2: Simon Repeat Pad Overlays at bottom */}
        {phase === 2 && !isDying && (
          <div className="absolute bottom-4 inset-x-8 flex items-center justify-center gap-3 pointer-events-auto">
            {[0, 1, 2, 3].map((idx) => {
              const isLit = activeSimonPad === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSimonInput(idx)}
                  className={`px-4 py-2 border-2 font-mono font-bold text-xs uppercase transition-all ${
                    isLit
                      ? 'bg-[#ffb000] text-black border-white scale-110 shadow-[0_0_18px_#ffb000]'
                      : 'bg-[#151720]/90 text-[#ffb000] border-[#ffb000]/70 hover:bg-[#ffb000]/20'
                  }`}
                >
                  [{idx + 1}] PAD {idx + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Stun Banner */}
        {isStunned && (
          <div className="absolute top-6 px-4 py-1.5 bg-[#38bdf8]/20 border-2 border-[#38bdf8] text-[#38bdf8] font-bold text-xs uppercase tracking-wider animate-bounce pointer-events-none">
            OVERSEER STUNNED! ATTACK THE PUPIL! ({stunTimeLeft.toFixed(1)}s)
          </div>
        )}

        {/* Respawning / Phase Checkpoint Alert */}
        {isRespawning && (
          <div className="absolute inset-0 bg-red-950/70 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="text-center font-bold text-red-300">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2 animate-bounce" />
              <div className="text-lg uppercase">FOCUS DEPLETED</div>
              <div className="text-xs text-red-400">Restarting Phase {phase} Checkpoint...</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions Bar */}
      <footer className="w-full max-w-4xl flex items-center justify-between text-xs text-[#8d8d8d] pb-2 border-t border-[#1e202a] pt-2">
        <div className="flex items-center gap-4">
          <span>Controls: Mouse/Touch drag or WASD/Arrow Keys</span>
          <span>Attack: Click / Tap / Spacebar on Open Pupil</span>
        </div>
        <div className="text-[#ffb000] font-bold">
          {phase === 1 && 'DODGE SCAN BEAMS // ATTACK VULNERABLE PUPIL'}
          {phase === 2 && 'REPEAT SIMON CADENCE (1-4) TO STUN EYE'}
          {phase === 3 && 'CLICK / TYPE FALLING FORBIDDEN WORDS TO REDACT'}
        </div>
      </footer>
    </div>
  );
};
