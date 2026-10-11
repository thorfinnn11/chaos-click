import React from 'react';
import { PuzzleProps } from './types';
import { audioEngine } from '../utils/audioEngine';

/**
 * Placeholder component for upcoming puzzle stages (stages 4 and 5)
 * Allows seamless continuation until the user provides the specific puzzle designs.
 */
export const PuzzlePlaceholder: React.FC<PuzzleProps> = ({
  stage,
  onSolved,
}) => {
  return (
    <div className="flex flex-col gap-4 p-6 bg-[#0f1013] border border-[#ffb000]/40 rounded-xl text-[#f3f4f6] font-mono shadow-2xl select-none">
      <div className="flex items-center gap-2 border-b border-[#282a33] pb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffb000] animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#ffb000]">
          CLEARANCE PROTOCOL // LEVEL 0{stage}
        </span>
      </div>

      <div className="p-4 bg-[#14151a] border border-[#2b2d38] rounded text-xs space-y-2">
        <p className="text-[#e5e7eb]">
          Access to Sector 0{stage} requires biometric and ideological attestation.
        </p>
        <p className="text-[#8d8d8d] text-[11px]">
          System telemetry is currently synchronizing with the central surveillance mesh.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => {
            audioEngine.playMechanicalClick();
            onSolved();
          }}
          className="px-4 py-2 bg-[#ffb000] hover:bg-[#ffb000]/80 text-black font-bold text-xs uppercase tracking-wider rounded transition-all active:scale-95 shadow-[0_0_15px_rgba(255,176,0,0.3)]"
        >
          Affirm Clearance
        </button>
      </div>
    </div>
  );
};
