import { BINS } from "./constants";

export const PAYTABLE: number[] = [16, 9, 4, 2, 1.5, 1.2, 1, 1.2, 1.5, 2, 4, 9, 16];

if (PAYTABLE.length !== BINS) {
  throw new Error("Paytable must have exactly 13 entries for bins 0..12.");
}

export function getPayoutMultiplier(binIndex: number): number {
  return PAYTABLE[binIndex] ?? 0;
}
