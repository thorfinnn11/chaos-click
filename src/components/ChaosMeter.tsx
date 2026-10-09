import React from 'react';
import { Activity, ShieldAlert, AlertOctagon, Skull, CheckCircle2 } from 'lucide-react';

interface ChaosMeterProps {
  chaos: number;
  stageIndex: number;
  stageName: string;
}

export const ChaosMeter: React.FC<ChaosMeterProps> = ({
  chaos,
  stageIndex,
  stageName,
}) => {
  const isNormal = chaos === 0;
  const totalSegments = 20;
  const filledCount = Math.round((chaos / 100) * totalSegments);

  // Status label based on chaos progression
  const getReadoutState = () => {
    if (chaos === 0) return 'OPTIMAL FOCUS';
    if (chaos < 25) return 'MONITORED';
    if (chaos < 50) return 'TRACKED';
    if (chaos < 75) return 'SCRUTINY';
    if (chaos < 100) return 'COMPLIANCE VIOLATION';
    return 'TERMINAL LOCKOUT';
  };

  return (
    <div className={`w-full max-w-xl mx-auto my-6 p-4 select-none transition-all duration-300 ${
      isNormal
        ? 'rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-saas'
        : 'instrument-panel font-special'
    }`}>
      {/* Header with dashed divider */}
      <div className={`flex items-center justify-between pb-2 mb-3 ${isNormal ? 'border-b border-[#3a3a3a]/60' : 'instrument-divider'}`}>
        <div className="flex items-center gap-2">
          {isNormal ? (
            <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
          ) : stageIndex >= 4 ? (
            <Skull className="w-4 h-4 text-[#F59E0B] animate-pulse" />
          ) : (
            <Activity className="w-4 h-4 text-[#F59E0B]" />
          )}
          <span className={`text-xs font-bold uppercase tracking-wider ${isNormal ? 'text-[#F3F4F6]' : 'text-[#F59E0B] amber-glow'}`}>
            {isNormal ? 'Focus Score Index' : 'Entropy / Telemetry Meter'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#8d8d8d]">
            {isNormal ? 'State:' : 'Readout:'}
          </span>
          <span className="font-bold text-[#F59E0B] amber-glow">
            {getReadoutState()}
          </span>
        </div>
      </div>

      {/* 20-Segment Meter */}
      <div className="space-y-1.5 my-3">
        <div className="flex justify-between text-[11px] text-[#8d8d8d]">
          <span>{isNormal ? 'Current Session Rate' : 'System Divergence'}</span>
          <span className="font-bold text-[#F3F4F6]">{chaos}%</span>
        </div>

        {/* 20 Discrete Segments */}
        <div
          className="grid grid-cols-20 gap-1 p-1 bg-[#121212] border border-[#3a3a3a]"
          role="progressbar"
          aria-valuenow={chaos}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {Array.from({ length: totalSegments }).map((_, idx) => {
            const isFilled = idx < filledCount;
            // High segments become rust/intense
            const isCritical = idx >= 15;
            return (
              <div
                key={idx}
                className="h-5 transition-all"
                style={{
                  backgroundColor: isFilled
                    ? isCritical
                      ? '#B45309'
                      : '#F59E0B'
                    : 'rgba(58, 58, 58, 0.25)',
                  boxShadow: isFilled
                    ? `0 0 4px ${isCritical ? '#B45309' : '#F59E0B'}`
                    : 'none',
                  transition: 'all 0.28s var(--ease-back)',
                  transitionDelay: `${idx * 14}ms`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Status Bar Footer */}
      <div className={`flex justify-between items-center text-[10px] pt-2 ${isNormal ? 'text-[#8d8d8d]' : 'text-[#8d8d8d] font-special'}`}>
        <span>
          {isNormal ? 'Metric: 20-pt active focus window' : `Stage: ${stageName}`}
        </span>
        <span className="text-[#F59E0B]">
          {isNormal ? 'Telemetry: nominal' : `Vectors: ${filledCount}/${totalSegments}`}
        </span>
      </div>
    </div>
  );
};

