import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GateState } from './types';
import { getPuzzleComponent } from './puzzleRegistry';
import { ShieldAlert, Cpu, FastForward } from 'lucide-react';

interface PuzzleModalProps {
  gateState: GateState;
  onSolved: () => void;
  onFail: () => void;
  onToggleAssist: (val: boolean) => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  gateState,
  onSolved,
  onFail,
  onToggleAssist,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusedElementRef = useRef<HTMLElement | null>(null);

  // Store previously focused element and return focus on unmount
  useEffect(() => {
    prevFocusedElementRef.current = document.activeElement as HTMLElement | null;

    // Autofocus first focusable element inside the modal
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
          focusable.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      if (prevFocusedElementRef.current && typeof prevFocusedElementRef.current.focus === 'function') {
        try {
          prevFocusedElementRef.current.focus();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Focus trapping and preventing Escape key dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hard rule: Escape must NOT dismiss the puzzle
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const PuzzleComponent = getPuzzleComponent(gateState.targetStage);

  // Container styling adapted per stage evolution
  const getStageWrapperClass = () => {
    switch (gateState.targetStage) {
      case 1:
        // Stage 0 -> 1: Sincere SaaS Onboarding Dialog
        return 'max-w-lg w-full bg-[#16171b] border border-[#2a2c33] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)]';
      case 2:
        // Stage 1 -> 2: Sterile corporate compliance dialog
        return 'max-w-lg w-full bg-[#141519] border border-[#393b45] rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.95)]';
      case 3:
        // Stage 2 -> 3: Bureaucratic red-tape document
        return 'max-w-xl w-full bg-[#121316] border-2 border-[#454756] rounded-lg shadow-[0_0_40px_rgba(245,158,11,0.2)]';
      case 4:
        // Stage 3 -> 4: Brutalist instrument card
        return 'max-w-xl w-full bg-[#101114] border-2 border-[#ffb000] shadow-[8px_8px_0_#000] rounded-none';
      default:
        // Stage 5: Heavy industrial terminal panel
        return 'max-w-xl w-full bg-[#0a0a0c] border-4 border-[#ffb000] shadow-[12px_12px_0_#ffb000] rounded-none font-mono';
    }
  };

  // Render via React portal to document.body to isolate completely from parent container transforms
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Halcyon Verification Protocol"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[99999] grid place-items-center p-4 bg-black/85 backdrop-blur-md cursor-default pointer-events-auto select-none overflow-y-auto"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative outline-none my-auto max-h-[92dvh] overflow-y-auto ${getStageWrapperClass()}`}
      >
        {/* Temporary DEV Skip Button */}
        <div className="absolute top-3 right-3 z-50">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSolved();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ef4444]/20 hover:bg-[#ef4444] text-[#ef4444] hover:text-white border border-[#ef4444]/70 transition-all font-mono text-[10px] uppercase font-bold tracking-wider shadow-[0_0_12px_rgba(239,68,68,0.35)] cursor-pointer"
            title="Dev bypass: Mark current puzzle as solved and advance stage"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Dev Skip (Stage {gateState.targetStage})</span>
          </button>
        </div>

        {/* Render Active Stage Puzzle */}
        <PuzzleComponent
          stage={gateState.targetStage}
          seed={gateState.seed}
          assist={gateState.assist}
          onSolved={onSolved}
          onFail={onFail}
        />

        {/* Assist Mode / Reduce Friction Option after 3 fails */}
        {gateState.fails >= 3 && (
          <div className="px-6 pb-5 pt-1 flex items-center justify-between border-t border-[#23252d] bg-[#111215]/80 text-xs">
            <div className="flex items-center gap-1.5 text-[#ffb000]">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-mono text-[11px]">
                {gateState.fails} attestation discrepancies noted
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggleAssist(!gateState.assist)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
                gateState.assist
                  ? 'bg-[#ffb000]/20 text-[#ffb000] border-[#ffb000]'
                  : 'bg-[#1e2026] text-[#e5e7eb] border-[#393b45] hover:border-[#ffb000]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              {gateState.assist ? 'Friction Reduced (Active)' : 'Reduce Friction'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
