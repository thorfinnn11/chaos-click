import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PuzzleProps } from './types';
import { audioEngine } from '../utils/audioEngine';
import { ShieldCheck, Cpu, ArrowUpRight } from 'lucide-react';

/**
 * Puzzle 1 (Entering Stage 1): "Quick calibration"
 * Sincere SaaS onboarding styling.
 * Keep reticle inside a drifting Lissajous ring for 8 cumulative seconds.
 * 
 * Tuned targets:
 * - Ring radius: clamp(0.14 * min(w, h), 70px, 120px), shrinks at most 20%, min 56px
 * - Ring motion: x = A*sin(0.45t), y = B*sin(0.31t + 1), peak speed <= 90 px/s
 * - Hit test: dist <= ring radius + 10px
 * - Progress: fills at 1/8 per second; outside drains at 0.3x fill rate after 0.5s grace
 * - Checkpoints: locks in at 25%, 50%, 75%
 * - Keyboard: 360 px/s (Shift = 1.8x / 648 px/s), normalized diagonals
 * - Timing: performance.now() dt clamped to 50ms, direct DOM updates via refs
 * - Reduce Friction: 5s target, 1.4x radius, 0.5x speed, no shrink, no drain
 */
export const Puzzle1Calibration: React.FC<PuzzleProps> = ({
  stage,
  seed,
  assist: propAssist,
  onSolved,
  onFail,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringElRef = useRef<HTMLDivElement>(null);
  const reticleElRef = useRef<HTMLDivElement>(null);

  // Assist / Reduce friction toggle
  const [localAssist, setLocalAssist] = useState(propAssist);
  const [showAssistOffer, setShowAssistOffer] = useState(false);
  const isAssist = propAssist || localAssist;
  const targetSeconds = isAssist ? 5 : 8;

  // UI state for React (updated at throttled intervals or discrete events)
  const [progressSec, setProgressSec] = useState(0);
  const [isInside, setIsInside] = useState(false);
  const [checkpoint, setCheckpoint] = useState(0);

  // High-performance animation refs (0 React renders per frame)
  const reticleRef = useRef({ x: 220, y: 140 });
  const progressRef = useRef(0);
  const highestCheckpointRef = useRef(0);
  const outsideGraceRef = useRef(0);
  const isInsideRef = useRef(false);
  const isSolvedRef = useRef(false);
  const lastTimeRef = useRef(performance.now());
  const elapsedTimeRef = useRef(0);
  const lastUiUpdateRef = useRef(0);

  // Key tracking for smooth keyboard movement
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)
      ) {
        e.preventDefault();
        keysPressedRef.current[key] = true;
      }
      if (e.key === 'Shift') {
        keysPressedRef.current['shift'] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)
      ) {
        keysPressedRef.current[key] = false;
      }
      if (e.key === 'Shift') {
        keysPressedRef.current['shift'] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Pointer position update (Instantaneous, 0ms lag via direct transform)
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(10, Math.min(rect.width - 10, e.clientX - rect.left));
    const y = Math.max(10, Math.min(rect.height - 10, e.clientY - rect.top));

    reticleRef.current = { x, y };
    if (reticleElRef.current) {
      reticleElRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, []);

  // Main 60/120fps Animation Loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    let animId: number;

    const loop = (now: number) => {
      // Delta time clamped to 50ms (0.05s)
      const rawDt = (now - lastTimeRef.current) / 1000;
      const dt = Math.min(0.05, Math.max(0, rawDt));
      lastTimeRef.current = now;

      const container = containerRef.current;
      const w = container ? container.clientWidth : 460;
      const h = container ? container.clientHeight : 280;
      const halfW = w / 2;
      const halfH = h / 2;

      // 1. Keyboard velocity integration (360 px/s, Shift = 1.8x, normalized diagonals)
      let kx = 0;
      let ky = 0;
      const keys = keysPressedRef.current;
      if (keys['arrowup'] || keys['w']) ky -= 1;
      if (keys['arrowdown'] || keys['s']) ky += 1;
      if (keys['arrowleft'] || keys['a']) kx -= 1;
      if (keys['arrowright'] || keys['d']) kx += 1;

      if (kx !== 0 || ky !== 0) {
        const len = Math.hypot(kx, ky);
        const normX = kx / len;
        const normY = ky / len;
        const speed = keys['shift'] ? 360 * 1.8 : 360;
        const newX = Math.max(10, Math.min(w - 10, reticleRef.current.x + normX * speed * dt));
        const newY = Math.max(10, Math.min(h - 10, reticleRef.current.y + normY * speed * dt));
        reticleRef.current = { x: newX, y: newY };
        if (reticleElRef.current) {
          reticleElRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        }
      }

      // 2. Lissajous Ring Motion:
      // x = A*sin(0.45t), y = B*sin(0.31t + 1), A & B are ~30% of container half-size
      // Peak speed is ~35 px/s (well below target limit of 90 px/s)
      const motionSpeed = isAssist ? 0.5 : 1.0;
      const t = (now / 1000) * motionSpeed;
      const A = halfW * 0.30;
      const B = halfH * 0.30;
      const currentRingX = halfW + A * Math.sin(0.45 * t);
      const currentRingY = halfH + B * Math.sin(0.31 * t + 1.0);

      // 3. Ring radius: clamp(0.14 * min(w, h), 70px, 120px)
      // Shrinks to at most 80% of start radius, never below 56px (no shrink in assist mode)
      const minDimension = Math.min(w, h);
      const baseRadius = Math.min(120, Math.max(70, 0.14 * minDimension));
      const effectiveBaseRadius = isAssist ? baseRadius * 1.4 : baseRadius;
      const progressRatio = Math.min(1, progressRef.current / targetSeconds);
      const shrinkAmount = isAssist ? 0 : progressRatio * (effectiveBaseRadius * 0.20);
      const currentRadius = Math.max(56, effectiveBaseRadius - shrinkAmount);

      // Direct DOM update for ring position & size (bypasses React render overhead)
      if (ringElRef.current) {
        ringElRef.current.style.transform = `translate3d(${currentRingX - currentRadius}px, ${currentRingY - currentRadius}px, 0)`;
        ringElRef.current.style.width = `${currentRadius * 2}px`;
        ringElRef.current.style.height = `${currentRadius * 2}px`;
      }

      // 4. Hit test: inside when dist <= ring radius + 10px
      const dist = Math.hypot(
        reticleRef.current.x - currentRingX,
        reticleRef.current.y - currentRingY
      );
      const inside = dist <= currentRadius + 10;

      if (inside !== isInsideRef.current) {
        isInsideRef.current = inside;
        setIsInside(inside);
      }

      // 5. Progress accumulation & drain with checkpoints:
      // Inside: fills at 1/8 per second
      // Outside: drains at 0.3x fill rate, after 0.5s grace period (no drain in assist mode)
      if (inside) {
        outsideGraceRef.current = 0;
        progressRef.current = Math.min(targetSeconds, progressRef.current + dt);

        // Checkpoint locking: 25%, 50%, 75%
        const curFraction = progressRef.current / targetSeconds;
        const curCheckpoint = Math.floor(curFraction / 0.25) * 0.25;
        if (curCheckpoint > highestCheckpointRef.current) {
          highestCheckpointRef.current = curCheckpoint;
          setCheckpoint(curCheckpoint);
        }
      } else {
        outsideGraceRef.current += dt;
        if (outsideGraceRef.current > 0.5 && !isAssist) {
          const drainPerSec = (1 / 8) * 0.3 * targetSeconds; // 0.3x fill rate
          const floorLimit = highestCheckpointRef.current * targetSeconds;
          progressRef.current = Math.max(floorLimit, progressRef.current - drainPerSec * dt);
        }
      }

      // 6. Elapsed time tracking: auto-offer assist if progress < 15% after 25s
      elapsedTimeRef.current += dt;
      if (
        !isAssist &&
        elapsedTimeRef.current >= 25 &&
        progressRef.current / targetSeconds < 0.15
      ) {
        setShowAssistOffer(true);
      }

      // 7. Throttled UI state updates (every ~75ms)
      if (now - lastUiUpdateRef.current > 75 || progressRef.current >= targetSeconds) {
        lastUiUpdateRef.current = now;
        setProgressSec(progressRef.current);
      }

      // 8. Solved trigger
      if (progressRef.current >= targetSeconds && !isSolvedRef.current) {
        isSolvedRef.current = true;
        audioEngine.playNotificationChime();
        onSolved();
        return;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isAssist, targetSeconds, onSolved]);

  const percent = Math.min(100, Math.round((progressSec / targetSeconds) * 100));

  return (
    <div className="flex flex-col gap-5 p-6 bg-[#16171b] border border-[#2a2c33] rounded-xl text-[#f3f4f6] font-saas shadow-2xl select-none">
      {/* SaaS Modal Header */}
      <div className="flex items-start justify-between border-b border-[#23252c] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#ffb000] animate-pulse" />
            <span className="text-[10px] tracking-wider uppercase font-semibold text-[#ffb000]">
              Halcyon Onboarding // Baseline
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#f3f4f6]">
            Pointer & Attention Calibration
          </h2>
          <p className="text-xs text-[#9a9ba4] mt-0.5">
            Keep your pointer inside the focal zone to calibrate telemetric synchronization.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] font-mono text-[#8d8d8d]">
            Target: <strong className="text-[#ffb000]">{targetSeconds}s</strong>
          </span>
          <button
            type="button"
            onClick={() => setLocalAssist(!localAssist)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
              isAssist
                ? 'bg-[#ffb000]/15 text-[#ffb000] border-[#ffb000]'
                : 'bg-[#22242c] text-[#8e909a] border-[#343640] hover:text-[#e4e5e9]'
            }`}
          >
            <Cpu className="w-3 h-3" />
            {isAssist ? 'Friction Reduced' : 'Reduce friction'}
          </button>
        </div>
      </div>

      {/* Auto Assist Recommendation Banner */}
      {showAssistOffer && !isAssist && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#ffb000]/10 border border-[#ffb000]/30 text-xs text-[#ffb000]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>High latency detected. Would you like to simplify synchronization?</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalAssist(true);
              setShowAssistOffer(false);
            }}
            className="px-2.5 py-1 bg-[#ffb000] text-black font-semibold rounded text-[11px] hover:bg-[#ffc033] transition-colors whitespace-nowrap ml-2"
          >
            Accept Assist
          </button>
        </div>
      )}

      {/* Interactive Drift Canvas Area */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerEnter={handlePointerMove}
        className="relative w-full h-[280px] bg-[#0e0f12] rounded-lg border border-[#25272e] overflow-hidden cursor-crosshair touch-none"
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffb000 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Drifting Lissajous Ring (Positioned directly via transform in RAF) */}
        <div
          ref={ringElRef}
          className={`absolute rounded-full pointer-events-none transition-[border-color,box-shadow,background-color] duration-150 border-2 ${
            isInside
              ? 'border-[#ffb000] bg-[#ffb000]/20 shadow-[0_0_35px_rgba(255,176,0,0.55),inset_0_0_20px_rgba(255,176,0,0.25)]'
              : 'border-[#4e5260] bg-[#1a1c22]/40 shadow-none'
          }`}
          style={{
            top: 0,
            left: 0,
            width: 140,
            height: 140,
            transform: 'translate3d(160px, 70px, 0)',
            willChange: 'transform, width, height',
          }}
        >
          {/* Ring Center Guidance Cross */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div
              className={`w-2 h-2 rounded-full transition-all duration-150 ${
                isInside
                  ? 'bg-[#ffb000] shadow-[0_0_8px_#ffb000]'
                  : 'bg-[#ffb000]/40'
              }`}
            />
          </div>
        </div>

        {/* User Reticle Marker (Positioned directly via transform in RAF or pointer events) */}
        <div
          ref={reticleElRef}
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            top: 0,
            left: 0,
            transform: 'translate3d(220px, 140px, 0)',
            willChange: 'transform',
          }}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 transition-all duration-100 ${
              isInside
                ? 'border-[#ffb000] scale-110 shadow-[0_0_14px_#ffb000]'
                : 'border-white/80'
            }`}
          />
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-sm" />
        </div>

        {/* On-screen status badge */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono pointer-events-none">
          <span
            className={`flex items-center gap-1.5 ${
              isInside ? 'text-[#ffb000] font-semibold' : 'text-[#6f707a]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isInside ? 'bg-[#ffb000] animate-ping' : 'bg-[#4b4e5c]'
              }`}
            />
            {isInside ? 'FOCAL LOCK ACQUIRED (+1/8s)' : 'ALIGN POINTER WITH RING (+10px grace)'}
          </span>
          <span className="text-[#a0a1ab]">
            {progressSec.toFixed(1)}s / {targetSeconds}s
          </span>
        </div>
      </div>

      {/* Progress & Checkpoint Guidance Footer */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#8d8d8d]">Calibration Progress</span>
            {checkpoint > 0 && (
              <span className="text-[10px] text-[#ffb000] px-1.5 py-0.2 rounded bg-[#ffb000]/10 border border-[#ffb000]/30 font-semibold">
                Lock: {Math.round(checkpoint * 100)}%
              </span>
            )}
          </div>
          <span className="text-[#ffb000] font-bold">{percent}%</span>
        </div>

        {/* Progress bar with visible 25%, 50%, 75% checkpoint nodes */}
        <div className="relative w-full h-2.5 bg-[#202229] rounded-full overflow-hidden border border-[#2a2c35]">
          <div
            className="h-full bg-gradient-to-r from-[#d97706] to-[#ffb000] transition-all duration-75"
            style={{ width: `${percent}%` }}
          />
          {/* Checkpoint tick marks */}
          <div className="absolute inset-0 flex justify-between px-[25%] pointer-events-none">
            <div className="w-[1px] h-full bg-[#3e414f]" />
            <div className="w-[1px] h-full bg-[#3e414f]" />
          </div>
          <div className="absolute top-0 bottom-0 left-[75%] w-[1px] bg-[#3e414f] pointer-events-none" />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#71727d] mt-1">
          <span>Controls: Pointer, Touch, or WASD/Arrows (Shift for 1.8x)</span>
          {isAssist ? (
            <span className="text-[#ffb000] font-semibold">
              Reduced Friction: 5s, enlarged ring, no drain
            </span>
          ) : (
            <span className="text-[#8a8c98]">Persistent Checkpoints: 25% / 50% / 75%</span>
          )}
        </div>
      </div>
    </div>
  );
};
