import { NextRequest, NextResponse } from "next/server";
import {
  generateCommitHex,
  generateCombinedSeed,
} from "@/lib/engine/crypto";
import { simulateRound } from "@/lib/engine/plinko";
import { VerifyResult } from "@/lib/engine/types";


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serverSeed = searchParams.get("serverSeed");
    const clientSeed = searchParams.get("clientSeed");
    const nonce = searchParams.get("nonce");
    const dropColumnStr = searchParams.get("dropColumn");

    if (!serverSeed || !clientSeed || !nonce || !dropColumnStr) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const dropColumn = parseInt(dropColumnStr, 10);
    if (isNaN(dropColumn) || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: "Invalid dropColumn" },
        { status: 400 }
      );
    }


    const commitHex = generateCommitHex(serverSeed, nonce);


    const combinedSeed = generateCombinedSeed(serverSeed, clientSeed, nonce);

    const result = simulateRound(combinedSeed, dropColumn);

    const verificationResult: VerifyResult = {
      commitHex,
      combinedSeed,
      pegMapHash: result.pegMapHash,
      binIndex: result.binIndex,
      path: result.path,
    };

    return NextResponse.json(verificationResult);
  } catch (error) {
    console.error("Error verifying round:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
