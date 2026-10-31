import type { LevelDef, Requirement, WorldId } from "@/types/level";
import { kingdom } from "./kingdom";
import { cave } from "./cave";
import { garden } from "./garden";
import { temple } from "./temple";

export const LEVELS: Record<WorldId, LevelDef> = { 1: kingdom, 2: cave, 3: garden, 4: temple };
export const WORLD_IDS: WorldId[] = [1, 2, 3, 4];

export function flagKey(world: number, key: string): string {
  return `${world}:${key}`;
}

/** Evaluate a requirement against saved flags and the collected coin count. */
export function isMet(req: Requirement, world: number, flags: Record<string, true>, coins: number): boolean {
  switch (req.type) {
    case "flag":
      return flags[flagKey(world, req.key)] === true;
    case "coins":
      return coins >= req.count;
    case "all":
      return req.of.every((r) => isMet(r, world, flags, coins));
  }
}
