"use client";

import { PAYTABLE } from "@/lib/engine/payouts";
import { cn } from "@/lib/utils";

export function PayoutTable({ activeBinIndex }: { activeBinIndex: number | null }) {
  return (
    <div className="mt-4 flex w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/65 p-2 backdrop-blur-sm no-scrollbar">
      {PAYTABLE.map((multiplier, i) => {
        const isHigh = multiplier >= 10;
        const isMid = multiplier > 1 && multiplier < 10;
        const isActive = activeBinIndex === i;

        return (
          <div
            key={i}
            className={cn(
              "flex min-w-[2.6rem] flex-1 flex-col items-center justify-center rounded-xl px-1.5 py-2 text-[0.7rem] font-semibold transition-all duration-300 sm:min-w-0 sm:text-xs",
              isHigh
                ? "bg-gradient-to-b from-rose-500 to-orange-500 text-white"
                : isMid
                ? "bg-gradient-to-b from-amber-400 to-yellow-500 text-slate-950"
                : "bg-gradient-to-b from-slate-700 to-slate-800 text-slate-200",
              isActive && "scale-[1.05] shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_8px_22px_rgba(255,255,255,0.18)]"
            )}
          >
            <span>{multiplier}x</span>
          </div>
        );
      })}
    </div>
  );
}
