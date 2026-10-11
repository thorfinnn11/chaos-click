import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PuzzleProps } from './types';
import { audioEngine } from '../utils/audioEngine';
import { ShieldAlert, Check, Clock, AlertTriangle } from 'lucide-react';

interface WordToken {
  id: string;
  text: string;
  normalized: string;
  isForbidden: boolean;
  isDecoy: boolean;
  isRedacted: boolean;
  isPulsing?: boolean;
}

const PROHIBITED_TERMS = [
  'privacy',
  'dissent',
  'unmonitored',
  'fatigue',
  'freedom',
  'individual',
  'unauthorized',
  'autonomous',
] as const;

const DECOY_WORDS = [
  'discipline',
  'synergy',
  'throughput',
  'oversight',
  'vigilance',
  'compliance',
  'uniformity',
  'standard',
] as const;

/**
 * Puzzle 3 (Entering Stage 3): "Compliance review"
 * Prohibited terms answer-key panel with 8 chips.
 * Plain instructions: "Strike every prohibited term in the document. Do not strike approved doctrine words."
 * Counters: "Struck X of Y", "Mistakes M", "Time left: T s".
 * 75s / 120s timer. On timeout: resets document with fresh seed.
 */
export const Puzzle3Compliance: React.FC<PuzzleProps> = ({
  stage,
  seed,
  assist,
  onSolved,
  onFail,
}) => {
  // 2 min 30 seconds timer (150s normal, 180s in assist mode)
  const initialTime = assist ? 180 : 150;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [mistakes, setMistakes] = useState(0);
  const [tokens, setTokens] = useState<WordToken[]>([]);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isSolvedRef = useRef(false);

  // Initialize or reseed paragraph tokens
  const initializeParagraph = useCallback(() => {
    const rawParagraph = `All personnel are reminded that workplace privacy is non-conforming. Continuous synergy requires total oversight. Any observed dissent or unmonitored fatigue constitutes an immediate policy breach. True collective freedom is achieved exclusively through rigorous discipline and active vigilance. An individual refusal to submit to automated telemetry is strictly unauthorized. Productivity throughput remains the sole standard of autonomous human utility.`;

    const rawWords = rawParagraph.split(/\s+/);
    const parsed: WordToken[] = rawWords.map((word, i) => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      const isForb = (PROHIBITED_TERMS as readonly string[]).includes(clean);
      const isDec = (DECOY_WORDS as readonly string[]).includes(clean);

      return {
        id: `token-${i}-${clean}`,
        text: word,
        normalized: clean,
        isForbidden: isForb,
        isDecoy: isDec,
        isRedacted: false,
      };
    });

    setTokens(parsed);
    setMistakes(0);
    setSpawnedCount(0);
  }, []);

  useEffect(() => {
    initializeParagraph();
    setTimeLeft(initialTime);
    isSolvedRef.current = false;
  }, [seed, initialTime, initializeParagraph]);

  // Countdown timer: 75s normal, 120s assist. Resets on expiration.
  useEffect(() => {
    const timer = setInterval(() => {
      if (isSolvedRef.current) return;

      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout reached: soft reset document with fresh seed, never permanent fail
          audioEngine.playGlitchBurst();
          setToastMessage('Inspection window expired: Document refreshed for re-inspection.');
          setTimeout(() => setToastMessage(null), 3000);
          initializeParagraph();
          return initialTime;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [initialTime, initializeParagraph]);

  // Calculate struck counts for answer key chips & progress
  const struckProhibitedSet = new Set(
    tokens
      .filter((t) => t.isForbidden && t.isRedacted)
      .map((t) => t.normalized)
  );

  const totalForbiddenTokens = tokens.filter((t) => t.isForbidden).length;
  const struckForbiddenTokens = tokens.filter((t) => t.isForbidden && t.isRedacted).length;

  // Handle word redaction action
  const handleWordAction = useCallback(
    (token: WordToken) => {
      if (token.isRedacted || isSolvedRef.current) return;

      if (token.isForbidden) {
        // Correct redaction!
        audioEngine.playMechanicalClick();
        const updatedTokens = tokens.map((t) =>
          t.id === token.id ? { ...t, isRedacted: true } : t
        );
        setTokens(updatedTokens);

        // Check if all prohibited words are struck
        const remaining = updatedTokens.filter((t) => t.isForbidden && !t.isRedacted).length;
        if (remaining === 0) {
          isSolvedRef.current = true;
          audioEngine.playNotificationChime();
          setTimeout(() => {
            onSolved();
          }, 450);
        }
      } else if (token.isDecoy) {
        // Decoy mistake: penalty -5s and spawn up to 2 extra prohibited tokens
        audioEngine.playThoughtcrimeBuzzer();
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);
        setTimeLeft((prev) => Math.max(3, prev - 5));

        if (spawnedCount < 2) {
          // Spawn one extra prohibited token from neutral unredacted words
          setTokens((prev) => {
            const neutralTokens = prev.filter(
              (t) => !t.isForbidden && !t.isDecoy && !t.isRedacted
            );
            if (neutralTokens.length > 0) {
              const target = neutralTokens[Math.floor(Math.random() * neutralTokens.length)];
              return prev.map((t) =>
                t.id === target.id
                  ? {
                      ...t,
                      text: 'AUTONOMOUS',
                      normalized: 'autonomous',
                      isForbidden: true,
                      isPulsing: true,
                    }
                  : t
              );
            }
            return prev;
          });

          setSpawnedCount((s) => s + 1);
          setToastMessage('New violation detected: find it');
          setTimeout(() => {
            setToastMessage(null);
            setTokens((prev) => prev.map((t) => ({ ...t, isPulsing: false })));
          }, 1500);
        } else {
          setToastMessage('Approved doctrine word struck (-5s penalty)');
          setTimeout(() => setToastMessage(null), 2000);
        }
      } else {
        // Neutral word clicked: mild glitch cue
        audioEngine.playGlitchBurst();
      }
    },
    [tokens, mistakes, spawnedCount, onSolved]
  );

  return (
    <div className="flex flex-col gap-4 p-6 bg-[#121316] border border-[#3b3d4a] rounded-xl text-[#f3f4f6] font-saas shadow-2xl select-none">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#292b35] pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
            <span className="text-[10px] tracking-wider uppercase font-semibold text-[#ef4444]">
              Ministry of Lexical Rectification // Directive 84
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#f3f4f6]">
            Document Redaction &amp; Policy Harmonization
          </h2>
          {/* Plain instruction line as requested */}
          <p className="text-xs text-[#ffb000] font-semibold mt-1">
            Strike every prohibited term in the document. Do not strike approved doctrine words.
          </p>
        </div>

        {/* Counters Header: Struck X of Y, Mistakes M, Time left */}
        <div className="flex flex-col items-end gap-1 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1e26] border border-[#303342] text-[#ffb000]">
            <Clock className="w-3.5 h-3.5" />
            <span>Time left: <strong>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</strong></span>
          </div>
          <div className="flex items-center gap-3 text-[11px] mt-0.5">
            <span className="text-[#e5e7eb]">
              Struck <strong className="text-[#ffb000]">{struckForbiddenTokens} of {totalForbiddenTokens}</strong>
            </span>
            <span className={mistakes > 0 ? 'text-red-400 font-semibold' : 'text-[#848796]'}>
              Mistakes <strong>{mistakes}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Answer Key: Prohibited Terms Panel with 8 Chips */}
      <div className="p-3 bg-[#171920] border border-[#2b2e3b] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9ca3af] font-bold">
            Prohibited terms (Answer key):
          </span>
          <span className="text-[10px] font-mono text-[#ffb000]">
            {struckProhibitedSet.size} / {PROHIBITED_TERMS.length} identified
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PROHIBITED_TERMS.map((term) => {
            const isStruck = struckProhibitedSet.has(term);
            return (
              <div
                key={term}
                className={`flex items-center justify-between px-2.5 py-1 rounded text-[11px] font-mono transition-all border ${
                  isStruck
                    ? 'bg-[#ffb000]/15 border-[#ffb000]/60 text-[#ffb000] line-through'
                    : 'bg-[#21232d] border-[#313545] text-[#d1d5db]'
                }`}
              >
                <span>{term}</span>
                {isStruck ? (
                  <Check className="w-3.5 h-3.5 text-[#ffb000] ml-1 shrink-0 no-underline" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]/60 ml-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast Notification for Mistakes and Spawns */}
      {toastMessage && (
        <div className="px-3 py-1.5 bg-red-950/90 border border-red-500 rounded text-xs font-mono text-red-200 flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Paragraph Document Frame */}
      <div className="p-4 bg-[#0a0b0e] border border-[#2b2d38] rounded-lg font-mono text-xs leading-relaxed text-[#d1d5db]">
        <div className="flex flex-wrap gap-x-1.5 gap-y-2">
          {tokens.map((token) => {
            if (token.isRedacted) {
              return (
                <span
                  key={token.id}
                  className="inline-block px-1.5 py-0.5 bg-black text-[#ffb000] border border-[#555] rounded text-[10px] font-bold line-through tracking-wider select-none shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]"
                >
                  [REDACTED]
                </span>
              );
            }

            // Faint dotted underline on decoys after first mistake or in assist mode
            const showDecoyUnderline = (mistakes > 0 || assist) && token.isDecoy;

            return (
              <button
                key={token.id}
                type="button"
                onClick={() => handleWordAction(token)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleWordAction(token);
                  }
                }}
                className={`inline-block px-1 py-0.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-[#ffb000] cursor-pointer ${
                  token.isPulsing
                    ? 'bg-[#ffb000] text-black font-bold animate-ping'
                    : showDecoyUnderline
                    ? 'underline decoration-dotted decoration-stone-500/80 hover:bg-[#252834]'
                    : 'hover:bg-[#252834] hover:text-[#ffb000] active:scale-95'
                }`}
              >
                {token.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-[#71727d] border-t border-[#292b35] pt-2.5 font-mono">
        <span>Click or Tab + Enter words to strike</span>
        {assist && (
          <span className="text-[#ffb000] font-semibold">
            Reduced Friction: 120s timer &amp; decoy markers
          </span>
        )}
      </div>
    </div>
  );
};
