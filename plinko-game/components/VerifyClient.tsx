"use client";

import { useState } from "react";
import type { PathStep } from "@/lib/shared/types";

interface VerifyResult {
  allMatch?: boolean;
  checks?: Record<string, boolean>;
  computed?: {
    commitHex: string;
    combinedSeed: string;
    pegMapHash: string;
    binIndex: number;
    path: PathStep[];
  };
  stored?: {
    commitHex: string | null;
    combinedSeed: string | null;
    pegMapHash: string | null;
    binIndex: number | null;
    dropColumn: number | null;
  };
  commitHex?: string;
  combinedSeed?: string;
  pegMapHash?: string;
  binIndex?: number;
  path?: PathStep[];
}

interface Props {
  initialRoundId?: string;
}

export default function VerifyClient({ initialRoundId = "" }: Props) {
  const [roundId, setRoundId] = useState(initialRoundId);
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState("");
  const [dropColumn, setDropColumn] = useState(6);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  async function loadRoundForVerification() {
    if (!roundId.trim()) {
      setError("Provide a round ID first.");
      return;
    }

    setError("");
    const response = await fetch(`/api/rounds/${roundId}`);
    if (!response.ok) {
      setError("Round not found.");
      return;
    }

    const round = (await response.json()) as {
      serverSeed: string | null;
      clientSeed: string | null;
      nonce: string;
      dropColumn: number | null;
      status: string;
    };

    if (round.status !== "REVEALED" || !round.serverSeed || !round.clientSeed || round.dropColumn === null) {
      setError("Round is not fully revealed yet.");
      return;
    }

    setServerSeed(round.serverSeed);
    setClientSeed(round.clientSeed);
    setNonce(round.nonce);
    setDropColumn(round.dropColumn);
  }

  async function onVerify() {
    setError("");

    const params = new URLSearchParams({
      serverSeed,
      clientSeed,
      nonce,
      dropColumn: String(dropColumn),
    });

    if (roundId.trim()) {
      params.set("roundId", roundId.trim());
    }

    const response = await fetch(`/api/verify?${params.toString()}`);
    const data = (await response.json()) as VerifyResult | { error: string };

    if (!response.ok) {
      setError((data as { error?: string }).error ?? "Verification failed.");
      return;
    }

    setResult(data as VerifyResult);
  }

  const path = result?.computed?.path ?? result?.path ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(194,65,12,0.65)]">
        <h1 className="mb-2 text-3xl font-bold text-amber-900">Verifier</h1>
        <p className="mb-6 text-sm text-amber-800">
          Recompute commit, combined seed, peg map hash, and final bin from reveal inputs.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-amber-900">
            Round ID (optional)
            <input
              value={roundId}
              onChange={(e) => setRoundId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm text-amber-900">
            Nonce
            <input
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm text-amber-900">
            Server seed
            <input
              value={serverSeed}
              onChange={(e) => setServerSeed(e.target.value)}
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm text-amber-900">
            Client seed
            <input
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm text-amber-900">
            Drop column
            <input
              type="number"
              min={0}
              max={12}
              value={dropColumn}
              onChange={(e) => setDropColumn(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void loadRoundForVerification();
            }}
            className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Load round by ID
          </button>
          <button
            type="button"
            onClick={() => {
              void onVerify();
            }}
            className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Verify
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      {result ? (
        <section className="rounded-3xl border border-amber-200 bg-white/90 p-6">
          <h2 className="mb-3 text-xl font-semibold text-amber-900">Verification result</h2>
          {typeof result.allMatch === "boolean" ? (
            <p className={`mb-3 text-lg font-bold ${result.allMatch ? "text-green-600" : "text-red-600"}`}>
              {result.allMatch ? "PASS" : "FAIL"}
            </p>
          ) : null}

          {result.checks ? (
            <ul className="mb-4 grid gap-1 text-sm text-amber-900 sm:grid-cols-2">
              {Object.entries(result.checks).map(([key, value]) => (
                <li key={key}>
                  {key}: {value ? "OK" : "Mismatch"}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 text-sm text-amber-900">
              <div>Commit: {result.computed?.commitHex ?? result.commitHex}</div>
              <div>Combined seed: {result.computed?.combinedSeed ?? result.combinedSeed}</div>
              <div>Peg map hash: {result.computed?.pegMapHash ?? result.pegMapHash}</div>
              <div>Bin index: {result.computed?.binIndex ?? result.binIndex}</div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="mb-2 text-sm font-semibold text-amber-900">Path replay</div>
              <div className="max-h-44 overflow-auto text-xs text-amber-900">
                {path.map((step) => (
                  <div key={step.row}>
                    row {step.row}: {step.direction} (rnd={step.rnd}, bias={step.adjustedBias})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
