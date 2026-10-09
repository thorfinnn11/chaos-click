import React, { useEffect, useState } from 'react';

interface GhostCursorProps {
  enabled: boolean;
  chaosLevel: number;
}

export const GhostCursor: React.FC<GhostCursorProps> = ({ enabled, chaosLevel }) => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ghostPos, setGhostPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Follow with slight latency and jitter
    const timer = setInterval(() => {
      setGhostPos((prev) => {
        const jitter = (Math.random() - 0.5) * (chaosLevel * 0.4);
        const dx = (pos.x - prev.x) * 0.18;
        const dy = (pos.y - prev.y) * 0.18;
        return {
          x: prev.x + dx + jitter,
          y: prev.y + dy + jitter,
        };
      });
    }, 16);

    return () => clearInterval(timer);
  }, [enabled, pos, chaosLevel]);

  if (!enabled || pos.x < 0) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9990] transition-opacity duration-300"
      style={{
        left: `${ghostPos.x + 24}px`,
        top: `${ghostPos.y + 24}px`,
      }}
    >
      <div className="relative flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#181a20]/95 border border-[#ffb000]/70 text-amber-300 text-[10px] font-mono shadow-[0_0_12px_rgba(255,176,0,0.35)] backdrop-blur-sm animate-pulse">
        <span>👁️</span>
        <span>GHOST_CURR</span>
      </div>
    </div>
  );
};
