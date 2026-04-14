"use client";

import { useState } from "react";

export function FairnessDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-black/50 hover:bg-black/80 backdrop-blur border border-white/10 text-zinc-300 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Provably Fair
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 h-full border-l border-white/10 shadow-2xl overflow-y-auto animate-in slide-in-from-right origin-right duration-300">
            <div className="p-6 sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-white/5 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Fairness Protocol
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 space-y-8 text-zinc-300 text-sm leading-relaxed">
              <section>
                <h3 className="text-white font-semibold mb-2">How it works</h3>
                <p>This game uses a cryptographic commitment scheme to ensure that the outcome is determined before the ball drops and cannot be tampered with by the server or the client.</p>
              </section>

              <section className="space-y-4 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10"></div>
                
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-brand-900 border border-brand-500 rounded-full flex items-center justify-center text-xs font-bold text-brand-300">1</div>
                  <h4 className="text-white font-medium">Server Commit</h4>
                  <p className="text-zinc-400 mt-1">Before you bet, the server generates a random <code>serverSeed</code> and <code>nonce</code>. It hashes them using SHA-256 and shows you the hash. This commits the server to its numbers.</p>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-brand-900 border border-brand-500 rounded-full flex items-center justify-center text-xs font-bold text-brand-300">2</div>
                  <h4 className="text-white font-medium">Client Seed</h4>
                  <p className="text-zinc-400 mt-1">You provide a <code>clientSeed</code>. Together, neither party knows the final combined seed.</p>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-brand-900 border border-brand-500 rounded-full flex items-center justify-center text-xs font-bold text-brand-300">3</div>
                  <h4 className="text-white font-medium">Deterministic Engine</h4>
                  <p className="text-zinc-400 mt-1">The server combines the seeds: <code>SHA256(serverSeed:clientSeed:nonce)</code>. This derives a PRNG used to generate the Plinko board peg biases and compute the exact path of the ball.</p>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-brand-900 border border-brand-500 rounded-full flex items-center justify-center text-xs font-bold text-brand-300">4</div>
                  <h4 className="text-white font-medium">Reveal & Verify</h4>
                  <p className="text-zinc-400 mt-1">After the round ends, the server uncovers its <code>serverSeed</code>. You can replay the exact same inputs in the Verifier to mathematically prove the result was fair.</p>
                </div>
              </section>

              <div className="pt-4 border-t border-white/10">
                <a 
                  href="/verify"
                  target="_blank"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg font-medium transition-colors"
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
