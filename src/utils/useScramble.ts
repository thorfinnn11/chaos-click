/* =========================================================================
   VISUAL LAYER ONLY
   Lightweight text scramble effect for step transitions (~300ms, ease-io).
   Reads the target text. Never mutates application state.
   ========================================================================= */

import { useState, useEffect, useRef } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>[]_';

export function useScrambleText(text: string, duration = 300): string {
  const [displayText, setDisplayText] = useState(text);
  const targetRef = useRef(text);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetRef.current === text) return;
    targetRef.current = text;

    const start = performance.now();
    const original = text;
    const len = original.length;

    const update = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);

      if (progress >= 1) {
        setDisplayText(original);
        animRef.current = null;
        return;
      }

      // Ease in-out factor
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const revealedCount = Math.floor(easedProgress * len);

      let result = '';
      for (let i = 0; i < len; i++) {
        if (original[i] === ' ' || original[i] === '\n') {
          result += original[i];
        } else if (i < revealedCount) {
          result += original[i];
        } else {
          result += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
        }
      }

      setDisplayText(result);
      animRef.current = requestAnimationFrame(update);
    };

    animRef.current = requestAnimationFrame(update);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [text, duration]);

  return displayText;
}
