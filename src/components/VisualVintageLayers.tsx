/* =========================================================================
   VISUAL LAYER ONLY
   This layer is strictly read-only. It observes existing state (chaos, clicks)
   and click events. It NEVER mutates application state or modifies handlers.
   Provides: Film grain canvas (~70ms), CRT scanlines, vignette, roll bar,
   fast flicker, horizontal difference tear bars, and click debris particles.
   ========================================================================= */

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface VisualVintageLayersProps {
  chaos: number; // 0 to 100
  clicks: number;
}

interface DebrisParticle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  glyph: string;
}

interface TearBarItem {
  id: number;
  top: number;
}

const DEBRIS_GLYPHS = ['#', '%', '&', '?', '!', '/', '+', 'x', '§', '¶'];

export const VisualVintageLayers: React.FC<VisualVintageLayersProps> = ({ chaos, clicks }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [debris, setDebris] = useState<DebrisParticle[]>([]);
  const [tearBars, setTearBars] = useState<TearBarItem[]>([]);

  // Chaos factor: normalized 0 to 1
  const c = Math.min(1, Math.max(0, chaos / 100));

  // Sync the CSS variable --c to the document root
  useEffect(() => {
    document.documentElement.style.setProperty('--c', c.toFixed(3));
  }, [c]);

  // 1. Live Film Grain: redrawn about every 70ms on small canvas, scaled up pixelated
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 128;
    const height = 128;
    canvas.width = width;
    canvas.height = height;

    let animId: number;
    let lastTime = 0;

    const renderNoise = (time: number) => {
      if (time - lastTime >= 70) {
        lastTime = time;
        const imgData = ctx.createImageData(width, height);
        const data = imgData.data;
        const len = data.length;
        for (let i = 0; i < len; i += 4) {
          const val = (Math.random() * 255) | 0;
          data[i] = val;     // R
          data[i + 1] = val; // G
          data[i + 2] = val; // B
          data[i + 3] = (Math.random() * 80) | 0; // Alpha
        }
        ctx.putImageData(imgData, 0, 0);
      }
      animId = requestAnimationFrame(renderNoise);
    };

    animId = requestAnimationFrame(renderNoise);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 2. Global Click Debris Listener (read-only passive event listener)
  const handleWindowClick = useCallback((e: MouseEvent) => {
    // Stage 0 has no click debris; debris begins starting from click 1
    if (clicks === 0) return;

    const count = Math.min(18, 4 + Math.floor(c * 14));
    const newParticles: DebrisParticle[] = [];
    const baseSpeed = 40 + c * 100;

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const dist = (Math.random() * baseSpeed) + 20;
      newParticles.push({
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        rot: (Math.random() - 0.5) * 360,
        glyph: DEBRIS_GLYPHS[Math.floor(Math.random() * DEBRIS_GLYPHS.length)],
      });
    }

    setDebris((prev) => [...prev.slice(-40), ...newParticles]);

    // Occasional horizontal screen tear bars at middle and higher chaos
    if (c >= 0.3 && Math.random() < 0.6) {
      setTearBars((prev) => [
        ...prev.slice(-3),
        { id: Date.now() + Math.random(), top: Math.random() * window.innerHeight },
      ]);
    }
  }, [c, clicks]);

  useEffect(() => {
    window.addEventListener('click', handleWindowClick, { passive: true });
    return () => window.removeEventListener('click', handleWindowClick);
  }, [handleWindowClick]);

  // Clean up debris particles after animation completes
  useEffect(() => {
    if (debris.length === 0) return;
    const timer = setTimeout(() => {
      setDebris((prev) => prev.slice(8));
    }, 700);
    return () => clearTimeout(timer);
  }, [debris]);

  // Clean up tear bars
  useEffect(() => {
    if (tearBars.length === 0) return;
    const timer = setTimeout(() => {
      setTearBars((prev) => prev.slice(1));
    }, 300);
    return () => clearTimeout(timer);
  }, [tearBars]);

  // Opacity calculations driven by chaos (Stage 0 has barely noticeable 0.02 - 0.03)
  const grainOpacity = Math.max(0.02, 0.03 + c * 0.35);
  const scanlinesOpacity = Math.max(0.02, 0.03 + c * 0.65);
  const vignetteOpacity = Math.max(0.04, 0.06 + c * 0.70);
  const rollBarOpacity = Math.max(0.01, 0.02 + c * 0.50);

  return (
    <>
      {/* Live Film Grain Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-[9970] mix-blend-overlay"
        style={{
          imageRendering: 'pixelated',
          opacity: grainOpacity,
          transition: 'opacity 0.4s var(--ease-out)',
        }}
      />

      {/* Repeating 1px Scanlines */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 pointer-events-none z-[9971] crt-scanlines ${c > 0.4 ? 'crt-flickering' : ''}`}
        style={{
          opacity: scanlinesOpacity,
          transition: 'opacity 0.4s var(--ease-out)',
        }}
      />

      {/* Radial Vignette */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[9972] crt-vignette"
        style={{
          opacity: vignetteOpacity,
          transition: 'opacity 0.4s var(--ease-out)',
        }}
      />

      {/* Slow Horizontal Amber Roll Bar */}
      {c > 0.05 && (
        <div
          aria-hidden="true"
          className="fixed inset-x-0 h-32 pointer-events-none z-[9973] crt-roll"
          style={{
            opacity: rollBarOpacity,
            transition: 'opacity 0.4s var(--ease-out)',
          }}
        />
      )}

      {/* Horizontal Difference Tear Bars */}
      {tearBars.map((tb) => (
        <div
          key={tb.id}
          className="tear-bar"
          style={{ top: `${tb.top}px` }}
        />
      ))}

      {/* Click Debris Glyphs (#%&?!/+x) */}
      {debris.map((item) => (
        <span
          key={item.id}
          className="debris-glyph"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            fontSize: `${12 + c * 8}px`,
            // @ts-expect-error custom css variables
            '--dx': `${item.dx}px`,
            '--dy': `${item.dy}px`,
            '--rot': `${item.rot}deg`,
          }}
        >
          {item.glyph}
        </span>
      ))}
    </>
  );
};
