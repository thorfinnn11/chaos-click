import React from 'react';
import { PuzzleProps } from './types';
import { Puzzle1Calibration } from './Puzzle1Calibration';
import { Puzzle2Presence } from './Puzzle2Presence';
import { Puzzle3Compliance } from './Puzzle3Compliance';
import { PuzzlePlaceholder } from './PuzzlePlaceholder';
import { Puzzle4Reconciliation, Puzzle5SignalTuning } from '../game';

/**
 * Registry of Stage Transition Puzzles
 * Entering stage 1 -> Puzzle 1 (Quick calibration)
 * Entering stage 2 -> Puzzle 2 (Presence check)
 * Entering stage 3 -> Puzzle 3 (Compliance review)
 * Entering stage 4 -> Puzzle 4 (File reconciliation sliding puzzle)
 * Entering stage 5 -> Puzzle 5 (Signal tuning oscilloscope)
 */
export const puzzleRegistry: Record<number, React.FC<PuzzleProps>> = {
  1: Puzzle1Calibration,
  2: Puzzle2Presence,
  3: Puzzle3Compliance,
  4: Puzzle4Reconciliation,
  5: Puzzle5SignalTuning,
};

export function getPuzzleComponent(stage: number): React.FC<PuzzleProps> {
  return puzzleRegistry[stage] || PuzzlePlaceholder;
}
