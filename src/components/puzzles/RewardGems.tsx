"use client";

import { useMemo } from "react";
import type { Vec3 } from "@/types/level";
import Collectibles from "@/components/interactions/Collectibles";

/** Gems that pop out of a solved puzzle. Ids are stable so a gem can only be collected once. */
export default function RewardGems({ puzzleId, positions }: { puzzleId: string; positions: Vec3[] }) {
  const items = useMemo(() => positions.map((pos, i) => ({ id: `g:${puzzleId}:${i}`, pos })), [puzzleId, positions]);
  return <Collectibles kind="gem" items={items} pop />;
}
