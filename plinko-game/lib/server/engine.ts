import { BINS, MAX_BIAS, MIN_BIAS, ROWS } from "./constants";
import { clamp, roundTo6, sha256Hex } from "./fairness";

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

export interface EngineResult {
  rows: number;
  combinedSeed: string;
  pegMap: number[][];
  pegMapHash: string;
  path: PathStep[];
  binIndex: number;
  adjustment: number;
}

function createXorShift32(seed: number): () => number {
  let state = seed >>> 0;
  if (state === 0) {
    state = 0x9e3779b9;
  }

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const normalized = (state >>> 0) / 0x100000000;
    return normalized;
  };
}

function seedHexToUint32(seedHex: string): number {
  const start = seedHex.slice(0, 8);
  return Number.parseInt(start, 16) >>> 0;
}

function buildPegMap(rand: () => number): number[][] {
  const pegMap: number[][] = [];

  for (let row = 0; row < ROWS; row += 1) {
    const rowPegs: number[] = [];
    for (let peg = 0; peg <= row; peg += 1) {
      const bias = 0.5 + (rand() - 0.5) * 0.2;
      rowPegs.push(roundTo6(clamp(bias, MIN_BIAS, MAX_BIAS)));
    }
    pegMap.push(rowPegs);
  }

  return pegMap;
}

export interface SimulateRoundInput {
  serverSeed: string;
  clientSeed: string;
  nonce: string;
  dropColumn: number;
}

export function simulateRound(input: SimulateRoundInput): EngineResult {
  const combinedSeed = sha256Hex(`${input.serverSeed}:${input.clientSeed}:${input.nonce}`);
  const rand = createXorShift32(seedHexToUint32(combinedSeed));

  // PRNG stream order is fixed: peg map first, then row decisions.
  const pegMap = buildPegMap(rand);
  const pegMapHash = sha256Hex(JSON.stringify(pegMap));

  const adjustment = (input.dropColumn - Math.floor(ROWS / 2)) * 0.01;

  let pos = 0;
  const path: PathStep[] = [];

  for (let row = 0; row < ROWS; row += 1) {
    const pegIndex = Math.min(pos, row);
    const leftBias = pegMap[row][pegIndex];
    const adjustedBias = roundTo6(clamp(leftBias + adjustment, 0, 1));
    const rnd = roundTo6(rand());
    const posBefore = pos;

    let direction: Direction = "L";
    if (rnd >= adjustedBias) {
      direction = "R";
      pos += 1;
    }

    path.push({
      row,
      pegIndex,
      leftBias,
      adjustedBias,
      rnd,
      direction,
      posBefore,
      posAfter: pos,
    });
  }

  if (pos < 0 || pos >= BINS) {
    throw new Error("Engine produced an out-of-range bin index.");
  }

  return {
    rows: ROWS,
    combinedSeed,
    pegMap,
    pegMapHash,
    path,
    binIndex: pos,
    adjustment: roundTo6(adjustment),
  };
}
