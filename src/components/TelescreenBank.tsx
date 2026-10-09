import React from 'react';
import { Activity, Radio, Database, Tv, Shield } from 'lucide-react';

interface TelescreenBankProps {
  chaos: number;
  stageIndex: number;
  onMonitorClick: (monitorName: string) => void;
}

export const TelescreenBank: React.FC<TelescreenBankProps> = ({ chaos, stageIndex, onMonitorClick }) => {
  const isCorrupted = chaos >= 40;

  return (
    <div className={`w-full max-w-5xl mx-auto my-6 transition-all duration-500 font-mono text-left ${
      isCorrupted
        ? 'border-2 border-[#ffb000] bg-[#121316] p-3 shadow-[0_0_35px_rgba(255,176,0,0.2)]'
        : 'border border-[#2b2e38] bg-[#18191f]/90 backdrop-blur-xl p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)]'
    }`}>
      {/* Top Banner: Wireframe Grid in Amber */}
      <div className={`relative h-28 w-full overflow-hidden mb-3 transition-colors ${
        isCorrupted ? 'border border-[#ffb000]/40 bg-[#0d0e11]' : 'border border-[#2b2e38] bg-[#121316] rounded-lg'
      }`}>
        {/* Wireframe 3D Perspective Matrix */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,176,0,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,176,0,0.35) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            transform: 'perspective(220px) rotateX(60deg) translateY(-20px)',
            transformOrigin: 'top center',
            opacity: isCorrupted ? 0.45 : 0.22,
          }}
        />

        {/* Ambient CRT Scanline Overlay */}
        {chaos > 20 && (
          <div 
            className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[size:100%_4px] pointer-events-none"
            style={{ opacity: (chaos - 15) / 85 }}
          />
        )}

        {/* Dynamic Slogan / Header Banner */}
        <div className="relative z-10 flex flex-col justify-between h-full p-3">
          <div className="flex items-center justify-between text-[10px] tracking-widest font-bold">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Tv className="w-3.5 h-3.5 animate-pulse" />
              <span>
                {isCorrupted 
                  ? 'MINISTRY OF TRUTH // ARCHIVAL TELESCREEN CLUSTER 1984'
                  : 'GRAPHITE // AMBER HARMONICS SYNTHESIZER DECK'}
              </span>
            </span>
            <span className={`px-2 py-0.5 text-[9px] font-black ${
              isCorrupted
                ? 'bg-[#ffb000] text-black font-mono'
                : 'bg-[#252832] text-amber-300 rounded border border-[#373b49]'
            }`}>
              {chaos < 25 ? 'SYSTEM NOMINAL' : chaos < 50 ? 'TELEMETRY FLICKER' : 'PROLE DISTURBANCE'}
            </span>
          </div>

          <div className={`text-center font-black tracking-widest text-xs md:text-sm drop-shadow transition-colors ${
            isCorrupted 
              ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(255,176,0,0.8)]' 
              : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500'
          }`}>
            {isCorrupted 
              ? 'WAR IS PEACE  ·  FREEDOM IS SLAVERY  ·  IGNORANCE IS STRENGTH'
              : 'GRAPHITE TEXTURES  ·  WARM AMBER PHOSPHOR  ·  TACTILE RESONANCE'}
          </div>

          <div className={`flex justify-between items-center text-[9px] ${
            isCorrupted ? 'text-amber-400/80' : 'text-slate-400'
          }`}>
            <span>{isCorrupted ? 'SECTOR: AIRSTRIP ONE (LONDON)' : 'PALETTE: GRAPHITE MATTE & AMBER PHOSPHOR'}</span>
            <span>{isCorrupted ? 'CARRIER FREQ: 142.85 MHz' : 'SAMPLING: 48kHz PURE ANALOG SIMULATION'}</span>
            <span>{isCorrupted ? 'CITIZEN FEED #09' : 'SESSION: GRAPHITE STUDIO PROFILE'}</span>
          </div>
        </div>
      </div>

      {/* Mini Monitor Modules in Graphite & Amber */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {/* Module 1: Radar / Vector Mesh */}
        <div
          onClick={() => onMonitorClick('OCEANIA_GRID')}
          className={`p-2 cursor-pointer transition-all relative overflow-hidden group ${
            isCorrupted
              ? 'border border-[#ffb000]/50 bg-[#16171d] hover:border-[#ffb000]'
              : 'border border-[#2b2e38] bg-[#14151a] hover:border-amber-400/70 rounded-lg'
          }`}
        >
          <div className="text-[9px] font-bold pb-1 flex justify-between border-b border-white/10">
            <span className="text-amber-400">
              {isCorrupted ? 'CRT 01: MAP' : '01: RADAR'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div className="h-14 flex items-center justify-center relative my-1 bg-black/40 rounded">
            <div className={`w-10 h-10 border border-dashed rounded-full flex items-center justify-center text-[7px] ${
              isCorrupted ? 'border-amber-400 text-amber-300' : 'border-amber-500/60 text-amber-400'
            }`}>
              {isCorrupted ? 'OCEANIA' : 'RADAR 4'}
            </div>
          </div>
          <div className="text-[8px] opacity-70 text-slate-300">
            {isCorrupted ? 'AIRSTRIP ONE' : 'POLAR GRID'}
          </div>
        </div>

        {/* Module 2: Memory Stream / Directory */}
        <div
          onClick={() => onMonitorClick('MEMORY_STREAM')}
          className={`p-2 cursor-pointer transition-all relative overflow-hidden ${
            isCorrupted
              ? 'border border-[#ffb000]/50 bg-[#16171d] hover:border-[#ffb000]'
              : 'border border-[#2b2e38] bg-[#14151a] hover:border-amber-400/70 rounded-lg'
          }`}
        >
          <div className="text-[9px] font-bold pb-1 flex justify-between border-b border-white/10">
            <span className="text-amber-400">
              {isCorrupted ? 'CRT 02: DIR' : '02: LOGS'}
            </span>
            <Database className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <div className="h-14 overflow-hidden text-[7px] leading-tight my-1 font-mono text-amber-200/90">
            {isCorrupted ? (
              <>
                <div className="text-red-400">1984/04/04 &lt;DIR&gt; winston/</div>
                <div>diary.txt [REDACTED]</div>
                <div>goldstein.bin</div>
                <div>cell_101.dat</div>
              </>
            ) : (
              <>
                <div>0x7FFA: graphiteCanvas OK</div>
                <div>0x7FFC: amberOscillator OK</div>
                <div>0x7FFE: lenisScroll OK</div>
                <div>0x8000: warmPhosTrace OK</div>
              </>
            )}
          </div>
          <div className="text-[8px] opacity-70 text-slate-300">
            {isCorrupted ? 'RECORDS AUDIT' : 'BUFFER TRACE'}
          </div>
        </div>

        {/* Module 3: Test Pattern / Amber Phosphor Spectrum */}
        <div
          onClick={() => onMonitorClick('TEST_PATTERN')}
          className={`p-2 cursor-pointer transition-all relative overflow-hidden ${
            isCorrupted
              ? 'border border-[#ffb000]/50 bg-[#16171d] hover:border-[#ffb000]'
              : 'border border-[#2b2e38] bg-[#14151a] hover:border-amber-400/70 rounded-lg'
          }`}
        >
          <div className="text-[9px] font-bold pb-1 border-b border-white/10 text-amber-400">
            {isCorrupted ? 'CRT 03: RASTER' : '03: LUMEN'}
          </div>
          <div className="h-14 my-1 flex rounded overflow-hidden">
            <div className="flex-1 bg-[#451a03]" />
            <div className="flex-1 bg-[#78350f]" />
            <div className="flex-1 bg-[#b45309]" />
            <div className="flex-1 bg-[#d97706]" />
            <div className="flex-1 bg-[#f59e0b]" />
            <div className="flex-1 bg-[#fbbf24]" />
            <div className="flex-1 bg-[#fef08a]" />
          </div>
          <div className="text-[8px] opacity-70 text-slate-300">
            {isCorrupted ? 'NTSC CALIBRATION' : 'AMBER SPECTRUM'}
          </div>
        </div>

        {/* Module 4: Cardiogram / Audio Waveform */}
        <div
          onClick={() => onMonitorClick('POLYGRAPH')}
          className={`p-2 cursor-pointer transition-all relative overflow-hidden ${
            isCorrupted
              ? 'border border-[#ffb000]/50 bg-[#16171d] hover:border-[#ffb000]'
              : 'border border-[#2b2e38] bg-[#14151a] hover:border-amber-400/70 rounded-lg'
          }`}
        >
          <div className="text-[9px] font-bold pb-1 flex justify-between border-b border-white/10">
            <span className="text-amber-400">
              {isCorrupted ? 'CRT 04: BIOMETRIC' : '04: OSCILLATOR'}
            </span>
            <Activity className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <div className="h-14 my-1 flex items-center justify-center relative bg-black/40 rounded">
            <svg className="w-full h-8" viewBox="0 0 100 30">
              <path
                d="M 0 15 L 20 15 L 25 5 L 30 25 L 35 15 L 50 15 L 55 2 L 62 28 L 68 15 L 100 15"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                className="animate-pulse"
              />
            </svg>
          </div>
          <div className="text-[8px] opacity-70 text-slate-300">
            {isCorrupted ? `PULSE: ${72 + Math.floor(chaos * 0.8)} BPM` : 'SINE: 440Hz'}
          </div>
        </div>

        {/* Module 5: Spectrum Bars */}
        <div
          onClick={() => onMonitorClick('SPECTRUM')}
          className={`p-2 cursor-pointer transition-all relative overflow-hidden ${
            isCorrupted
              ? 'border border-[#ffb000]/50 bg-[#16171d] hover:border-[#ffb000]'
              : 'border border-[#2b2e38] bg-[#14151a] hover:border-amber-400/70 rounded-lg'
          }`}
        >
          <div className="text-[9px] font-bold pb-1 flex justify-between border-b border-white/10">
            <span className="text-amber-400">
              {isCorrupted ? 'CRT 05: SPECTRUM' : '05: GAIN'}
            </span>
            <Radio className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <div className="h-14 my-1 flex items-end justify-between px-1 bg-black/40 rounded">
            {[40, 75, 20, 90, 60, 30, 85, 45].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-t bg-gradient-to-t from-amber-700 via-amber-500 to-amber-300"
                style={{
                  height: `${Math.min(100, h + (chaos * 0.3))}%`,
                  opacity: 0.75 + (i % 3) * 0.1,
                }}
              />
            ))}
          </div>
          <div className="text-[8px] opacity-70 text-slate-300">
            {isCorrupted ? 'MINILUV TAP' : 'GRAPHITE GAIN'}
          </div>
        </div>

        {/* Module 6: Logic / 2+2 Check */}
        <div
          onClick={() => onMonitorClick('DOUBLETHINK_LOGIC')}
          className={`p-2 cursor-pointer transition-all relative overflow-hidden ${
            isCorrupted
              ? 'border border-[#ffb000]/50 bg-[#16171d] hover:border-[#ffb000]'
              : 'border border-[#2b2e38] bg-[#14151a] hover:border-amber-400/70 rounded-lg'
          }`}
        >
          <div className="text-[9px] font-bold pb-1 flex justify-between border-b border-white/10">
            <span className="text-amber-400">
              {isCorrupted ? 'CRT 06: LOGIC' : '06: INVARIANTS'}
            </span>
            <Shield className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <div className="h-14 my-1 flex flex-col items-center justify-center bg-black/40 rounded text-center">
            <span className={`text-xs font-black ${isCorrupted ? 'text-amber-400' : 'text-white'}`}>
              {chaos < 70 ? '2 + 2 = 4' : '2 + 2 = 5'}
            </span>
            <span className="text-[7px] opacity-60 text-slate-300">
              {chaos < 70 ? 'LOGIC: NOMINAL' : 'DOUBLETHINK VERIFIED'}
            </span>
          </div>
          <div className="text-[8px] opacity-70 text-slate-300">
            {isCorrupted ? 'PARTY TRUTH' : 'TRUTH TABLE'}
          </div>
        </div>
      </div>
    </div>
  );
};
