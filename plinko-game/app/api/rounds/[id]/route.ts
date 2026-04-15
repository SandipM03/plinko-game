import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;

  const round = await prisma.round.findUnique({
    where: { id },
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  return NextResponse.json(round);
}
