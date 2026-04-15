"use client";

type Props = {
  commitHex: string | null;
  serverSeed: string | null;
};

export function RoundInfo({ commitHex, serverSeed }: Props) {
  if (!commitHex) return null;

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/65 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Round Info</p>
          <h3 className="text-base font-semibold text-white">Provably fair receipt</h3>
        </div>
        <span className="rounded-full border border-brand-400/20 bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-200">Verified</span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.28em] text-slate-400">Server Commit Hash</label>
          <div className="break-all rounded-2xl border border-white/10 bg-slate-950/75 p-3 font-mono text-xs text-slate-200">
            {commitHex}
          </div>
        </div>

        {serverSeed ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            <label className="mb-1 block text-xs uppercase tracking-[0.28em] text-accent-500">Server Seed Revealed</label>
            <div className="break-all rounded-2xl border border-accent-500/20 bg-accent-500/10 p-3 font-mono text-xs text-accent-200">
              {serverSeed}
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.28em] text-slate-500">Server Seed</label>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/55 p-3 font-mono text-xs italic text-slate-500">
              <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
