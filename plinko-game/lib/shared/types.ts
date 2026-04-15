export type Direction = "L" | "R";

export interface PathStep {
  row: number;
  pegIndex: number;
  leftBias: number;
  adjustedBias: number;
  rnd: number;
  direction: Direction;
  posBefore: number;
  posAfter: number;
}

export interface StartedRoundResponse {
  roundId: string;
  rows: number;
  pegMapHash: string;
  binIndex: number;
  payoutMultiplier: number;
  path: PathStep[];
  commitHex: string;
  nonce: string;
}
