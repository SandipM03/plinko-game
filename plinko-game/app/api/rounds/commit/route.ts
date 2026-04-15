import { NextResponse } from "next/server";
import { computeCommitHex, generateNonce, generateServerSeed } from "@/lib/server/fairness";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function POST() {
  const serverSeed = generateServerSeed();
  const nonce = generateNonce();
  const commitHex = computeCommitHex(serverSeed, nonce);

  const round = await prisma.round.create({
    data: {
      status: "CREATED",
      nonce,
      commitHex,
      serverSeed,
    },
    select: {
      id: true,
      commitHex: true,
      nonce: true,
    },
  });

  return NextResponse.json({
    roundId: round.id,
    commitHex: round.commitHex,
    nonce: round.nonce,
  });
}
