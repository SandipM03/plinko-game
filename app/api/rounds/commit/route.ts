import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateServerSeed, generateNonce, generateCommitHex } from "@/lib/engine/crypto";


export async function POST() {
  try {
    const serverSeed = generateServerSeed();
    const nonce = generateNonce();
    const commitHex = generateCommitHex(serverSeed, nonce);

    const round = await prisma.round.create({
      data: {
        status: "CREATED",
        nonce,
        commitHex,
        serverSeed,
      },
    });

    return NextResponse.json({
      roundId: round.id,
      commitHex,
      nonce,
    });
  } catch (error) {
    console.error("Error creating commit:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
