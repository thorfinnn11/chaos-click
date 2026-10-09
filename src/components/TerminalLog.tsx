import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Users } from 'lucide-react';

interface TerminalLogProps {
  logs: string[];
  onExecuteCommand: (cmd: string) => void;
  onClearLogs: () => void;
  isNormal?: boolean;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({
  logs,
  onExecuteCommand,
  onClearLogs,
  isNormal = false,
}) => {
  const [inputVal, setInputVal] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    onExecuteCommand(trimmed);
    setInputVal('');
  };

  // Reversed logs so newest lines are on top
  const reversedLogs = [...logs].reverse();

  return (
    <div className={`w-full max-w-3xl mx-auto my-6 text-left select-none transition-all duration-300 ${
      isNormal
        ? 'rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-saas p-4'
        : 'instrument-panel font-special p-4'
    }`}>
      {/* Title Bar */}
      <div className={`flex items-center justify-between pb-2 mb-3 ${isNormal ? 'border-b border-[#3a3a3a]/60' : 'instrument-divider'}`}>
        <div className="flex items-center gap-2">
          {isNormal ? (
            <Users className="w-4 h-4 text-[#F59E0B]" />
          ) : (
            <Terminal className="w-4 h-4 text-[#F59E0B]" />
          )}
          <span className={`text-xs font-bold uppercase tracking-wider ${isNormal ? 'text-[#F3F4F6]' : 'text-[#F59E0B] amber-glow'}`}>
            {isNormal ? 'Team Activity Feed' : 'Operator Log // Telemetry'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            title="Purge terminal record"
            className="p-1 text-[#8d8d8d] hover:text-[#F59E0B] transition-colors cursor-pointer text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <span className={`text-[9px] px-1.5 py-0.5 font-bold ${
            isNormal
              ? 'bg-[#2a2a2a] text-[#8d8d8d] rounded'
              : 'bg-[#F59E0B] text-[#121212]'
          }`}>
            {isNormal ? 'LIVE' : 'REC // 60HZ'}
          </span>
        </div>
      </div>

      {/* Terminal Logs Viewport: Newest lines on top, older fading with ease-out */}
      <div
        ref={logContainerRef}
        className="h-44 overflow-y-auto pr-1 space-y-1.5 scroll-smooth"
      >
        {reversedLogs.map((log, index) => {
          const opacity = Math.max(0.3, 1 - index * 0.08);

          return (
            <div
              key={index}
              style={{
                opacity,
                transition: 'all 0.3s var(--ease-out)',
              }}
              className={`text-xs leading-relaxed py-0.5 flex items-start gap-2 ${
                isNormal ? 'text-[#F3F4F6]' : 'text-[#F59E0B]'
              }`}
            >
              <span className="text-[#8d8d8d] text-[10px] shrink-0 font-mono select-none">
                {String(reversedLogs.length - index).padStart(2, '0')}.
              </span>
              <span className={`break-words ${isNormal ? 'font-normal' : 'amber-glow'}`}>
                {log}
              </span>
            </div>
          );
        })}
      </div>

      {/* Interactive Command Input */}
      <form
        onSubmit={handleSubmit}
        className="mt-3 pt-2 border-t border-[#3a3a3a]/40 flex items-center gap-2"
      >
        <span className="text-[#F59E0B] text-xs font-mono font-bold select-none">&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={isNormal ? "Query employee session..." : "Execute command (help, diary, 2+2, goldstein)..."}
          className="flex-1 bg-transparent text-xs text-[#F3F4F6] placeholder-[#8d8d8d] focus:outline-none font-mono"
        />
        <button
          type="submit"
          className="px-2 py-0.5 text-[10px] bg-[#3a3a3a] hover:bg-[#F59E0B] hover:text-[#121212] text-[#F3F4F6] uppercase font-bold transition-colors cursor-pointer"
        >
          {isNormal ? 'Send' : 'Transmit'}
        </button>
      </form>
    </div>
  );
};
