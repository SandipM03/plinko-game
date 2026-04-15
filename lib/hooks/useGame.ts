"use client";

import { useState, useCallback } from "react";
import { RoundResult } from "../engine/types";

export type GameState = "IDLE" | "COMMITTING" | "READY" | "STARTING" | "PLAYING" | "REVEALING" | "FINISHED" | "ERROR";

export function useGame() {
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [roundId, setRoundId] = useState<string | null>(null);
  const [commitHex, setCommitHex] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [serverSeed, setServerSeed] = useState<string | null>(null);
  const [roundResult, setRoundResult] = useState<Partial<RoundResult> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback(async () => {
    try {
      setGameState("COMMITTING");
      setError(null);
      
      const res = await fetch("/api/rounds/commit", { method: "POST" });
      if (!res.ok) throw new Error("Failed to commit round");
      
      const data = await res.json();
      setRoundId(data.roundId);
      setCommitHex(data.commitHex);
      setNonce(data.nonce);
      setServerSeed(null); 
      setRoundResult(null); 
      setGameState("READY");
    } catch (err: any) {
      setError(err.message);
      setGameState("ERROR");
    }
  }, []);

  const start = useCallback(async (clientSeed: string, betCents: number, dropColumn: number) => {
    if (!roundId) return;
    
    try {
      setGameState("STARTING");
      setError(null);

      const res = await fetch(`/api/rounds/${roundId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSeed, betCents, dropColumn }),
      });
      
      if (!res.ok) throw new Error("Failed to start round");
      
      
      setGameState("PLAYING");
      
     
      const roundRes = await fetch(`/api/rounds/${roundId}`);
      if (!roundRes.ok) throw new Error("Failed to fetch round data");
      
      const roundData = await roundRes.json();
      setRoundResult({
        pegMapHash: roundData.pegMapHash,
        binIndex: roundData.binIndex,
        path: typeof roundData.pathJson === 'string' ? JSON.parse(roundData.pathJson) : roundData.pathJson,
        payoutMultiplier: roundData.payoutMultiplier,
        pegMap: [] 
      });

    } catch (err: any) {
      setError(err.message);
      setGameState("ERROR");
    }
  }, [roundId]);

  const reveal = useCallback(async () => {
    if (!roundId) return;

    try {
      setGameState("REVEALING");
      const res = await fetch(`/api/rounds/${roundId}/reveal`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reveal seed");
      
      const data = await res.json();
      setServerSeed(data.serverSeed);
      setGameState("FINISHED");
    } catch (err: any) {
       console.error("Reveal error", err);
    
       setGameState("FINISHED"); 
    }
  }, [roundId]);

  return {
    gameState,
    roundId,
    commitHex,
    nonce,
    serverSeed,
    roundResult,
    error,
    commit,
    start,
    reveal,
    setGameState, 
  };
}
