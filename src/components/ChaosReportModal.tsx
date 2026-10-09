import React, { useState } from 'react';
import { Skull, RotateCcw, Award, Zap, Activity, Eye, CheckCircle2 } from 'lucide-react';
import { grudgeMemory } from '../utils/grudgeMemory';

interface ChaosReportModalProps {
  isOpen: boolean;
  clicks: number;
  maxApm: number;
  clickPositions: { x: number; y: number }[];
  onTriggerReset: () => void;
  onClose: () => void;
}

export const ChaosReportModal: React.FC<ChaosReportModalProps> = ({
  isOpen,
  clicks,
  maxApm,
  clickPositions,
  onTriggerReset,
  onClose,
}) => {
  const [isPoweringOff, setIsPoweringOff] = useState(false);
  const [twistMessage, setTwistMessage] = useState('');

  if (!isOpen) return null;

  const grudgeState = grudgeMemory.getState();

  const handleReturnToDesk = () => {
    setIsPoweringOff(true);
    // Reverse CRT power-on transition back to clean Halcyon
    setTimeout(() => {
      setIsPoweringOff(false);
      onTriggerReset();
    }, 600);
  };

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#121212]/95 backdrop-blur-md select-none ${
      isPoweringOff ? 'crt-restore' : 'crt-collapse'
    }`}>
      <div className="w-full max-w-2xl bg-[#202020] border border-[#3a3a3a] shadow-[7px_7px_0_#0a0a0a] p-6 text-xs text-[#F3F4F6] overflow-hidden font-special">
        {/* Header with dashed divider */}
        <div className="flex items-center justify-between pb-3 instrument-divider">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-[#F59E0B] animate-pulse" />
            <div>
              <span className="text-[10px] text-[#8d8d8d] uppercase tracking-widest block font-mono">
                CENTRAL AUDIT // INCIDENT DOSSIER #0451
              </span>
              <h1 className="text-2xl sm:text-3xl font-anton tracking-wide text-[#F59E0B] amber-glow uppercase leading-tight">
                AUDIT COMPLETE. YOU WERE NEVER ALONE.
              </h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-[#121212] bg-[#F59E0B] hover:bg-[#FBBF24] font-bold text-[10px] uppercase transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        </div>

        {/* Audit Slogan Banner */}
        <div className="my-3 py-2 px-3 bg-[#121212] border border-[#3a3a3a] text-center text-xs text-[#F59E0B] amber-glow font-special">
          ALL 6 COMPLIANCE PROTOCOLS EXECUTED. CITIZEN BEHAVIOR CATALOGED PERMANENTLY.
        </div>

        {/* Classification */}
        <div className="my-3 p-3 bg-[#181818] border border-[#3a3a3a] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8d8d8d] uppercase tracking-widest block">
              Assigned Behavioral Classification
            </span>
            <span className="text-sm font-bold text-[#F3F4F6] font-mono">
              LEVEL 6 // MAXIMUM SCRUTINY ARCHIVE (TOTAL RE-EDUCATION)
            </span>
          </div>
          <Award className="w-6 h-6 text-[#F59E0B]" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-3">
          <div className="p-2.5 bg-[#121212] border border-[#3a3a3a]">
            <span className="text-[#8d8d8d] block text-[9px]">SESSION INPUTS</span>
            <span className="text-lg font-bold text-[#F3F4F6] font-mono">{clicks}</span>
          </div>
          <div className="p-2.5 bg-[#121212] border border-[#3a3a3a]">
            <span className="text-[#8d8d8d] block text-[9px]">LIFETIME AUDIT</span>
            <span className="text-lg font-bold text-[#F59E0B] font-mono">{grudgeState.totalLifetimeClicks}</span>
          </div>
          <div className="p-2.5 bg-[#121212] border border-[#3a3a3a]">
            <span className="text-[#8d8d8d] block text-[9px]">SYSTEM RESETS</span>
            <span className="text-lg font-bold text-[#FBBF24] font-mono">{grudgeState.resetsCount}</span>
          </div>
          <div className="p-2.5 bg-[#121212] border border-[#3a3a3a]">
            <span className="text-[#8d8d8d] block text-[9px]">INPUT VELOCITY</span>
            <span className="text-lg font-bold text-[#B45309] font-mono">{maxApm.toFixed(1)}/s</span>
          </div>
        </div>

        {/* Surveillance Heatmap */}
        <div className="my-3 p-2.5 bg-[#121212] border border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-1.5 text-[10px] text-[#8d8d8d]">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#F59E0B]" />
              TELESCREEN RETICLE TRACE ({clickPositions.length} recorded impacts)
            </span>
            <span className="text-[#F59E0B] font-mono text-[9px]">GRID 0451-B</span>
          </div>
          <div className="relative w-full h-20 bg-[#0d0d0d] border border-[#262626] overflow-hidden">
            {clickPositions.slice(-50).map((pt, idx) => {
              const left = (pt.x / (typeof window !== 'undefined' ? window.innerWidth : 1000)) * 100;
              const top = (pt.y / (typeof window !== 'undefined' ? window.innerHeight : 800)) * 100;
              return (
                <div
                  key={idx}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  className="absolute w-1.5 h-1.5 bg-[#F59E0B] shadow-[0_0_4px_#F59E0B]"
                />
              );
            })}
          </div>
        </div>

        {/* Thinkpol Log */}
        <div className="my-3 p-2.5 bg-[#181818] border border-[#3a3a3a] text-xs text-[#8d8d8d] leading-relaxed">
          <div className="font-bold text-[#F59E0B] flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5" />
            TELESCREEN RECORDING TRANSCRIPT:
          </div>
          <p>
            "Subject entered Halcyon workspace believing attention analytics were optional. 
            All {clicks} biometric interactions were logged and correlated. 
            Attention levels are now property of the State."
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-3 instrument-divider">
          <button
            id="modalConfessBtn"
            onClick={handleReturnToDesk}
            className="px-4 py-2 bg-[#202020] hover:bg-[#2a2a2a] text-[#8d8d8d] hover:text-[#F3F4F6] border border-[#3a3a3a] uppercase font-bold text-xs transition-colors cursor-pointer"
          >
            CONFESS IN CELL 101
          </button>
          <button
            id="instantResetBtn"
            onClick={handleReturnToDesk}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#121212] font-anton tracking-wide text-sm uppercase transition-all shadow-[4px_4px_0_#0a0a0a] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RETURN TO YOUR DESK</span>
          </button>
        </div>
      </div>
    </div>
  );
};

