import { NextRequest, NextResponse } from "next/server";
import { computeCommitHex, computeCombinedSeed } from "@/lib/server/fairness";
import { prisma } from "@/lib/server/prisma";
import { simulateRound } from "@/lib/server/engine";
import { verifySchema } from "@/lib/server/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const queryInput = {
    serverSeed: request.nextUrl.searchParams.get("serverSeed"),
    clientSeed: request.nextUrl.searchParams.get("clientSeed"),
    nonce: request.nextUrl.searchParams.get("nonce"),
    dropColumn: request.nextUrl.searchParams.get("dropColumn"),
    roundId: request.nextUrl.searchParams.get("roundId") ?? undefined,
  };

  const parsed = verifySchema.safeParse(queryInput);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query params",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { serverSeed, clientSeed, nonce, dropColumn, roundId } = parsed.data;
  const commitHex = computeCommitHex(serverSeed, nonce);
  const recomputed = simulateRound({
    serverSeed,
    clientSeed,
    nonce,
    dropColumn,
  });
  const combinedSeed = computeCombinedSeed(serverSeed, clientSeed, nonce);

  if (!roundId) {
    return NextResponse.json({
      commitHex,
      combinedSeed,
      pegMapHash: recomputed.pegMapHash,
      binIndex: recomputed.binIndex,
      path: recomputed.path,
    });
  }

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  const checks = {
    commitHex: round.commitHex === commitHex,
    combinedSeed: round.combinedSeed === combinedSeed,
    pegMapHash: round.pegMapHash === recomputed.pegMapHash,
    binIndex: round.binIndex === recomputed.binIndex,
    dropColumn: round.dropColumn === dropColumn,
  };

  const allMatch = Object.values(checks).every(Boolean);

  return NextResponse.json({
    roundId: round.id,
    allMatch,
    checks,
    computed: {
      commitHex,
      combinedSeed,
      pegMapHash: recomputed.pegMapHash,
      binIndex: recomputed.binIndex,
      path: recomputed.path,
    },
    stored: {
      commitHex: round.commitHex,
      combinedSeed: round.combinedSeed,
      pegMapHash: round.pegMapHash,
      binIndex: round.binIndex,
      dropColumn: round.dropColumn,
    },
  });
}
