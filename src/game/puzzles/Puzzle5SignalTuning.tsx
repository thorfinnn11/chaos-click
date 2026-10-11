import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PuzzleProps } from '../../puzzles/types';
import { audioEngine } from '../../utils/audioEngine';
import { Activity, Radio, Cpu, RotateCw, Volume2 } from 'lucide-react';

export const Puzzle5SignalTuning: React.FC<PuzzleProps> = ({
  stage,
  seed,
  assist: initialAssist,
  onSolved,
  onFail,
}) => {
  const [localAssist, setLocalAssist] = useState(initialAssist);
  const assist = initialAssist || localAssist;

  // Target Parameters seeded deterministically
  const targetFreq = 2.4 + ((seed % 100) / 100) * 1.6; // 2.4 to 4.0 Hz
  const targetPhase = ((seed % 360) * Math.PI) / 180; // 0 to 2pi

  // Operator adjustable parameters
  const [userFreq, setUserFreq] = useState(1.4);
  const [userPhase, setUserPhase] = useState(0.2);

  const [holdProgress, setHoldProgress] = useState(0); // 0 to 2.0s
  const [isLocked, setIsLocked] = useState(false);
  const [coherence, setCoherence] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isSolvedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatOscRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);

  // Setup detuned beating audio cue
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(160, ctx.currentTime);
      osc2.frequency.setValueAtTime(160, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      beatOscRef.current = { osc1, osc2, gain };
      audioCtxRef.current = ctx;
    } catch {
      // ignore
    }

    return () => {
      if (beatOscRef.current) {
        try {
          beatOscRef.current.osc1.stop();
          beatOscRef.current.osc2.stop();
          beatOscRef.current.gain.disconnect();
        } catch {
          // ignore
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Update audio beating frequency as delta changes
  useEffect(() => {
    if (!beatOscRef.current || !audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    const freqDiff = Math.abs(userFreq - targetFreq);
    const phaseDiff = Math.abs((userPhase % (Math.PI * 2)) - (targetPhase % (Math.PI * 2)));

    // Error metric (0 to 1)
    const err = Math.min(1, freqDiff / 2.0 + (phaseDiff / Math.PI) * 0.5);
    const beatingHz = err * 16; // 0 to 16 Hz beating

    beatOscRef.current.osc1.frequency.setValueAtTime(160, now);
    beatOscRef.current.osc2.frequency.setValueAtTime(160 + beatingHz, now);

    // Fade gain as resonance is reached
    const volume = Math.max(0.005, 0.05 * err);
    beatOscRef.current.gain.gain.setValueAtTime(volume, now);
  }, [userFreq, userPhase, targetFreq, targetPhase]);

  // Main 60fps Oscilloscope Animation & Lock Detection
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let accumulatedHold = 0;

    const render = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const cy = h / 2;

      // 1. Clear background
      ctx.fillStyle = '#08090c';
      ctx.fillRect(0, 0, w, h);

      // Oscilloscope reticle grid
      ctx.strokeStyle = 'rgba(255, 176, 0, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center crosshair
      ctx.strokeStyle = 'rgba(255, 176, 0, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      const tSec = time / 1000;

      // 2. Draw Target Waveform (Dim Olive / Ghost Green)
      ctx.strokeStyle = '#387042';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const rad = (x / w) * Math.PI * 4 * targetFreq + tSec * 1.5 + targetPhase;
        const y = cy + Math.sin(rad) * (h * 0.32);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3. Draw Operator Waveform (Bright Radiant Phosphor Amber)
      ctx.strokeStyle = '#ffb000';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ffb000';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const rad = (x / w) * Math.PI * 4 * userFreq + tSec * 1.5 + userPhase;
        const y = cy + Math.sin(rad) * (h * 0.32);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Calculate Coherence / Error
      const freqDiff = Math.abs(userFreq - targetFreq);
      const phaseDiff = Math.abs((userPhase % (Math.PI * 2)) - (targetPhase % (Math.PI * 2)));
      const tolerance = assist ? 0.28 : 0.16;

      const isMatching = freqDiff < tolerance && phaseDiff < tolerance * 1.5;
      const currentCoherence = Math.max(
        0,
        Math.min(100, Math.round(100 - (freqDiff * 60 + phaseDiff * 30)))
      );
      setCoherence(currentCoherence);

      const targetHoldTime = assist ? 1.4 : 2.0;

      if (isMatching) {
        accumulatedHold += dt;
        setIsLocked(true);
      } else {
        accumulatedHold = Math.max(0, accumulatedHold - dt * 1.8);
        setIsLocked(false);
      }

      setHoldProgress(Math.min(targetHoldTime, accumulatedHold));

      // 5. Victory check
      if (accumulatedHold >= targetHoldTime && !isSolvedRef.current) {
        isSolvedRef.current = true;
        audioEngine.playNotificationChime();
        setTimeout(() => {
          onSolved();
        }, 400);
        return;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [userFreq, userPhase, targetFreq, targetPhase, assist, onSolved]);

  // Keyboard fine adjustments (Arrow Keys / WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 0.2 : 0.04;
      const phaseStep = e.shiftKey ? 0.3 : 0.08;

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setUserFreq((f) => Math.min(5.0, f + step));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setUserFreq((f) => Math.max(1.0, f - step));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setUserPhase((p) => (p + phaseStep) % (Math.PI * 2));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setUserPhase((p) => (p - phaseStep + Math.PI * 2) % (Math.PI * 2));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const targetHoldTime = assist ? 1.4 : 2.0;
  const holdPercent = Math.min(100, Math.round((holdProgress / targetHoldTime) * 100));

  return (
    <div className="flex flex-col gap-4 p-6 bg-[#0a0a0c] border-4 border-[#ffb000] rounded-none text-[#f3f4f6] font-mono shadow-[12px_12px_0_#ffb000] select-none">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-[#262832] pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-[#ffb000] animate-pulse" />
            <span className="text-[10px] tracking-wider uppercase font-bold text-[#ffb000]">
              OSCILLOSCOPE HARMONICS // CHANNEL 101
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#f3f4f6] uppercase tracking-wide">
            Signal Tuning Calibration
          </h2>
          <p className="text-xs text-[#9a9ba4] mt-0.5">
            Tune frequency &amp; phase to achieve phase lock with the central carrier wave.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setLocalAssist(!localAssist)}
            className={`text-[10px] px-2 py-0.5 border uppercase font-bold flex items-center gap-1 transition-colors ${
              assist
                ? 'bg-[#ffb000]/20 text-[#ffb000] border-[#ffb000]'
                : 'bg-[#1b1d24] text-[#8e909a] border-[#323542] hover:text-white'
            }`}
          >
            <Cpu className="w-3 h-3" />
            {assist ? 'Friction: Reduced' : 'Reduce friction'}
          </button>
        </div>
      </div>

      {/* Oscilloscope Screen Canvas */}
      <div className="relative w-full rounded border-2 border-[#ffb000]/80 overflow-hidden bg-black shadow-[inset_0_0_24px_rgba(0,0,0,0.95)]">
        <canvas
          ref={canvasRef}
          width={480}
          height={180}
          className="w-full h-[180px] block"
        />

        {/* Readout overlay inside screen */}
        <div className="absolute top-2 left-3 flex items-center gap-4 text-[10px] font-mono text-[#8d8d8d]">
          <span>CARRIER: {targetFreq.toFixed(2)}Hz</span>
          <span>OPERATOR: {userFreq.toFixed(2)}Hz</span>
          <span className={isLocked ? 'text-[#ffb000] font-bold' : 'text-[#6b7280]'}>
            {isLocked ? '● PHASE LOCK ACQUIRED' : '○ SEEKING RESONANCE'}
          </span>
        </div>

        <div className="absolute top-2 right-3 text-[10px] font-mono text-[#ffb000] font-bold">
          COHERENCE: {coherence}%
        </div>

        {/* Lock Hold Meter Bar inside Canvas */}
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[#1b1d24]">
          <div
            className="h-full bg-[#ffb000] shadow-[0_0_10px_#ffb000] transition-all duration-75"
            style={{ width: `${holdPercent}%` }}
          />
        </div>
      </div>

      {/* Dual Controls: Frequency & Phase Sliders / Dials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111318] p-3 border border-[#2b2d38]">
        {/* Frequency Dial */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#a0a1ab] font-bold">FREQUENCY (Hz)</span>
            <span className="text-[#ffb000] font-bold font-mono">{userFreq.toFixed(2)} Hz</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.02"
            value={userFreq}
            onChange={(e) => setUserFreq(parseFloat(e.target.value))}
            className="w-full accent-[#ffb000] cursor-pointer"
          />
          <span className="text-[10px] text-[#6b6e7d]">Adjust: Arrow Left / Right</span>
        </div>

        {/* Phase Dial */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#a0a1ab] font-bold">PHASE ANGLE (rad)</span>
            <span className="text-[#ffb000] font-bold font-mono">{(userPhase % (Math.PI * 2)).toFixed(2)} rad</span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.PI * 2}
            step="0.05"
            value={userPhase % (Math.PI * 2)}
            onChange={(e) => setUserPhase(parseFloat(e.target.value))}
            className="w-full accent-[#ffb000] cursor-pointer"
          />
          <span className="text-[10px] text-[#6b6e7d]">Adjust: Arrow Up / Down</span>
        </div>
      </div>

      {/* Lock Progress Indicator & Instructions */}
      <div className="flex items-center justify-between text-xs border-t-2 border-[#262832] pt-2">
        <span className="text-[#8d8d8d]">
          Hold resonance for <strong>{targetHoldTime}s</strong> to verify alignment.
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#ffb000] font-bold">
            LOCK: {holdPercent}% ({holdProgress.toFixed(1)}s / {targetHoldTime}s)
          </span>
        </div>
      </div>
    </div>
  );
};
