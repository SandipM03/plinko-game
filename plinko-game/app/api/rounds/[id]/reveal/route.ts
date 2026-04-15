import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_: Request, { params }: RouteParams) {
  const { id } = await params;

  const round = await prisma.round.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      serverSeed: true,
    },
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  if (!round.serverSeed) {
    return NextResponse.json({ error: "Round has no server seed" }, { status: 422 });
  }

  if (round.status === "REVEALED") {
    return NextResponse.json({ serverSeed: round.serverSeed });
  }

  if (round.status !== "STARTED") {
    return NextResponse.json(
      { error: "Round cannot be revealed in its current state" },
      { status: 409 },
    );
  }

  const updated = await prisma.round.update({
    where: { id },
    data: {
      status: "REVEALED",
      revealedAt: new Date(),
    },
    select: {
      serverSeed: true,
    },
  });

  return NextResponse.json({ serverSeed: updated.serverSeed });
}
