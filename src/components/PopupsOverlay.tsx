import React from 'react';
import { AlertTriangle, X, ShieldAlert, Eye } from 'lucide-react';

export interface RoguePopup {
  id: string;
  title: string;
  message: string;
  x: number;
  y: number;
  type: 'warning' | 'existential' | 'system';
}

interface PopupsOverlayProps {
  popups: RoguePopup[];
  onDismiss: (id: string) => void;
}

export const PopupsOverlay: React.FC<PopupsOverlayProps> = ({ popups, onDismiss }) => {
  if (popups.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9900]">
      {popups.map((popup) => (
        <div
          key={popup.id}
          style={{
            left: `${popup.x}px`,
            top: `${popup.y}px`,
          }}
          className="pointer-events-auto absolute w-80 bg-[#121316] border-2 border-[#ffb000] shadow-[6px_6px_0px_#422900] p-3 text-xs font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#ffb000]/60 text-amber-400 font-black">
            <span className="flex items-center gap-1.5 text-[11px] tracking-wider">
              {popup.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              {popup.type === 'system' && <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />}
              {popup.type === 'existential' && <Eye className="w-3.5 h-3.5 text-[#ffb000]" />}
              {popup.title}
            </span>
            <button
              onClick={() => onDismiss(popup.id)}
              className="p-0.5 hover:text-white text-amber-400 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Message */}
          <p className="mt-2 text-[#f3f4f6] leading-relaxed text-[11px]">
            {popup.message}
          </p>

          {/* Footer Action */}
          <div className="mt-3 flex justify-between items-center pt-1.5 border-t border-[#2b2e38]">
            <span className="text-[9px] text-amber-400/80">SECTOR_101</span>
            <button
              onClick={() => onDismiss(popup.id)}
              className="px-2 py-0.5 bg-[#ffb000] hover:bg-amber-300 text-black font-black text-[9px] uppercase tracking-wider cursor-pointer"
            >
              CONFESS & SUBMIT
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
