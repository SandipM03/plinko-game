"use client";
type Props = {
  commitHex: string | null;
  serverSeed: string | null;
};

export function RoundInfo({ commitHex, serverSeed }: Props) {
  if (!commitHex) return null;

  return (
    <div className="mt-8 p-4 rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-brand-300 uppercase tracking-wider">Round Info</h3>
        <span className="text-xs bg-brand-900 text-brand-200 px-2 py-1 rounded-full">Provably Fair</span>
      </div>
      
      <div className="space-y-3 mt-4">
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Server Commit Hash</label>
          <div className="font-mono text-xs p-2 bg-black/50 rounded border border-white/5 break-all text-zinc-300">
            {commitHex}
          </div>
        </div>
        
        {serverSeed ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            <label className="text-xs text-accent-500 block mb-1">Server Seed (Revealed)</label>
            <div className="font-mono text-xs p-2 bg-accent-900/20 rounded border border-accent-500/20 break-all text-accent-400">
              {serverSeed}
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Server Seed</label>
            <div className="font-mono text-xs p-2 bg-black/30 rounded border border-white/5 text-zinc-600 italic flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Hidden until round ends
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
