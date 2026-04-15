"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

const COLORS = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export function ConfettiEffect({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    const particles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
       const x = canvas.width / 2 + (Math.random() - 0.5) * 100;
       const y = canvas.height * 0.8;
       particles.push({
         x,
         y,
         vx: (Math.random() - 0.5) * 15,
         vy: Math.random() * -15 - 5,
         color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
         size: Math.random() * 8 + 4,
         rotation: Math.random() * 360,
         rotationSpeed: (Math.random() - 0.5) * 10,
         opacity: 1,
       });
    }
    particlesRef.current = particles;

    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 16.66;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeParticles = 0;

      for (const p of particlesRef.current) {
        if (p.opacity <= 0) continue;

        activeParticles++;

        p.vy += 0.3 * dt; 
        p.vx *= 0.99; 
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        
        if (p.vy > 0) {
            p.opacity -= 0.01 * dt;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      if (activeParticles > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [active, prefersReducedMotion]);

  if (!active || prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}
