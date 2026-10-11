import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PuzzleProps } from '../../puzzles/types';
import { audioEngine } from '../../utils/audioEngine';
import { ShieldCheck, Cpu, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const GRID_SIZE = 3;
const TOTAL_TILES = 9;
const BLANK_TILE = 8; // Slot 8 is blank

// 4x4 Bayer matrix normalized to 0..255
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v / 16) * 255));

/**
 * Procedurally generates an 8-bit Bayer-dithered Overseer Eye texture on canvas.
 */
function generateDitheredEyeDataUrl(): string {
  const size = 288;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Draw procedural grayscale Eye
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Outer orbital ring
  ctx.strokeStyle = '#606474';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * 2);
  ctx.stroke();

  // Eyeball almond shape
  ctx.fillStyle = '#b0b4c0';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 115, 68, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iris
  const irisGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 48);
  irisGrad.addColorStop(0, '#ffffff');
  irisGrad.addColorStop(0.5, '#707480');
  irisGrad.addColorStop(1, '#1a1b20');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();

  // Highlight glint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 8, cy - 8, 7, 0, Math.PI * 2);
  ctx.fill();

  // Scanline grid effect
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // 2. Bayer Dither Pass into Phosphor Amber (#ffb000) and Deep Onyx (#0f1013)
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const threshold = BAYER_4X4[y % 4][x % 4];

      if (gray > threshold) {
        // Phosphor amber glow
        data[idx] = 255;
        data[idx + 1] = 176;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      } else {
        // Dark background
        data[idx] = 15;
        data[idx + 1] = 16;
        data[idx + 2] = 20;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL();
}

/**
 * Returns valid adjacent indices to slide into the blank tile.
 */
function getAdjacentIndices(blankIdx: number): number[] {
  const row = Math.floor(blankIdx / GRID_SIZE);
  const col = blankIdx % GRID_SIZE;
  const adj: number[] = [];

  if (row > 0) adj.push(blankIdx - GRID_SIZE); // Up
  if (row < GRID_SIZE - 1) adj.push(blankIdx + GRID_SIZE); // Down
  if (col > 0) adj.push(blankIdx - 1); // Left
  if (col < GRID_SIZE - 1) adj.push(blankIdx + GRID_SIZE - 1 ? blankIdx + 1 : blankIdx + 1); // Right
  return adj;
}

