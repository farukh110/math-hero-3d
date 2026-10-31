import type { ClassLevel } from "@/types/puzzle";
import { readJson, removeKey, writeJson } from "./storage";

const PROGRESS_KEY = "math-adventure-3d.progress.v1";
const SETTINGS_KEY = "math-adventure-3d.settings.v1";

export type Quality = "low" | "medium" | "high";

export interface Progress {
  version: 1;
  /** Highest world the player may enter (1-4). */
  unlockedWorld: number;
  completedWorlds: number[];
  /** World that Continue returns to. */
  currentWorld: number;
  /** Flags such as "2:puzzle:cave-1" or "1:lever:gate". */
  flags: Record<string, true>;
  /** Collected collectible ids per world. */
  collected: Record<string, string[]>;
  /** Last checkpoint per world. */
  checkpoints: Record<string, string>;
  /** True once the player has started at least once. */
  started: boolean;
  seenTutorial: boolean;
}

export interface Settings {
  quality: Quality;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
  showFps: boolean;
  classLevel: ClassLevel;
  /** True once the user (or auto-detect) chose a quality. */
  qualityChosen: boolean;
}

export const defaultProgress = (): Progress => ({
  version: 1,
  unlockedWorld: 1,
  completedWorlds: [],
  currentWorld: 1,
  flags: {},
  collected: {},
  checkpoints: {},
  started: false,
  seenTutorial: false,
});

export const defaultSettings = (): Settings => ({
  quality: "medium",
  sfxVolume: 0.7,
  musicVolume: 0.35,
  muted: false,
  showFps: false,
  classLevel: 6,
  qualityChosen: false,
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const clamp01 = (n: unknown, d: number) => (typeof n === "number" && isFinite(n) ? Math.min(1, Math.max(0, n)) : d);

export function loadProgress(): Progress {
  const raw = readJson(PROGRESS_KEY);
  const base = defaultProgress();
  if (!isObj(raw) || raw.version !== 1) return base;
  const unlocked = Number(raw.unlockedWorld);
  base.unlockedWorld = unlocked >= 1 && unlocked <= 4 ? Math.floor(unlocked) : 1;
  base.currentWorld = Math.min(base.unlockedWorld, Math.max(1, Math.floor(Number(raw.currentWorld)) || 1));
  if (Array.isArray(raw.completedWorlds)) {
    base.completedWorlds = raw.completedWorlds.filter((n): n is number => [1, 2, 3, 4].includes(n as number));
  }
  if (isObj(raw.flags)) {
    for (const [k, v] of Object.entries(raw.flags)) if (v === true) base.flags[k] = true;
  }
  if (isObj(raw.collected)) {
    for (const [k, v] of Object.entries(raw.collected)) {
      if (Array.isArray(v)) base.collected[k] = v.filter((x): x is string => typeof x === "string");
    }
  }
  if (isObj(raw.checkpoints)) {
    for (const [k, v] of Object.entries(raw.checkpoints)) if (typeof v === "string") base.checkpoints[k] = v;
  }
  base.started = raw.started === true;
  base.seenTutorial = raw.seenTutorial === true;
  return base;
}

export function saveProgress(p: Progress): void {
  writeJson(PROGRESS_KEY, p);
}

export function clearProgress(): void {
  removeKey(PROGRESS_KEY);
}

export function loadSettings(): Settings {
  const raw = readJson(SETTINGS_KEY);
  const base = defaultSettings();
  if (!isObj(raw)) return base;
  if (raw.quality === "low" || raw.quality === "medium" || raw.quality === "high") base.quality = raw.quality;
  base.sfxVolume = clamp01(raw.sfxVolume, base.sfxVolume);
  base.musicVolume = clamp01(raw.musicVolume, base.musicVolume);
  base.muted = raw.muted === true;
  base.showFps = raw.showFps === true;
  base.classLevel = raw.classLevel === 7 ? 7 : 6;
  base.qualityChosen = raw.qualityChosen === true;
  return base;
}

export function saveSettings(s: Settings): void {
  writeJson(SETTINGS_KEY, s);
}
