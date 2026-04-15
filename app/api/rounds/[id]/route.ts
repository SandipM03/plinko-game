import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
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

    const responseData = { ...round };
    if (round.status !== "REVEALED") {
      responseData.serverSeed = null;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching round:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