export const Puzzle4Reconciliation: React.FC<PuzzleProps> = ({
  stage,
  seed,
  assist: initialAssist,
  onSolved,
  onFail,
}) => {
  const [localAssist, setLocalAssist] = useState(initialAssist);
  const assist = initialAssist || localAssist;

  const [tiles, setTiles] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const [moves, setMoves] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const isSolvedRef = useRef(false);

  // Generate eye image once
  const eyeDataUrl = useMemo(() => generateDitheredEyeDataUrl(), []);

  // Scramble via random legal moves from the solved state (Guaranteed 100% solvable)
  const scrambleBoard = useCallback(() => {
    let board = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    let blank = 8;
    const scrambleMoves = assist ? 10 : 26;
    let prevMove = -1;

    let s = seed || 12345;
    for (let i = 0; i < scrambleMoves; i++) {
      const candidates = getAdjacentIndices(blank).filter((c) => c !== prevMove);
      s = (s * 9301 + 49297) % 233280;
      const pick = candidates[Math.floor((s / 233280) * candidates.length)] || candidates[0];

      // Swap
      board[blank] = board[pick];
      board[pick] = BLANK_TILE;
      prevMove = blank;
      blank = pick;
    }

    setTiles(board);
    setMoves(0);
    setIsSolved(false);
    isSolvedRef.current = false;
  }, [seed, assist]);

  useEffect(() => {
    scrambleBoard();
  }, [scrambleBoard]);

  // Attempt to slide a tile at clicked index
  const handleTileClick = useCallback(
    (tileIdx: number) => {
      if (isSolvedRef.current) return;

      const blankIdx = tiles.indexOf(BLANK_TILE);
      const row = Math.floor(tileIdx / GRID_SIZE);
      const col = tileIdx % GRID_SIZE;
      const bRow = Math.floor(blankIdx / GRID_SIZE);
      const bCol = blankIdx % GRID_SIZE;

      // Check adjacency
      const isAdj = Math.abs(row - bRow) + Math.abs(col - bCol) === 1;
      if (!isAdj) return;

      audioEngine.playMechanicalClick();

      // Perform swap
      const newTiles = [...tiles];
      newTiles[blankIdx] = tiles[tileIdx];
      newTiles[tileIdx] = BLANK_TILE;
      setTiles(newTiles);
      setMoves((m) => m + 1);

      // Check win condition
      const won = newTiles.every((val, idx) => val === idx);
      if (won && !isSolvedRef.current) {
        isSolvedRef.current = true;
        setIsSolved(true);
        audioEngine.playNotificationChime();
        setTimeout(() => {
          onSolved();
        }, 500);
      }
    },
    [tiles, onSolved]
  );

  // Keyboard navigation (Arrow keys / WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSolvedRef.current) return;
      const blankIdx = tiles.indexOf(BLANK_TILE);
      const bRow = Math.floor(blankIdx / GRID_SIZE);
      const bCol = blankIdx % GRID_SIZE;
      let targetIdx = -1;

      // Slide tile INTO blank slot
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && bRow < GRID_SIZE - 1) {
        targetIdx = (bRow + 1) * GRID_SIZE + bCol;
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && bRow > 0) {
        targetIdx = (bRow - 1) * GRID_SIZE + bCol;
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && bCol < GRID_SIZE - 1) {
        targetIdx = bRow * GRID_SIZE + (bCol + 1);
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && bCol > 0) {
        targetIdx = bRow * GRID_SIZE + (bCol - 1);
      }

      if (targetIdx !== -1) {
        e.preventDefault();
        handleTileClick(targetIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tiles, handleTileClick]);

  return (
    <div className="flex flex-col gap-5 p-6 bg-[#101114] border-2 border-[#ffb000] rounded-none text-[#f3f4f6] font-mono shadow-[8px_8px_0_#000] select-none">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-[#262832] pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-[#ffb000] animate-pulse" />
            <span className="text-[10px] tracking-wider uppercase font-bold text-[#ffb000]">
              CENTRAL RECONCILIATION // 3×3 RECOVERY
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#f3f4f6] uppercase tracking-wide">
            File Reconciliation Protocol
          </h2>
          <p className="text-xs text-[#9a9ba4] mt-0.5">
            Slide memory fragments into alignment to reconstruct the Overseer optical index.
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="text-[11px] text-[#8d8d8d]">
            Moves: <strong className="text-[#ffb000]">{moves}</strong>
          </span>
          <button
            type="button"
            onClick={() => setLocalAssist(!localAssist)}
            className={`text-[10px] px-2 py-0.5 border uppercase font-bold flex items-center gap-1 transition-colors ${
              assist
                ? 'bg-[#ffb000]/20 text-[#ffb000] border-[#ffb000]'
                : 'bg-[#1b1d24] text-[#8e909a] border-[#323542] hover:text-white'
            }`}
          >
            <Cpu className="w-3 h-3" />
            {assist ? 'Friction: Reduced' : 'Reduce friction'}
          </button>
        </div>
      </div>

      {/* 3x3 Sliding Puzzle Grid */}
      <div className="flex justify-center my-1">
        <div
          role="grid"
          aria-label="3x3 sliding tile puzzle"
          className="relative w-[288px] h-[288px] bg-[#07080a] border-2 border-[#ffb000]/70 p-1.5 grid grid-cols-3 grid-rows-3 gap-1 shadow-[inset_0_0_16px_rgba(0,0,0,0.9)]"
        >
          {tiles.map((tileNumber, gridIndex) => {
            const isBlank = tileNumber === BLANK_TILE && !isSolved;
            const originalRow = Math.floor(tileNumber / GRID_SIZE);
            const originalCol = tileNumber % GRID_SIZE;

            if (isBlank) {
              return (
                <div
                  key={`tile-blank-${gridIndex}`}
                  className="w-full h-full bg-[#0a0b0e] border border-dashed border-[#2b2d38] rounded-none flex items-center justify-center"
                >
                  <span className="text-[9px] text-[#414452]">SLOT {gridIndex + 1}</span>
                </div>
              );
            }

            return (
              <button
                key={`tile-${tileNumber}`}
                type="button"
                onClick={() => handleTileClick(gridIndex)}
                className="relative w-full h-full overflow-hidden border border-[#ffb000]/60 hover:border-[#ffb000] focus:ring-1 focus:ring-[#ffb000] active:scale-95 transition-all cursor-pointer group"
                style={{
                  backgroundImage: `url(${eyeDataUrl})`,
                  backgroundSize: '288px 288px',
                  backgroundPosition: `-${originalCol * 92}px -${originalRow * 92}px`,
                }}
              >
                {/* Friction assist number watermark */}
                {assist && (
                  <span className="absolute top-1 left-1.5 px-1 py-0.2 bg-black/80 border border-[#ffb000]/60 text-[9px] font-bold text-[#ffb000]">
                    #{tileNumber + 1}
                  </span>
                )}
                {/* Tile corner phosphor cross */}
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#ffb000]/50 group-hover:bg-[#ffb000]" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Status & Keyboard Controls Footer */}
      <div className="flex items-center justify-between text-[11px] text-[#71727d] border-t-2 border-[#262832] pt-2.5">
        <div className="flex items-center gap-1.5 text-[#ffb000]">
          <span>Controls: Click / Tap or WASD / Arrow Keys</span>
        </div>
        <span className="text-[#a0a1ab]">
          {isSolved ? '● OVERSEER OPTIC RECONSTRUCTED' : '○ SHIFT TO ALIGN'}
        </span>
      </div>
    </div>
  );
};
