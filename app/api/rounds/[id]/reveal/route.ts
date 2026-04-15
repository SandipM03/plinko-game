import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }
    if (round.status !== "STARTED") {
      return NextResponse.json(
        { error: "Round not in STARTED state" },
        { status: 400 }
      );
    }

    await prisma.round.update({
      where: { id },
      data: {
        status: "REVEALED",
        revealedAt: new Date(),
      },
    });

    return NextResponse.json({
      serverSeed: round.serverSeed,
    });
  } catch (error) {
    console.error("Error revealing round:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
