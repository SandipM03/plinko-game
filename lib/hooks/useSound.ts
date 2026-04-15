"use client";

import { useState, useEffect } from "react";
import { soundManager } from "../sound";

export function useSound() {
  const [isMuted, setIsMuted] = useState(true); 
  useEffect(() => {
    const saved = localStorage.getItem("plinko_muted");
    if (saved === "false") {
      setIsMuted(false);
      if (soundManager) soundManager.muted = false;
    } else {
      setIsMuted(true);
      if (soundManager) soundManager.muted = true;
    }
  }, []);

  const toggleMute = () => {
    if (!soundManager) return;
    const newMuted = soundManager.toggleMute();
    setIsMuted(newMuted);
    localStorage.setItem("plinko_muted", newMuted.toString());
  };

  return { isMuted, toggleMute };
}
