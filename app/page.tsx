"use client";

import { PlinkoBoard } from "./components/PlinkoBoard";
import { GameControls } from "./components/GameControls";
import { PayoutTable } from "./components/PayoutTable";
import { RoundInfo } from "./components/RoundInfo";
import { FairnessDrawer } from "./components/FairnessDrawer";
import { MuteToggle } from "./components/MuteToggle";
import { ConfettiEffect } from "./components/ConfettiEffect";
import { useGame } from "@/lib/hooks/useGame";


export default function Home() {
  const game = useGame();

  const handleAnimationComplete = () => {
     if (game.gameState === "PLAYING") {
       game.setGameState("REVEALING");
       game.reveal();
     }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[140px]" />
        <div className="absolute right-[-8%] top-[18%] h-[22rem] w-[22rem] rounded-full bg-accent-500/12 blur-[140px]" />
        <div className="absolute left-[-6%] bottom-[-10%] h-[24rem] w-[24rem] rounded-full bg-sky-400/10 blur-[140px]" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-4">
        <header className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-slate-950/55 px-4 py-3 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500 text-white shadow-[0_12px_30px_rgba(34,182,164,0.25)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">Plinko Lab</p>
              <h1 className="text-lg font-semibold text-white sm:text-2xl">Reactive board, mobile first</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-right sm:block">
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Balance</p>
              <p className="text-sm font-semibold text-white">$347.10</p>
            </div>
            <MuteToggle />
          </div>
        </header>

        <div className="grid flex-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[364px_minmax(0,1fr)]">
          <aside className="order-2 flex flex-col gap-4 lg:order-1 lg:sticky lg:top-4 lg:self-start">
            <GameControls
              gameState={game.gameState}
              onCommit={game.commit}
              onStart={game.start}
            />

            <RoundInfo commitHex={game.commitHex} serverSeed={game.serverSeed} />
          </aside>

          <section className="order-1 flex flex-col gap-4 lg:order-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-3 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-4">
              <div className="mb-4 flex items-center justify-between gap-3 px-1 pt-1">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">Game Board</p>
                  <p className="text-sm text-slate-300">Optimized for touch and desktop play.</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  Provably fair
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/5 bg-[#0b1324] p-3 sm:p-4">
                <PlinkoBoard
                  roundResult={game.roundResult}
                  dropColumn={6}
                  onAnimationComplete={handleAnimationComplete}
                />
                <PayoutTable activeBinIndex={game.roundResult?.binIndex || null} />
              </div>
            </div>
          </section>
        </div>

        <ConfettiEffect active={game.gameState === "FINISHED"} />
        <FairnessDrawer />
      </div>
    </main>
  );
}
