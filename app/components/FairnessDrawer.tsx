"use client";

import { useState } from "react";

export function FairnessDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full border border-white/10 bg-slate-950/75 px-4 py-3 text-sm font-medium text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:bg-slate-900/85 hover:text-white"
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Provably Fair
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-slate-950 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/90 p-6 backdrop-blur">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Fairness Protocol
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-slate-500 transition-colors hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="flex flex-col gap-8 p-6 text-sm leading-relaxed text-slate-300">
              <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-white">How it works</h3>
                <p>This game uses a cryptographic commitment scheme to ensure that the outcome is determined before the ball drops and cannot be tampered with by the server or the client.</p>
              </section>

              <section className="relative flex flex-col gap-4">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />

                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-brand-500 bg-brand-900 text-xs font-bold text-brand-300">1</div>
                  <h4 className="text-white font-medium">Server Commit</h4>
                  <p className="mt-1 text-slate-400">Before you bet, the server generates a random <code>serverSeed</code> and <code>nonce</code>. It hashes them using SHA-256 and shows you the hash. This commits the server to its numbers.</p>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-brand-500 bg-brand-900 text-xs font-bold text-brand-300">2</div>
                  <h4 className="text-white font-medium">Client Seed</h4>
                  <p className="mt-1 text-slate-400">You provide a <code>clientSeed</code>. Together, neither party knows the final combined seed.</p>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-brand-500 bg-brand-900 text-xs font-bold text-brand-300">3</div>
                  <h4 className="text-white font-medium">Deterministic Engine</h4>
                  <p className="mt-1 text-slate-400">The server combines the seeds: <code>SHA256(serverSeed:clientSeed:nonce)</code>. This derives a PRNG used to generate the Plinko board peg biases and compute the exact path of the ball.</p>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-brand-500 bg-brand-900 text-xs font-bold text-brand-300">4</div>
                  <h4 className="text-white font-medium">Reveal & Verify</h4>
                  <p className="mt-1 text-slate-400">After the round ends, the server uncovers its <code>serverSeed</code>. You can replay the exact same inputs in the Verifier to mathematically prove the result was fair.</p>
                </div>
              </section>

              <div className="border-t border-white/10 pt-4">
                <a
                  href="/verify"
                  target="_blank"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
                >
                  Open Verifier Tool
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
