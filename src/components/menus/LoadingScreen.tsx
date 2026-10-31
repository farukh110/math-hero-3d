"use client";

import { useLoading } from "@/systems/progression/loadingStore";
import { useGame } from "@/systems/progression/gameStore";
import { LEVELS } from "@/data/levels";

export default function LoadingScreen() {
  const { stage, progress } = useLoading((s) => s);
  const worldId = useGame((s) => s.worldId);
  return (
    <div className="loading" role="status" aria-live="polite">
      <h2>{LEVELS[worldId].name}</h2>
      <div className="bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /><span>{stage}</span></div>
      <p style={{ color: "#a9c2e6", margin: 0 }}>{LEVELS[worldId].tagline}</p>
    </div>
  );
}
