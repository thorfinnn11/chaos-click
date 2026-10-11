import React, { useState, useEffect } from 'react';
import { gateLogger, GateLogEntry } from './gateLogger';
import { GateState } from './types';
import { Terminal, ChevronDown, ChevronUp, Play, Trash2 } from 'lucide-react';

interface GateDebugOverlayProps {
  gateState: GateState;
  clicks: number;
  chaos: number;
  onRequestGate: (gate: number) => void;
}

export const GateDebugOverlay: React.FC<GateDebugOverlayProps> = ({
  gateState,
  clicks,
  chaos,
  onRequestGate,
}) => {
  const [logs, setLogs] = useState<GateLogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    return gateLogger.subscribe(setLogs);
  }, []);

  return (
    <aside
      aria-label="Dev Gate Monitor"
      className="fixed bottom-2 left-2 z-[999999] font-mono text-[11px] select-none pointer-events-auto"
    >
      <div className="bg-[#0e1014]/95 border border-[#ffb000]/40 rounded shadow-[0_4px_24px_rgba(0,0,0,0.8)] backdrop-blur-md text-[#d1d5db] overflow-hidden max-w-sm sm:max-w-md">
        {/* Header Bar */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
          className="flex items-center justify-between px-3 py-1.5 bg-[#171920] border-b border-[#2a2d38] cursor-pointer hover:bg-[#1d2029] transition-colors"
        >
          <div className="flex items-center gap-2 text-[#ffb000]">
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider uppercase text-[10px]">
              Gate Event Log
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#ffb000]/15 text-[#ffb000] text-[9px]">
              {gateState.status} (G:{gateState.targetStage} | S:{clicks})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#8b8d98]">
            <span className="text-[9px]">{logs.length} ev</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="p-2 flex flex-col gap-2">
            {/* Quick Gate Shortcuts */}
            <div className="flex items-center justify-between gap-1 border-b border-[#252833] pb-1.5">
              <span className="text-[10px] text-[#717482]">Jump:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onRequestGate(g)}
                    className="px-1.5 py-0.5 rounded bg-[#1f222c] border border-[#343746] text-[#ffb000] hover:bg-[#ffb000] hover:text-black transition-colors font-bold text-[10px]"
                    title={`Force jump to Gate ${g}`}
                  >
                    G{g}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onRequestGate(6)}
                  className="px-1.5 py-0.5 rounded bg-[#ef4444]/20 border border-[#ef4444] text-red-400 hover:bg-[#ef4444] hover:text-black transition-colors font-bold text-[10px]"
                  title="Force jump to Boss Fight"
                >
                  BOSS
                </button>
                <button
                  type="button"
                  onClick={() => gateLogger.clear()}
                  className="p-1 rounded bg-[#1f222c] text-[#717482] hover:text-white"
                  title="Clear log"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Event List */}
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1 pr-1 font-mono text-[10px]">
              {logs.length === 0 ? (
                <div className="text-[#555866] italic py-2 text-center">
                  No gate events logged yet.
                </div>
              ) : (
                logs.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-1.5 leading-tight py-0.5 border-b border-[#1b1d26] last:border-0"
                  >
                    <span className="text-[#656877] shrink-0 font-mono text-[9px]">
                      {entry.timestamp}
                    </span>
                    <span
                      className={`font-semibold shrink-0 ${
                        entry.event.includes('Solved')
                          ? 'text-emerald-400'
                          : entry.event.includes('freeze')
                          ? 'text-cyan-400'
                          : entry.event.includes('thaw')
                          ? 'text-amber-400'
                          : entry.event.includes('stage')
                          ? 'text-fuchsia-400'
                          : 'text-[#e5e7eb]'
                      }`}
                    >
                      {entry.event}
                    </span>
                    {entry.details && (
                      <span className="text-[#9ca3af] truncate">
                        {JSON.stringify(entry.details)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
