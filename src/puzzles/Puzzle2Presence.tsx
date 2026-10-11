import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PuzzleProps } from './types';
import { audioEngine } from '../utils/audioEngine';

/**
 * Puzzle 2 (Entering Stage 2): "Presence check"
 * Simon sequence memory with 4 amber pads and procedural Web Audio tones.
 * Keys 1 to 4 also activate pads.
 */
export const Puzzle2Presence: React.FC<PuzzleProps> = ({
  stage,
  seed,
  assist,
  onSolved,
  onFail,
}) => {
  const totalRounds = assist ? 3 : 5;
  const isSolvedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const padLabels = [
    { num: '1', title: 'ATTENTION', code: '01' },
    { num: '2', title: 'COHERENCE', code: '02' },
    { num: '3', title: 'ALIGNMENT', code: '03' },
    { num: '4', title: 'ATTENDANCE', code: '04' },
  ];

  // Synchronously generate deterministic sequence so it is never empty on initial mount
  const fullSequence = useMemo(() => {
    let s = seed || 42;
    const seq: number[] = [];
    for (let i = 0; i < totalRounds; i++) {
      s = (s * 9301 + 49297) % 233280;
      seq.push(Math.floor((s / 233280) * 4));
    }
    return seq;
  }, [seed, totalRounds]);

  const [currentRound, setCurrentRound] = useState(1);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [isPlayback, setIsPlayback] = useState(true);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Observe biometric pulse pattern...');
  const [isErrorFlash, setIsErrorFlash] = useState(false);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Play a pad with audio and visual feedback
  const flashPad = useCallback(
    (index: number, duration: number = 320) => {
      setActivePad(index);
      const dissonance = (currentRound - 1) / (totalRounds || 1);
      audioEngine.playSimonTone(index, dissonance * 0.7);
      const t = setTimeout(() => {
        setActivePad((cur) => (cur === index ? null : cur));
      }, duration);
      timeoutsRef.current.push(t);
    },
    [currentRound, totalRounds]
  );

  // Play current round sequence
  const playSequence = useCallback(
    (round: number) => {
      clearAllTimeouts();
      setIsPlayback(true);
      setStatusMessage(`Round ${round} of ${totalRounds} // Recording telemetry...`);
      setPlayerIndex(0);

      const targetSeq = fullSequence.slice(0, round);
      const stepInterval = assist ? 550 : 420;

      targetSeq.forEach((padIdx, i) => {
        const t1 = setTimeout(() => {
          flashPad(padIdx, assist ? 380 : 280);
          if (i === targetSeq.length - 1) {
            const t2 = setTimeout(() => {
              setIsPlayback(false);
              setStatusMessage(`Your turn // Repeat ${round} pulse${round > 1 ? 's' : ''}`);
            }, stepInterval);
            timeoutsRef.current.push(t2);
          }
        }, (i + 1) * stepInterval);
        timeoutsRef.current.push(t1);
      });
    },
    [assist, clearAllTimeouts, flashPad, fullSequence, totalRounds]
  );

  // Start sequence on mount or round change
  useEffect(() => {
    const timer = setTimeout(() => {
      playSequence(currentRound);
    }, 600);
    timeoutsRef.current.push(timer);
    return () => clearTimeout(timer);
  }, [currentRound, playSequence]);

  // Handle player pressing a pad
  const handlePadPress = useCallback(
    (padIndex: number) => {
      if (isPlayback || isSolvedRef.current) return;

      flashPad(padIndex, 220);
      const expectedPad = fullSequence[playerIndex];

      if (padIndex === expectedPad) {
        // Correct step
        const nextIndex = playerIndex + 1;
        setPlayerIndex(nextIndex);

        if (nextIndex === currentRound) {
          // Completed current round!
          if (currentRound >= totalRounds) {
            // Solved puzzle!
            if (!isSolvedRef.current) {
              isSolvedRef.current = true;
              setStatusMessage('Attestation verified. Presence confirmed.');
              audioEngine.playNotificationChime();
              const t = setTimeout(() => {
                onSolved();
              }, 400);
              timeoutsRef.current.push(t);
            }
          } else {
            // Next round
            setStatusMessage(`Verification step ${currentRound} accepted.`);
            audioEngine.playMechanicalClick();
            const t = setTimeout(() => {
              setCurrentRound((r) => r + 1);
            }, 600);
            timeoutsRef.current.push(t);
          }
        }
      } else {
        // Mistake!
        setIsErrorFlash(true);
        audioEngine.playGlitchBurst();
        setStatusMessage('Biometric mismatch detected. Re-evaluating baseline...');
        onFail();
        const t = setTimeout(() => {
          setIsErrorFlash(false);
          setPlayerIndex(0);
          playSequence(currentRound);
        }, 900);
        timeoutsRef.current.push(t);
      }
    },
    [isPlayback, flashPad, fullSequence, playerIndex, currentRound, totalRounds, onSolved, onFail, playSequence]
  );

  // Keyboard navigation 1-4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPlayback || isSolvedRef.current) return;
      if (e.key === '1') { e.preventDefault(); handlePadPress(0); }
      if (e.key === '2') { e.preventDefault(); handlePadPress(1); }
      if (e.key === '3') { e.preventDefault(); handlePadPress(2); }
      if (e.key === '4') { e.preventDefault(); handlePadPress(3); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePadPress, isPlayback]);

  return (
    <div
      className={`flex flex-col gap-5 p-6 bg-[#141519] border ${
        isErrorFlash ? 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-[#2d2f38]'
      } rounded-xl text-[#f3f4f6] font-saas shadow-2xl select-none transition-colors duration-200`}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#242630] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping" />
            <span className="text-[10px] tracking-wider uppercase font-semibold text-[#f59e0b]">
              Halcyon Identity &amp; Presence Gate
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#f3f4f6]">
            Cognitive Attestation Check
          </h2>
          <p className="text-xs text-[#9a9ba4] mt-0.5">
            Repeat the corporate cadence sequence to affirm active presence at this terminal.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono text-[#8d8d8d]">
            Round: <strong className="text-[#f59e0b]">{currentRound} / {totalRounds}</strong>
          </span>
        </div>
      </div>

      {/* Status Line */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0c0d10] border border-[#20222a] rounded-lg text-xs font-mono">
        <span className={isPlayback ? 'text-[#f59e0b]' : 'text-[#a1a1aa]'}>
          {statusMessage}
        </span>
        <span className="text-[11px] text-[#6b7280]">
          {isPlayback ? 'SYSTEM TRANSMITTING' : 'LISTENING (Keys 1-4)'}
        </span>
      </div>

      {/* 4 Amber Pads Grid */}
      <div className="grid grid-cols-2 gap-3.5 my-1">
        {padLabels.map((pad, idx) => {
          const isLit = activePad === idx;
          return (
            <button
              key={pad.code}
              type="button"
              disabled={isPlayback}
              onClick={() => handlePadPress(idx)}
              className={`relative h-28 rounded-lg p-3 text-left font-mono border transition-all duration-150 flex flex-col justify-between ${
                isLit
                  ? 'bg-[#f59e0b] border-white text-black shadow-[0_0_28px_rgba(245,158,11,0.7)] scale-[1.02]'
                  : 'bg-[#1b1d24] border-[#2e313d] hover:border-[#f59e0b]/60 text-[#d1d5db]'
              } ${isPlayback ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-95'}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[11px] font-bold ${isLit ? 'text-black' : 'text-[#f59e0b]'}`}>
                  [{pad.code}]
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${isLit ? 'bg-black text-white' : 'bg-[#292c37] text-[#9ca3af]'}`}>
                  KEY {pad.num}
                </span>
              </div>
              <div>
                <div className={`text-xs font-bold tracking-wider ${isLit ? 'text-black' : 'text-[#e5e7eb]'}`}>
                  {pad.title}
                </div>
                <div className={`text-[9px] mt-0.5 ${isLit ? 'text-black/80' : 'text-[#71717a]'}`}>
                  FREQUENCY CHANNEL #{idx + 1}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Footer */}
      <div className="flex items-center justify-between text-[11px] text-[#71727d] border-t border-[#242630] pt-3">
        <span>Press buttons with Mouse, Touch, or Keys 1 - 4</span>
        {assist && <span className="text-[#f59e0b] font-semibold">Reduced Friction Active (3 rounds)</span>}
      </div>
    </div>
  );
};
