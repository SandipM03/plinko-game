"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PathStep, StartedRoundResponse } from "@/lib/shared/types";

const ROWS = 12;
const BINS = 13;
const PAYTABLE = [16, 9, 4, 2, 1.5, 1.2, 1, 1.2, 1.5, 2, 4, 9, 16];

type Phase = "idle" | "committing" | "running" | "revealing";

interface RoundSummary {
  roundId: string;
  commitHex: string;
  nonce: string;
  serverSeed?: string;
  combinedSeed?: string;
  pegMapHash: string;
  binIndex: number;
  payoutMultiplier: number;
  betCents: number;
  dropColumn: number;
  path: PathStep[];
}

interface RoundHistoryItem {
  id: string;
  multiplier: number;
  binIndex: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

function toMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function randomClientSeed(): string {
  return `seed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export default function PlinkoGameClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dropColumn, setDropColumn] = useState(6);
  const [betCents, setBetCents] = useState(500);
  const [clientSeed, setClientSeed] = useState(randomClientSeed());
  const [muted, setMuted] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [recentRound, setRecentRound] = useState<RoundSummary | null>(null);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);
  const [liveBall, setLiveBall] = useState<{ x: number; y: number } | null>(null);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

  const reducedMotion = useReducedMotion();

  const board = useMemo(() => {
    const width = 900;
    const height = 850;
    const topY = 100;
    const rowGap = 50;
    const pegSpacing = 52;
    const centerX = width / 2;
    const binsY = topY + rowGap * (ROWS + 1);

    const pegs: Array<{ x: number; y: number }> = [];
    for (let row = 0; row < ROWS; row += 1) {
      const rowWidth = row * pegSpacing;
      const rowStart = centerX - rowWidth / 2;
      for (let i = 0; i <= row; i += 1) {
        pegs.push({ x: rowStart + i * pegSpacing, y: topY + row * rowGap });
      }
    }

    const bins = Array.from({ length: BINS }, (_, index) => {
      const x = centerX + (index - ROWS / 2) * pegSpacing;
      return {
        index,
        x,
        y: binsY,
      };
    });

    return { width, height, topY, rowGap, pegSpacing, centerX, binsY, pegs, bins };
  }, []);

  const playTone = useCallback(
    (frequency: number, durationSeconds: number, type: OscillatorType = "sine") => {
      if (muted) {
        return;
      }

      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      oscillator.start(now);
      oscillator.stop(now + durationSeconds + 0.02);
    },
    [muted],
  );

  const playTick = useCallback(() => playTone(680, 0.06, "triangle"), [playTone]);

  const playWin = useCallback(() => {
    playTone(520, 0.07, "square");
    window.setTimeout(() => playTone(840, 0.1, "square"), 80);
  }, [playTone]);

  const spawnConfetti = useCallback((x: number, y: number) => {
    const colors = ["#f97316", "#fb923c", "#fdba74", "#f59e0b", "#22c55e", "#06b6d4"];
    const particles: ConfettiParticle[] = Array.from({ length: 40 }, () => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: -Math.random() * 6 - 1,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setConfetti(particles);
  }, []);

  const drawBoard = useCallback(
    (ctx: CanvasRenderingContext2D, pulseBinIndex?: number) => {
      const { width, height, pegs, bins, binsY } = board;
      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#fff7ed");
      bgGradient.addColorStop(1, "#ffedd5");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#7c2d12";
      for (const peg of pegs) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const bin of bins) {
        const mul = PAYTABLE[bin.index];
        const isPulse = pulseBinIndex === bin.index;
        const h = isPulse ? 50 : 40;
        const y = binsY - h / 2;

        ctx.fillStyle = isPulse ? "#ef4444" : "#ea580c";
        ctx.fillRect(bin.x - 16, y, 32, h);

        ctx.fillStyle = "#fff";
        ctx.font = "600 12px var(--font-plex-mono), monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${mul}x`, bin.x, y + 24);
      }

      const selectorX = bins[dropColumn].x;

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.moveTo(selectorX, 18);
      ctx.lineTo(selectorX - 10, 38);
      ctx.lineTo(selectorX + 10, 38);
      ctx.closePath();
      ctx.fill();
    },
    [board, dropColumn],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    drawBoard(ctx, recentRound?.binIndex);

    if (liveBall) {
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(liveBall.x, liveBall.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (confetti.length > 0) {
      for (const p of confetti) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 5, 5);
      }
    }
  }, [drawBoard, liveBall, confetti, recentRound?.binIndex]);

  useEffect(() => {
    if (confetti.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setConfetti((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2,
            life: p.life - 0.03,
          }))
          .filter((p) => p.life > 0);
        return next;
      });
    }, 16);

    return () => window.clearInterval(timer);
  }, [confetti.length]);

  const animatePath = useCallback(
    async (path: PathStep[], finalBinIndex: number) => {
      const selectedColumnX = board.bins[dropColumn].x;
      const launchOffset = selectedColumnX - board.centerX;
      const points: Array<{ x: number; y: number; isPegHit?: boolean }> = [{
        x: selectedColumnX,
        y: 35,
      }];

      // First segment is a straight drop from the selected column marker.
      points.push({ x: selectedColumnX, y: board.topY - board.rowGap * 0.4 });

      for (const step of path) {
        const row = step.row;
        const rowAfterStep = row + 1;
        const hitY = board.topY + row * board.rowGap;
        const exitY = board.topY + rowAfterStep * board.rowGap;

        const hitBaseX = board.centerX + (step.pegIndex - row / 2) * board.pegSpacing;
        const hitFade = Math.exp(-(row + 0.5) / 3.8);
        const hitX = hitBaseX + launchOffset * hitFade;

        const exitBaseX = board.centerX + (step.posAfter - rowAfterStep / 2) * board.pegSpacing;
        const exitFade = Math.exp(-rowAfterStep / 3.8);
        const exitX = exitBaseX + launchOffset * exitFade;

        points.push({ x: hitX, y: hitY, isPegHit: true });
        points.push({ x: exitX, y: exitY });
      }

      points.push({ x: board.bins[finalBinIndex].x, y: board.binsY - 24, isPegHit: true });

      if (reducedMotion) {
        const midpoint = points[Math.floor(points.length / 2)] ?? points[0];
        const end = points[points.length - 1];

        // Keep motion minimal but still visible for reduced-motion users.
        setLiveBall(points[0]);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        setLiveBall(midpoint);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        setLiveBall(end);
        playWin();
        spawnConfetti(board.bins[finalBinIndex].x, board.binsY - 20);
        return;
      }

      for (let i = 0; i < points.length - 1; i += 1) {
        const from = points[i];
        const to = points[i + 1];
        const isPegHit = to.isPegHit || false;

        // Animate to peg or next position
        await new Promise<void>((resolve) => {
          const duration = 100;
          const start = performance.now();

          const stepFrame = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = isPegHit ? 1 - Math.pow(1 - t, 2) : 1 - Math.pow(1 - t, 3);
            setLiveBall({
              x: from.x + (to.x - from.x) * eased,
              y: from.y + (to.y - from.y) * eased,
            });

            if (t >= 1) {
              if (isPegHit) {
                playTick();
              }
              resolve();
              return;
            }

            requestAnimationFrame(stepFrame);
          };

          requestAnimationFrame(stepFrame);
        });

        // Brief pause/bounce at peg hits (except final bucket landing which triggers win)
        if (isPegHit && i < points.length - 2) {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 60);
          });
        }
      }

      playWin();
      spawnConfetti(board.bins[finalBinIndex].x, board.binsY - 20);
    },
    [board, dropColumn, playTick, playWin, reducedMotion, spawnConfetti],
  );

  const handleDrop = useCallback(async () => {
    if (phase !== "idle") {
      return;
    }

    setPhase("committing");
    setStatusText("Creating commitment...");
    setLiveBall({ x: board.bins[dropColumn].x, y: 35 });

    try {
      const commitRes = await fetch("/api/rounds/commit", { method: "POST" });
      if (!commitRes.ok) {
        throw new Error("Could not create round commitment.");
      }

      const commitData = (await commitRes.json()) as {
        roundId: string;
        commitHex: string;
        nonce: string;
      };

      setPhase("running");
      setStatusText("Running deterministic round...");

      const startRes = await fetch(`/api/rounds/${commitData.roundId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSeed,
          betCents,
          dropColumn,
        }),
      });

      if (!startRes.ok) {
        throw new Error("Round start failed.");
      }

      const startData = (await startRes.json()) as StartedRoundResponse;

      await animatePath(startData.path, startData.binIndex);

      setPhase("revealing");
      setStatusText("Revealing server seed...");

      const revealRes = await fetch(`/api/rounds/${commitData.roundId}/reveal`, {
        method: "POST",
      });
      if (!revealRes.ok) {
        throw new Error("Reveal failed.");
      }
      const revealData = (await revealRes.json()) as { serverSeed: string };

      const fullRoundRes = await fetch(`/api/rounds/${commitData.roundId}`);
      const fullRound = (await fullRoundRes.json()) as {
        combinedSeed: string | null;
      };

      const summary: RoundSummary = {
        roundId: startData.roundId,
        commitHex: startData.commitHex,
        nonce: startData.nonce,
        serverSeed: revealData.serverSeed,
        combinedSeed: fullRound.combinedSeed ?? undefined,
        pegMapHash: startData.pegMapHash,
        binIndex: startData.binIndex,
        payoutMultiplier: startData.payoutMultiplier,
        betCents,
        dropColumn,
        path: startData.path,
      };

      setRecentRound(summary);
      
      // Animate result badge sliding in
      const newHistoryItem: RoundHistoryItem = {
        id: startData.roundId,
        multiplier: startData.payoutMultiplier,
        binIndex: startData.binIndex,
      };
      
      setRoundHistory((previous) => {
        const next = [newHistoryItem, ...previous];
        return next.slice(0, 16);
      });
      
      setStatusText(`Round complete: landed in bin ${startData.binIndex}.`);
      setClientSeed(randomClientSeed());
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setPhase("idle");
    }
  }, [animatePath, betCents, board.bins, clientSeed, dropColumn, phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setDropColumn((current) => Math.max(0, current - 1));
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setDropColumn((current) => Math.min(BINS - 1, current + 1));
      }

      if (event.code === "Space") {
        event.preventDefault();
        if (phase === "idle") {
          void handleDrop();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDrop, phase]);

  const expectedPayout = useMemo(() => {
    const multiplier = recentRound?.payoutMultiplier ?? PAYTABLE[dropColumn] ?? 1;
    return Math.round(betCents * multiplier);
  }, [betCents, dropColumn, recentRound?.payoutMultiplier]);

  const getHistoryBadgeClass = useCallback((multiplier: number) => {
    if (multiplier >= 9) {
      return "bg-rose-600 text-white";
    }
    if (multiplier >= 4) {
      return "bg-orange-500 text-white";
    }
    if (multiplier >= 2) {
      return "bg-amber-500 text-amber-950";
    }
    if (multiplier >= 1) {
      return "bg-lime-400 text-lime-950";
    }
    return "bg-slate-300 text-slate-900";
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-amber-200 bg-white/85 p-5 shadow-[0_20px_60px_-35px_rgba(194,65,12,0.65)] backdrop-blur-sm sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-amber-900">Provably Fair Plinko</h1>
            <p className="text-sm text-amber-800/80">
              12 rows, deterministic replay, commit-reveal protocol, and verifier tooling.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="rounded-xl border border-amber-300 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
              aria-pressed={muted}
            >
              {muted ? "Unmute" : "Mute"}
            </button>
            <Link
              href={recentRound ? `/verify?roundId=${recentRound.roundId}` : "/verify"}
              className="rounded-xl bg-amber-900 px-3 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-800"
            >
              Open Verifier
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_2fr_300px]">
          {/* Left: Controls Section */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-4 text-sm font-semibold text-amber-900">Game Controls</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-amber-900" htmlFor="dropColumn">
                    Drop column (0-12)
                  </label>
                  <input
                    id="dropColumn"
                    type="range"
                    min={0}
                    max={12}
                    value={dropColumn}
                    onChange={(e) => setDropColumn(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-sm font-medium text-amber-900">Selected: {dropColumn}</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-amber-900" htmlFor="betCents">
                    Bet cents
                  </label>
                  <input
                    id="betCents"
                    type="number"
                    min={1}
                    max={100000000}
                    value={betCents}
                    onChange={(e) => setBetCents(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-amber-900" htmlFor="clientSeed">
                    Client seed
                  </label>
                  <input
                    id="clientSeed"
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm truncate text-xs"
                  />
                </div>

                <button
                  type="button"
                  disabled={phase !== "idle"}
                  onClick={() => {
                    void handleDrop();
                  }}
                  className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-amber-700"
                >
                  {phase === "idle" ? "Drop" : "Running..."}
                </button>

                <div className="rounded-lg bg-white px-3 py-2 text-sm text-amber-900">
                  <span className="font-medium">Status:</span> <span className="block text-xs mt-1">{statusText}</span>
                </div>

                <div className="rounded-lg bg-white px-3 py-2 text-sm text-amber-900">
                  <span className="font-medium">Expected payout:</span> <span className="block text-orange-600 font-bold mt-1">{toMoney(expectedPayout)}</span>
                </div>

                <div className="text-xs text-amber-800/80 bg-amber-100 rounded-lg p-2">
                  <p>⌨️ Left/Right: column</p>
                  <p>Space: drop</p>
                </div>
              </div>
            </div>

            {/* Recent Drops History */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-amber-900">Recent drops</h3>
              {roundHistory.length === 0 ? (
                <p className="text-xs text-amber-800/90">No results yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roundHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-semibold ${getHistoryBadgeClass(item.multiplier)}`}
                    >
                      <span>{item.multiplier}x</span>
                      <span>bin {item.binIndex}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-2">
            <canvas
              ref={canvasRef}
              width={board.width}
              height={board.height}
              className="h-auto w-full rounded-xl"
              aria-label="Plinko board"
            />
          </div>

          {/* Right: Paytable and Last Round */}
          <div className="flex flex-col gap-5">
            {/* Paytable */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-amber-900">Paytable (bin 0..12)</h3>
              <div className="grid grid-cols-3 gap-2">
                {PAYTABLE.map((multiplier, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-amber-300 bg-white p-2 text-center text-xs font-semibold text-amber-900"
                  >
                    <div>{index}</div>
                    <div>{multiplier}x</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Last round */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-amber-900">Last round</h3>
              {!recentRound ? (
                <p className="text-xs text-amber-800/90">No rounds yet.</p>
              ) : (
                <dl className="space-y-1 text-xs text-amber-900">
                  <div className="truncate"><span className="font-medium">Round ID:</span> {recentRound.roundId}</div>
                  <div className="truncate"><span className="font-medium">Commit:</span> {recentRound.commitHex.slice(0, 12)}...</div>
                  <div className="truncate"><span className="font-medium">Nonce:</span> {recentRound.nonce.slice(0, 12)}...</div>
                  <div className="truncate"><span className="font-medium">Server seed:</span> {recentRound.serverSeed?.slice(0, 10)}...</div>
                  <div className="truncate"><span className="font-medium">Peg map:</span> {recentRound.pegMapHash.slice(0, 10)}...</div>
                  <div><span className="font-medium">Drop col:</span> {recentRound.dropColumn}</div>
                  <div><span className="font-medium">Bin:</span> {recentRound.binIndex}</div>
                  <div><span className="font-medium">Bet:</span> {toMoney(recentRound.betCents)}</div>
                  <div><span className="font-medium">Multiplier:</span> {recentRound.payoutMultiplier}x</div>
                  <div className="pt-2 font-semibold text-orange-600 text-sm">
                    Return: {toMoney(Math.round(recentRound.betCents * recentRound.payoutMultiplier))}
                  </div>
                </dl>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
