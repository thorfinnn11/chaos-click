export type GateStatus = 'idle' | 'freezing' | 'puzzle' | 'thawing' | 'boss' | 'reverting';

export interface GateState {
  status: GateStatus;
  targetStage: number;
  seed: number;
  fails: number;
  assist: boolean;
}

export interface PuzzleProps {
  stage: number;
  seed: number;
  assist: boolean;
  onSolved: () => void;
  onFail: () => void;
}
