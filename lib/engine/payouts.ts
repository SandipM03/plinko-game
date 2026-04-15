
export const PAYTABLE: number[] = [
  88, 25, 10, 5, 3, 1.5, 1, 1.5, 3, 5, 10, 25, 88,
];

export function getPayoutMultiplier(binIndex: number): number {
  if (binIndex < 0 || binIndex >= PAYTABLE.length) {
    throw new Error(`Invalid binIndex: ${binIndex}`);
  }
  return PAYTABLE[binIndex];
}
