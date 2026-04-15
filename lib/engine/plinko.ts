import { mulberry32, seedFromHash } from "./prng";
import { sha256 } from "./crypto";
import { getPayoutMultiplier } from "./payouts";
import { PegMap, PathDecision, RoundResult } from "./types";

const ROWS = 12;


export function simulateRound(
  combinedSeed: string,
  dropColumn: number
): RoundResult {
  if (dropColumn < 0 || dropColumn > ROWS) {
    throw new Error(`Invalid dropColumn: ${dropColumn}. Must be 0..${ROWS}`);
  }

  const prngSeed = seedFromHash(combinedSeed);
  const rand = mulberry32(prngSeed);

  const pegMap: PegMap = [];
  for (let r = 0; r < ROWS; r++) {
    const rowPegs = [];
    for (let p = 0; p <= r; p++) {
      
      let leftBias = 0.5 + (rand() - 0.5) * 0.2;
      
      leftBias = Math.round(leftBias * 1_000_000) / 1_000_000;
      rowPegs.push({ leftBias });
    }
    pegMap.push(rowPegs);
  }


  const pegMapHash = sha256(JSON.stringify(pegMap));


  const adj = (dropColumn - Math.floor(ROWS / 2)) * 0.01;

    
  const path: PathDecision[] = [];
  let pos = 0;

  for (let r = 0; r < ROWS; r++) {
      
    const pegIndex = Math.min(pos, r);
    const peg = pegMap[r][pegIndex];

    
    let adjustedBias = peg.leftBias + adj;
    if (adjustedBias < 0) adjustedBias = 0;
    if (adjustedBias > 1) adjustedBias = 1;

    
    const rnd = rand();

    
    const isLeft = rnd < adjustedBias;
    
    path.push({
      row: r,
      dir: isLeft ? "L" : "R",
      pegIndex,
      biasUsed: adjustedBias,
      rndUsed: rnd,
    });

    if (!isLeft) {
      pos += 1;
    }
  }

  
  const binIndex = pos;
  const payoutMultiplier = getPayoutMultiplier(binIndex);

  return {
    pegMap,
    pegMapHash,
    binIndex,
    path,
    payoutMultiplier,
  };
}
