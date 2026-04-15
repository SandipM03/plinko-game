import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCombinedSeed } from "@/lib/engine/crypto";
import { simulateRound } from "@/lib/engine/plinko";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientSeed, betCents, dropColumn } = body;

    if (typeof clientSeed !== "string" || !clientSeed) {
      return NextResponse.json({ error: "Invalid clientSeed" }, { status: 400 });
    }
    if (typeof betCents !== "number" || betCents <= 0) {
      return NextResponse.json({ error: "Invalid betCents" }, { status: 400 });
    }
    if (typeof dropColumn !== "number" || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json({ error: "Invalid dropColumn" }, { status: 400 });
    }

    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }
    if (round.status !== "CREATED") {
      return NextResponse.json({ error: "Round already started or revealed" }, { status: 400 });
    }
    if (!round.serverSeed) {
         return NextResponse.json({ error: "Corrupted round state" }, { status: 500 });
    }

    const combinedSeed = generateCombinedSeed(round.serverSeed, clientSeed, round.nonce);
    const result = simulateRound(combinedSeed, dropColumn);

    await prisma.round.update({
      where: { id },
      data: {
        status: "STARTED",
        clientSeed,
        combinedSeed,
        pegMapHash: result.pegMapHash,
        dropColumn,
        binIndex: result.binIndex,
        payoutMultiplier: result.payoutMultiplier,
        betCents,
        pathJson: result.path,
      },
    });

    return NextResponse.json({
      roundId: id,
      pegMapHash: result.pegMapHash,
      rows: 12,
    });
  } catch (error) {
    console.error("Error starting round:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
