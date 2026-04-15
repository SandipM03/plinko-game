"use client";

class SoundManager {
  private audioCtx: AudioContext | null = null;
  public muted: boolean = false;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  public toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  public playTick() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.05);
  }

  public playWin(multiplier: number) {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = "triangle";
    
    // Higher pitch for high multipliers
    const freq = multiplier >= 10 ? 600 : multiplier >= 3 ? 400 : 300;
    
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    if (multiplier >= 10) {
      osc.frequency.setValueAtTime(freq * 1.5, this.audioCtx.currentTime + 0.1);
    }

    gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.5);
  }
}

// Singleton pattern conceptually, exported as instance
export const soundManager = typeof window !== "undefined" ? new SoundManager() : null;
