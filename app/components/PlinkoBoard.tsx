"use client";

import { useEffect, useRef, useState } from "react";
import { RoundResult } from "@/lib/engine/types";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { soundManager } from "@/lib/sound";

type Props = {
  roundResult: Partial<RoundResult> | null;
  dropColumn: number;
  onAnimationComplete: () => void;
};

const ROWS = 12;
const BASE_BOARD_WIDTH = 600;
const PADDING_TOP = 40;
const PEG_SPACING_Y = 35;
const PEG_SPACING_X = 40;
const PEG_RADIUS = 3;
const BALL_RADIUS = 7;
const BIN_HEIGHT = 40;

export function PlinkoBoard({ roundResult, dropColumn, onAnimationComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const cleanupTimersRef = useRef<number[]>([]);
  const activePegsRef = useRef<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();
  const [boardWidth, setBoardWidth] = useState(BASE_BOARD_WIDTH);

  useEffect(() => {
    const updateWidth = () => {
      const containerWidth = containerRef.current?.clientWidth ?? BASE_BOARD_WIDTH;
      setBoardWidth(Math.max(320, Math.min(containerWidth, BASE_BOARD_WIDTH)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    cleanupTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    cleanupTimersRef.current = [];
    activePegsRef.current = new Set();

    const scale = boardWidth / BASE_BOARD_WIDTH;
    const boardHeight = (PADDING_TOP + ROWS * PEG_SPACING_Y + BIN_HEIGHT + 24) * scale;
    const pegSpacingX = PEG_SPACING_X * scale;
    const pegSpacingY = PEG_SPACING_Y * scale;
    const pegRadius = Math.max(2, PEG_RADIUS * scale);
    const ballRadius = Math.max(4, BALL_RADIUS * scale);
    const binHeight = BIN_HEIGHT * scale;
    const paddingTop = PADDING_TOP * scale;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = boardWidth * dpr;
    canvas.height = boardHeight * dpr;
    canvas.style.width = `${boardWidth}px`;
    canvas.style.height = `${boardHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const drawBoard = (ballX?: number, ballY?: number) => {
      ctx.clearRect(0, 0, boardWidth, boardHeight);

      const background = ctx.createLinearGradient(0, 0, 0, boardHeight);
      background.addColorStop(0, "#0f172a");
      background.addColorStop(1, "#0a1020");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, boardWidth, boardHeight);

      const halo = ctx.createRadialGradient(boardWidth / 2, paddingTop + 40 * scale, 10, boardWidth / 2, paddingTop + 40 * scale, boardWidth * 0.8);
      halo.addColorStop(0, "rgba(34,182,164,0.18)");
      halo.addColorStop(1, "rgba(10,16,32,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, boardWidth, boardHeight);

      for (let r = 0; r < ROWS; r++) {
        const rowWidth = r * pegSpacingX;
        const startX = (boardWidth - rowWidth) / 2;
        const startY = paddingTop + r * pegSpacingY;

        for (let p = 0; p <= r; p++) {
          const x = startX + p * pegSpacingX;
          const y = startY;
          const pegId = `${r}-${p}`;
          const isActive = activePegsRef.current.has(pegId);

          ctx.beginPath();
          ctx.arc(x, y, isActive ? pegRadius * 1.5 : pegRadius, 0, Math.PI * 2);

          if (isActive) {
            ctx.fillStyle = "#ff8b3d";
            ctx.shadowColor = "#ff8b3d";
            ctx.shadowBlur = 16 * scale;
          } else {
            ctx.fillStyle = "#dce8ff";
            ctx.shadowColor = "#8fa4ff";
            ctx.shadowBlur = 8 * scale;
          }

          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      const binsRowWidth = ROWS * pegSpacingX;
      const binsStartX = (boardWidth - binsRowWidth) / 2;
      const binsY = paddingTop + ROWS * pegSpacingY;

      const laneGlow = ctx.createLinearGradient(0, binsY - 12 * scale, 0, binsY + binHeight);
      laneGlow.addColorStop(0, "rgba(255,255,255,0)");
      laneGlow.addColorStop(1, "rgba(34,182,164,0.12)");
      ctx.fillStyle = laneGlow;
      ctx.fillRect(0, binsY - 12 * scale, boardWidth, binHeight + 12 * scale);

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = Math.max(1, 2 * scale);

      for (let b = 0; b <= ROWS; b++) {
        const x = binsStartX + b * pegSpacingX;

        ctx.beginPath();
        ctx.moveTo(x - Math.max(2, pegSpacingX / 2), binsY);
        ctx.lineTo(x - Math.max(2, pegSpacingX / 2), binsY + binHeight);
        ctx.stroke();
      }

      if (ballX !== undefined && ballY !== undefined) {
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        const ballGlow = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, ballRadius * 2.2);
        ballGlow.addColorStop(0, "#ffffff");
        ballGlow.addColorStop(1, "rgba(255,255,255,0.1)");
        ctx.fillStyle = ballGlow;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 18 * scale;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    drawBoard();

    if (roundResult && roundResult.path && roundResult.path.length > 0) {
      if (prefersReducedMotion) {
        if (roundResult.payoutMultiplier && soundManager) {
          soundManager.playWin(roundResult.payoutMultiplier);
        }
        onAnimationComplete();
        return;
      }

      const path = roundResult.path;
      const initialDropStartX = (boardWidth - ROWS * pegSpacingX) / 2;
      const startX = initialDropStartX + dropColumn * pegSpacingX;
      const startY = 0;

      let step = 0;
      let lastTime = performance.now();

      const animateBall = (time: number) => {
        const currentPathDecisionIndex = Math.floor(step);
        const progressInStep = step - currentPathDecisionIndex;

        if (currentPathDecisionIndex >= path.length) {
          const finalX = initialDropStartX + (roundResult.binIndex || 0) * pegSpacingX;
          const finalY = paddingTop + ROWS * pegSpacingY + binHeight;
          drawBoard(finalX, finalY);

          if (roundResult.payoutMultiplier && soundManager) {
            soundManager.playWin(roundResult.payoutMultiplier);
          }

          onAnimationComplete();
          return;
        }

        const waypoints: { x: number; y: number }[] = [{ x: startX, y: startY }];

        for (let i = 0; i < path.length; i++) {
          const dec = path[i];
          if (!dec) {
            continue;
          }
          const rowWidth = dec.row * pegSpacingX;
          const rowStartX = (boardWidth - rowWidth) / 2;
          const pegX = rowStartX + dec.pegIndex * pegSpacingX;
          const pegY = paddingTop + dec.row * pegSpacingY;
          waypoints.push({ x: pegX, y: pegY });
        }

        const finalX = (boardWidth - ROWS * pegSpacingX) / 2 + (roundResult.binIndex || 0) * pegSpacingX;
        const finalY = paddingTop + ROWS * pegSpacingY + binHeight;
        waypoints.push({ x: finalX, y: finalY });

        const p1 = waypoints[currentPathDecisionIndex];
        const p2 = waypoints[currentPathDecisionIndex + 1];
        if (!p1 || !p2) {
          return;
        }
        const bounceHeight = 10 * scale;
        const bounceOffset = 4 * bounceHeight * progressInStep * (1 - progressInStep);
        const curX = p1.x + (p2.x - p1.x) * progressInStep;
        const curY = p1.y + (p2.y - p1.y) * progressInStep - bounceOffset;

        drawBoard(curX, curY);

        if (progressInStep > 0.95 && currentPathDecisionIndex < path.length) {
          const dec = path[currentPathDecisionIndex];
          if (!dec) {
            return;
          }
          activePegsRef.current.add(`${dec.row}-${dec.pegIndex}`);
          if (soundManager) {
            soundManager.playTick();
          }

          const timerId = window.setTimeout(() => {
            activePegsRef.current.delete(`${dec.row}-${dec.pegIndex}`);
          }, 150);
          cleanupTimersRef.current.push(timerId);
        }

        const delta = time - lastTime;
        lastTime = time;
        const speed = 0.003;
        step += delta * speed;

        animationRef.current = requestAnimationFrame(animateBall);
      };

      animationRef.current = requestAnimationFrame(animateBall);
    } else {
      const initialDropStartX = (boardWidth - ROWS * pegSpacingX) / 2;
      const startX = initialDropStartX + dropColumn * pegSpacingX;
      drawBoard(startX, 10 * scale);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      cleanupTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      cleanupTimersRef.current = [];
      activePegsRef.current = new Set();
    };
  }, [roundResult, dropColumn, prefersReducedMotion, boardWidth, onAnimationComplete]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-[1.4rem] bg-[#08101f] px-1 py-2 select-none touch-none sm:px-3">
      <div className="pointer-events-none absolute inset-0 rounded-[1.4rem] border border-white/5" />
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="max-w-full drop-shadow-[0_30px_70px_rgba(0,0,0,0.45)]" />
      </div>
    </div>
  );
}
