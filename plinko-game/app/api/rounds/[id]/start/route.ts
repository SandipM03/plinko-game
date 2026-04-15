import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPayoutMultiplier } from "@/lib/server/paytable";
import { prisma } from "@/lib/server/prisma";
import { simulateRound } from "@/lib/server/engine";
import { startRoundSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = startRoundSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const round = await prisma.round.findUnique({ where: { id } });
  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  if (round.status !== "CREATED" || !round.serverSeed) {
    return NextResponse.json(
      { error: "Round cannot be started in its current state" },
      { status: 409 },
    );
  }

  const { clientSeed, betCents, dropColumn } = parsed.data;

  const engineResult = simulateRound({
    serverSeed: round.serverSeed,
    clientSeed,
    nonce: round.nonce,
    dropColumn,
  });

  const payoutMultiplier = getPayoutMultiplier(engineResult.binIndex);

  const updatedRound = await prisma.round.update({
    where: { id },
    data: {
      status: "STARTED",
      clientSeed,
      combinedSeed: engineResult.combinedSeed,
      pegMapHash: engineResult.pegMapHash,
      rows: engineResult.rows,
      dropColumn,
      binIndex: engineResult.binIndex,
      payoutMultiplier,
      betCents,
      pathJson: engineResult.path as unknown as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      rows: true,
      pegMapHash: true,
      binIndex: true,
      payoutMultiplier: true,
      pathJson: true,
      commitHex: true,
      nonce: true,
    },
  });

  return NextResponse.json({
    roundId: updatedRound.id,
    rows: updatedRound.rows,
    pegMapHash: updatedRound.pegMapHash,
    binIndex: updatedRound.binIndex,
    payoutMultiplier: updatedRound.payoutMultiplier,
    path: updatedRound.pathJson,
    commitHex: updatedRound.commitHex,
    nonce: updatedRound.nonce,
  });
}
