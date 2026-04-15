export type Peg = {
  leftBias: number;
};

export type PegMap = Peg[][];

export type PathDecision = {
  row: number;
  dir: "L" | "R";
  pegIndex: number;
  biasUsed: number;
  rndUsed: number;
};

export type RoundResult = {
  pegMap: PegMap;
  pegMapHash: string;
  binIndex: number;
  path: PathDecision[];
  payoutMultiplier: number;
};

export type VerifyResult = {
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
  path: PathDecision[];
};
