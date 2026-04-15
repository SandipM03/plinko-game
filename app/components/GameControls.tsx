"use client";

import { useEffect, useState } from "react";
import { GameState } from "@/lib/hooks/useGame";
import { cn } from "@/lib/utils";

type Props = {
  gameState: GameState;
  onCommit: () => void;
  onStart: (clientSeed: string, betCents: number, dropColumn: number) => void;
};

const riskOptions = [
  { label: "Low", selected: false },
  { label: "Medium", selected: true },
  { label: "High", selected: false },
];

export function GameControls({ gameState, onCommit, onStart }: Props) {
  const [betAmount, setBetAmount] = useState(10);
  const [dropColumn, setDropColumn] = useState(6);
  const [clientSeed, setClientSeed] = useState("");

  const isIdle = gameState === "IDLE" || gameState === "FINISHED" || gameState === "ERROR";
  const isReady = gameState === "READY";
  const isPlaying = gameState === "COMMITTING" || gameState === "STARTING" || gameState === "PLAYING" || gameState === "REVEALING";

  useEffect(() => {
    if (isIdle) {
      setClientSeed(Math.random().toString(36).substring(2, 10));
    }
  }, [isIdle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === "ArrowLeft") {
        setDropColumn((value) => Math.max(0, value - 1));
      } else if (e.key === "ArrowRight") {
        setDropColumn((value) => Math.min(12, value + 1));
      } else if (e.key === " " || e.key === "Enter") {
        if (isIdle) {
          e.preventDefault();
          onCommit();
        } else if (isReady) {
          e.preventDefault();
          onStart(clientSeed, betAmount * 100, dropColumn);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isIdle, isReady, clientSeed, betAmount, dropColumn, onCommit, onStart]);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/65 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-5">
      <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-sm text-slate-300">
        <button className="flex-1 rounded-full bg-slate-900 px-3 py-2 font-medium text-white">Manual</button>
        <button className="flex-1 rounded-full px-3 py-2 text-slate-400 transition-colors hover:text-white">Auto</button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <section className="rounded-2xl border border-white/8 bg-[#0d1629] p-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Bet Amount</label>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-slate-400">USD</span>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
            <span className="text-slate-400">$</span>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              disabled={isPlaying}
              min={1}
              className="w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setBetAmount((value) => Math.max(1, Math.floor(value / 2)))}
              disabled={isPlaying}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              1/2x
            </button>
            <button
              onClick={() => setBetAmount((value) => Math.max(1, value * 2))}
              disabled={isPlaying}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              2x
            </button>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-white/8 bg-[#0d1629] p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Risk</label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {riskOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  disabled={isPlaying}
                  className={cn(
                    "rounded-xl px-2 py-2 text-sm font-medium transition-all disabled:opacity-50",
                    option.selected
                      ? "bg-gradient-to-r from-brand-500 to-brand-400 text-slate-950 shadow-[0_8px_24px_rgba(34,182,164,0.35)]"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/8 bg-[#0d1629] p-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Drop Column</label>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-slate-300">0-12</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setDropColumn((value) => Math.max(0, value - 1))}
                disabled={isPlaying || dropColumn === 0}
                className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                -
              </button>
              <div className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center text-2xl font-semibold text-white">
                {dropColumn}
              </div>
              <button
                onClick={() => setDropColumn((value) => Math.min(12, value + 1))}
                disabled={isPlaying || dropColumn === 12}
                className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-white/8 bg-[#0d1629] p-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Client Seed</label>
            <span className="text-[0.7rem] uppercase tracking-[0.3em] text-slate-500">Provably fair</span>
          </div>
          <input
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            disabled={isPlaying}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-sm text-slate-200 outline-none placeholder:text-slate-600 disabled:opacity-50"
          />
        </section>

        {isIdle || gameState === "COMMITTING" ? (
          <button
            onClick={onCommit}
            disabled={gameState === "COMMITTING"}
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-400 to-brand-500 px-4 py-4 text-base font-semibold text-slate-950 shadow-[0_18px_50px_rgba(34,182,164,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:translate-y-0"
          >
            {gameState === "COMMITTING" ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting
              </span>
            ) : (
              "Start Round"
            )}
          </button>
        ) : isReady ? (
          <button
            onClick={() => onStart(clientSeed, betAmount * 100, dropColumn)}
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-4 text-base font-semibold text-white shadow-[0_18px_50px_rgba(255,109,31,0.35)] transition-transform hover:-translate-y-0.5"
          >
            Drop Ball
          </button>
        ) : (
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/8 px-4 py-4 text-base font-semibold text-slate-400"
          >
            <svg className="h-5 w-5 animate-spin text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Round in Progress
          </button>
        )}

        <div className="hidden items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-xs text-slate-400 sm:flex">
          <span className="flex items-center gap-2">
            <kbd className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 font-mono text-slate-200">←</kbd>
            <kbd className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 font-mono text-slate-200">→</kbd>
            Move
          </span>
          <span className="flex items-center gap-2">
            <kbd className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 font-mono text-slate-200">Space</kbd>
            Drop
          </span>
        </div>
      </div>
    </div>
  );
}
