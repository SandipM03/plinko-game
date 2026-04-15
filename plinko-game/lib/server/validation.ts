import { z } from "zod";
import { BINS, ROWS } from "./constants";

export const startRoundSchema = z.object({
  clientSeed: z.string().trim().min(1).max(120),
  betCents: z.number().int().min(1).max(100_000_000),
  dropColumn: z.number().int().min(0).max(BINS - 1),
});

export const verifySchema = z.object({
  serverSeed: z.string().trim().min(1),
  clientSeed: z.string().trim().min(1),
  nonce: z.string().trim().min(1),
  dropColumn: z.coerce.number().int().min(0).max(BINS - 1),
  roundId: z.string().trim().optional(),
});

export function assertRoundStarted(round: {
  serverSeed: string | null;
  clientSeed: string | null;
  combinedSeed: string | null;
  pegMapHash: string | null;
  dropColumn: number | null;
  binIndex: number | null;
  rows: number | null;
}): void {
  if (
    !round.serverSeed ||
    !round.clientSeed ||
    !round.combinedSeed ||
    !round.pegMapHash ||
    round.dropColumn === null ||
    round.binIndex === null ||
    round.rows !== ROWS
  ) {
    throw new Error("Round is missing required started fields.");
  }
}
