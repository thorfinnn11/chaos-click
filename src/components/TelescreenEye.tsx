import React, { useEffect, useRef, useState } from 'react';
import { Eye, Target } from 'lucide-react';

interface TelescreenEyeProps {
  chaos: number;
  stageIndex: number;
  onClick: (e: React.MouseEvent) => void;
}

export const TelescreenEye: React.FC<TelescreenEyeProps> = ({ chaos, stageIndex, onClick }) => {
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // When chaos is low (<20), the eye remains completely dormant
  const isVisible = chaos >= 20;
  const isDominant = chaos >= 45;

  // Track cursor position relative to the eye center
  useEffect(() => {
    if (!isVisible) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;

      const deltaX = e.clientX - eyeCenterX;
      const deltaY = e.clientY - eyeCenterY;
      const distance = Math.hypot(deltaX, deltaY);
      const maxOffset = 22;

      if (distance === 0) {
        setPupilPos({ x: 0, y: 0 });
      } else {
        const angle = Math.atan2(deltaY, deltaX);
        const cappedDistance = Math.min(distance * 0.05, maxOffset);
        const twitchX = chaos > 50 ? (Math.random() - 0.5) * (chaos * 0.14) : 0;
        const twitchY = chaos > 50 ? (Math.random() - 0.5) * (chaos * 0.14) : 0;

        setPupilPos({
          x: Math.cos(angle) * cappedDistance + twitchX,
          y: Math.sin(angle) * cappedDistance + twitchY,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [chaos, isVisible]);

  // Periodic random blinking
  useEffect(() => {
    if (!isVisible) return;
    const blinkInterval = setInterval(() => {
      if (Math.random() < 0.45) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 130);
      }
    }, 2400);

    return () => clearInterval(blinkInterval);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  // Calculate dynamic opacity and distortion
  const eyeOpacity = Math.min(1, Math.max(0.2, (chaos - 15) / 40));

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{ opacity: eyeOpacity }}
      className={`relative group cursor-pointer max-w-sm mx-auto my-6 p-3 transition-all duration-500 font-mono text-left select-none ${
        isDominant
          ? 'bg-[#121316] border-2 border-[#ffb000] shadow-[0_0_25px_rgba(255,176,0,0.3)] rounded-none'
          : 'bg-[#18191f] border border-[#2b2e38] shadow-[0_0_15px_rgba(255,176,0,0.15)] rounded-lg'
      }`}
    >
      {/* Frame Header */}
      <div className={`flex items-center justify-between pb-1.5 mb-2 text-[10px] tracking-widest uppercase border-b ${
        isDominant ? 'border-[#ffb000]/80 text-amber-400' : 'border-[#2b2e38] text-amber-300'
      }`}>
        <div className="flex items-center gap-1.5 font-bold">
          <Eye className={`w-3.5 h-3.5 ${isDominant ? 'text-[#ffb000] animate-pulse' : 'text-amber-400'}`} />
          <span>{isDominant ? 'TELESCREEN_084 // BIG BROTHER OPTIC' : 'OPTICAL_FEED // AMBER PHOSPHOR'}</span>
        </div>
        <span className={`px-2 py-0.5 font-black text-[9px] ${
          isDominant ? 'bg-[#ffb000] text-black' : 'bg-[#22252e] text-amber-300 border border-[#2b2e38]'
        }`}>
          {chaos < 45 ? 'CALIBRATING...' : chaos < 75 ? 'SURVEILLANCE SPIKE' : 'ROOM 101 PROTOCOL'}
        </span>
      </div>

      {/* Halftone Dithered Eye Canvas Area */}
      <div className={`relative w-full h-44 overflow-hidden flex items-center justify-center border ${
        isDominant ? 'bg-[#0d0e11] border-[#ffb000]/30' : 'bg-[#121316] border-[#2b2e38]'
      }`}>
        {/* Scanline and Grid Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffb000_1px,transparent_1px)] bg-[size:10px_10px] opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,176,0,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[size:100%_4px] pointer-events-none" />

        {/* Tactical Crosshairs in Amber */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-[#ffb000]/25 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-[#ffb000]/25 pointer-events-none" />
        <div className="absolute top-2 left-2 text-[9px] text-amber-400/70 font-mono">
          COORD: [{(pupilPos.x * 4.2).toFixed(1)}, {(pupilPos.y * 4.2).toFixed(1)}]
        </div>
        <div className="absolute bottom-2 right-2 text-[9px] text-amber-400/70 font-mono">
          SCAN_FREQ: {240 + chaos * 8}Hz
        </div>

        {/* Halftone / Dot Matrix Eye Graphic in Graphite & Amber */}
        <div className={`relative transition-transform duration-75 ${isBlinking ? 'scale-y-[0.05]' : 'scale-y-100'}`}>
          {/* Outer Sclera */}
          <div className={`w-56 h-28 border-2 rounded-[50%] flex items-center justify-center relative overflow-hidden transition-colors ${
            isDominant 
              ? 'border-[#ffb000] bg-[#1a1c22]/90 shadow-[inset_0_0_20px_rgba(255,176,0,0.35)]' 
              : 'border-amber-500/60 bg-[#15161b] shadow-[inset_0_0_15px_rgba(255,176,0,0.2)]'
          }`}>
            {/* Iris */}
            <div
              className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-transform duration-100 ease-out ${
                isDominant ? 'border-[#ffb000] bg-[#2a2211]' : 'border-amber-400 bg-[#211a10]'
              }`}
              style={{
                transform: `translate(${pupilPos.x}px, ${pupilPos.y}px)`,
                boxShadow: isDominant ? '0 0 16px #ffb000' : '0 0 10px rgba(255,176,0,0.4)',
              }}
            >
              {/* Halftone Dither Ring */}
              <div className={`absolute inset-1 rounded-full border border-dashed animate-spin [animation-duration:18s] ${
                isDominant ? 'border-[#ffb000]/70' : 'border-amber-400/50'
              }`} />

              {/* Pupil */}
              <div
                className="rounded-full bg-black border border-amber-400 flex items-center justify-center transition-all"
                style={{
                  width: `${18 + chaos * 0.16}px`,
                  height: `${18 + chaos * 0.16}px`,
                }}
              >
                {/* Glint in Amber */}
                <div className="w-1.5 h-1.5 rounded-full self-start mr-1 mt-1 bg-[#ffb000]" />
              </div>
            </div>

            {/* Subtle Eyelid Lines */}
            <div className={`absolute inset-x-0 top-0 h-4 border-b ${isDominant ? 'border-[#ffb000]/40' : 'border-amber-400/30'}`} />
            <div className={`absolute inset-x-0 bottom-0 h-4 border-t ${isDominant ? 'border-[#ffb000]/40' : 'border-amber-400/30'}`} />
          </div>
        </div>

        {/* Glitch Overlay on High Chaos */}
        {chaos > 60 && (
          <div className="absolute inset-0 pointer-events-none mix-blend-screen bg-[linear-gradient(90deg,rgba(255,60,0,0.15),rgba(255,176,0,0.15))] animate-pulse" />
        )}
      </div>

      {/* Frame Telemetry Footer */}
      <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[9px] ${
        isDominant ? 'border-[#ffb000]/40 text-amber-400/90' : 'border-[#2b2e38] text-amber-300'
      }`}>
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          <span>{isDominant ? 'SUBJECT: CITIZEN_#6079-W' : 'TARGET: GRAPHITE_CORE'}</span>
        </span>
        <span className="font-bold">
          {isDominant ? 'THOUGHTCRIME_RISK: ' : 'ENTROPY_INDEX: '}
          <span className={chaos > 60 ? 'text-red-400 font-black' : 'text-amber-400'}>{chaos}%</span>
        </span>
      </div>
    </div>
  );
};
