"use client";

import { useState } from "react";
import { VerifyResult } from "@/lib/engine/types";
import { PlinkoBoard } from "../components/PlinkoBoard";

export default function VerifyPage() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState("");
  const [dropColumn, setDropColumn] = useState<number>(6);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const qs = new URLSearchParams({
        serverSeed,
        clientSeed,
        nonce,
        dropColumn: dropColumn.toString(),
      });
      const res = await fetch(`/api/verify?${qs.toString()}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Verification failed");
      }
      
      const data: VerifyResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 relative flex flex-col items-center">
       <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-900/20 blur-[150px] -z-10 animate-pulse-slow"></div>

       <div className="w-full max-w-4xl text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-accent-500">
            Provably Fair Verifier
          </h1>
          <p className="text-zinc-400">
            Enter the inputs from your round to mathematically recompute the exact same path and outcome.
          </p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full max-w-5xl">
         
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
            <h2 className="text-xl font-bold mb-6 text-brand-300 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
               Round Inputs
            </h2>
            <form onSubmit={handleVerify} className="space-y-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Server Seed (Revealed)</label>
                <input 
                  type="text" 
                  required
                  value={serverSeed}
                  onChange={(e) => setServerSeed(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono text-sm"
                  placeholder="e.g. 5a1b..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Client Seed</label>
                <input 
                  type="text" 
                  required
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Nonce</label>
                  <input 
                    type="text" 
                    required
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Drop Column (0-12)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    max={12}
                    value={dropColumn}
                    onChange={(e) => setDropColumn(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono text-sm"
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit"
                className="w-full mt-6 py-3 rounded-lg font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Round"}
              </button>

              {error && (
                <div className="mt-4 p-3 rounded bg-red-900/30 border border-red-500 text-red-200 text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>

          <div className="space-y-6">
            {result ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-xl font-bold mb-6 text-green-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Verification Successful
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-400">Computed Commit Hex</label>
                    <div className="font-mono text-xs p-2 bg-black/50 rounded border border-white/5 break-all mt-1">
                      {result.commitHex}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-zinc-400">Combined PRNG Seed</label>
                    <div className="font-mono text-xs p-2 bg-black/50 rounded border border-white/5 break-all mt-1">
                      {result.combinedSeed}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center bg-black/50 p-3 rounded border border-white/5 mt-4">
                    <span className="text-zinc-300">Final Bin Landed:</span>
                    <span className="text-2xl font-bold text-accent-500">{result.binIndex}</span>
                  </div>
                </div>
              </div>
            ) : (
               <div className="h-full min-h-[300px] border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-zinc-500">
                 Awaiting verification inputs...
               </div>
            )}
            
            {result && (
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-zinc-300 mb-4 text-center">Path Replay</h3>
                <div className="transform scale-[0.6] origin-top h-[350px] flex justify-center -mt-8 pointer-events-none">
                   
                   <PlinkoBoard 
                      roundResult={result} 
                      dropColumn={dropColumn}
                      onAnimationComplete={()=>{}}
                   />
                </div>
              </div>
            )}
          </div>
       </div>
    </main>
  );
}
