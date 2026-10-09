import React from 'react';
import { Award, CheckCircle2, Lock, Eye } from 'lucide-react';
import { Achievement } from '../utils/achievements';

interface AchievementsModalProps {
  isOpen: boolean;
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  achievements,
  onClose,
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-mono text-xs select-none">
      <div className="w-full max-w-xl bg-[#121316] border-2 border-[#ffb000] shadow-[8px_8px_0px_#422900] p-5 overflow-hidden text-amber-300">
        {/* Title */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#ffb000]/80">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                THOUGHTCRIME CITATION ARCHIVE
              </h2>
              <p className="text-[10px] text-amber-500/80">
                {unlockedCount} of {achievements.length} UNORTHODOX ACTIONS RECORDED BY THINKPOL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-[#ffb000] hover:bg-amber-300 text-black font-black uppercase text-[10px] transition-colors"
          >
            DISMISS
          </button>
        </div>

        {/* List of achievements */}
        <div className="my-4 max-h-96 overflow-y-auto space-y-2.5 pr-1">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 border transition-all ${
                item.unlockedAt
                  ? 'bg-[#181a20] border-[#ffb000]/70 text-[#f3f4f6]'
                  : 'bg-[#0e0f12] border-[#2b2e38] text-amber-500/40'
              }`}
            >
              <div className="text-2xl select-none p-1 bg-[#121316] border border-[#2b2e38]">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${item.unlockedAt ? 'text-amber-400' : 'text-slate-400'}`}>
                    {item.title}
                  </span>
                  {item.unlockedAt ? (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      LOGGED: {item.unlockedAt}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Lock className="w-3 h-3" />
                      UNCOMMITTED
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5 text-slate-300">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t-2 border-[#ffb000]/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#ffb000] hover:bg-amber-300 text-black font-black uppercase tracking-wider text-xs"
          >
            RETURN TO TELESCREEN
          </button>
        </div>
      </div>
    </div>
  );
};
