import { createStore, useStore } from "@/systems/store";
import { LEVELS, flagKey, isMet } from "@/data/levels";
import { puzzlesForClass } from "@/data/puzzles";
import { evaluateAttempt } from "@/systems/puzzles/validate";
import { clearProgress, defaultProgress, loadProgress, loadSettings, saveProgress, saveSettings, type Progress, type Quality, type Settings } from "@/systems/save/progress";
import { configureAudio, playSfx } from "@/systems/audio/audio";
import { clearInput } from "@/systems/input/input";
import { resetRuntime, rt } from "@/systems/runtime/runtime";
import type { AttemptStatus, PuzzleDef } from "@/types/puzzle";
import type { CollectibleKind, WorldId } from "@/types/level";

export type Screen = "menu" | "worlds" | "learn" | "playing" | "worldComplete" | "victory";
export type Overlay = "none" | "pause" | "settings" | "controls" | "confirm-new" | "confirm-reset" | "confirm-restart";

export interface Feedback {
  id: number;
  text: string;
  status: AttemptStatus | "info";
  hint?: string;
}

export interface GameState {
  ready: boolean;
  screen: Screen;
  overlay: Overlay;
  /** Where Settings/Controls should return to. */
  overlayReturn: "menu" | "pause";
  /** Overlay to return to when a nested one (controls, confirm) is closed. */
  overlayBack: Overlay;
  progress: Progress;
  settings: Settings;
  worldId: WorldId;
  /** Increments to force a fresh world mount (restart / enter world). */
  sessionKey: number;
  loading: boolean;
  prompt: string | null;
  toast: { id: number; text: string } | null;
  feedback: Feedback | null;
  /** Crystal machine panel. */
  puzzle: { id: string; value: number } | null;
  /** Explanation card after solving. */
  result: { id: string; justSolved: boolean } | null;
  /** World introduction dialogue, one line at a time. */
  intro: { lines: string[]; index: number } | null;
  attempts: Record<string, number>;
  webglOk: boolean;
}

const initial: GameState = {
  ready: false,
  screen: "menu",
  overlay: "none",
  overlayReturn: "menu",
  overlayBack: "none",
  progress: defaultProgress(),
  settings: { ...loadDefaultsSafe() },
  worldId: 1,
  sessionKey: 0,
  loading: false,
  prompt: null,
  toast: null,
  feedback: null,
  puzzle: null,
  result: null,
  intro: null,
  attempts: {},
  webglOk: true,
};

function loadDefaultsSafe(): Settings {
  return { quality: "medium", sfxVolume: 0.7, musicVolume: 0.35, muted: false, showFps: false, classLevel: 6, qualityChosen: false };
}

export const gameStore = createStore<GameState>(initial);
export const useGame = <S,>(selector: (s: GameState) => S): S => useStore(gameStore, selector);

let msgId = 1;
const s = () => gameStore.get();

// ---------- derived helpers ----------
export function getPuzzle(id: string): PuzzleDef {
  const p = puzzlesForClass(s().settings.classLevel).get(id);
  if (!p) throw new Error(`Unknown puzzle ${id}`);
  return p;
}

export function countCollected(progress: Progress, world: number, kind: CollectibleKind): number {
  const prefix = kind === "coin" ? "c" : kind === "star" ? "s" : "g";
  return (progress.collected[String(world)] ?? []).filter((id) => id.startsWith(prefix)).length;
}

export function isCollected(id: string): boolean {
  return (s().progress.collected[String(s().worldId)] ?? []).includes(id);
}

export function hasFlag(key: string): boolean {
  return s().progress.flags[flagKey(s().worldId, key)] === true;
}

export function requirementMet(req: Parameters<typeof isMet>[0]): boolean {
  const { progress, worldId } = s();
  return isMet(req, worldId, progress.flags, countCollected(progress, worldId, "coin"));
}

export function objectiveProgress(): { index: number; total: number; text: string } {
  const level = LEVELS[s().worldId];
  const done = level.objectives.map((o) => requirementMet(o.done));
  const index = done.findIndex((d) => !d);
  return index === -1
    ? { index: done.length, total: done.length, text: "Explore, collect and enjoy!" }
    : { index, total: done.length, text: level.objectives[index].text };
}

function persist(progress: Progress): void {
  saveProgress(progress);
  gameStore.set({ progress });
}

function syncRuntimeLock(): void {
  const st = s();
  rt.locked = st.overlay !== "none" || st.puzzle !== null || st.result !== null || st.intro !== null || st.screen !== "playing" || st.loading;
  if (rt.locked) clearInput();
}
gameStore.subscribe(syncRuntimeLock);

// ---------- actions ----------
export const actions = {
  hydrate(): void {
    const progress = loadProgress();
    let settings = loadSettings();
    if (!settings.qualityChosen) settings = { ...settings, quality: detectQuality(), qualityChosen: true };
    saveSettings(settings);
    gameStore.set({ progress, settings, ready: true });
    applyAudio(settings);
  },

  setWebgl(ok: boolean): void {
    gameStore.set({ webglOk: ok });
  },

  updateSettings(patch: Partial<Settings>): void {
    const settings = { ...s().settings, ...patch };
    saveSettings(settings);
    gameStore.set({ settings });
    applyAudio(settings);
  },

  setQuality(q: Quality): void {
    actions.updateSettings({ quality: q, qualityChosen: true });
  },

  showScreen(screen: Screen): void {
    gameStore.set({ screen, overlay: "none", puzzle: null, result: null, intro: null, prompt: null });
  },

  openOverlay(overlay: Overlay, from: "menu" | "pause" = "menu", back: Overlay = "none"): void {
    gameStore.set({ overlay, overlayReturn: from, overlayBack: back });
  },

  closeOverlay(): void {
    const st = s();
    if (st.overlayBack !== "none") {
      gameStore.set({ overlay: st.overlayBack, overlayBack: "none" });
      return;
    }
    const nested = st.overlay === "settings" || st.overlay === "controls" || st.overlay === "confirm-restart" || st.overlay === "confirm-reset";
    if (st.screen === "playing" && nested && st.overlayReturn === "pause") {
      gameStore.set({ overlay: "pause" });
    } else {
      gameStore.set({ overlay: "none" });
    }
  },

  /** Start a fresh adventure (progress wiped, settings kept). */
  newGame(): void {
    clearProgress();
    const progress = { ...defaultProgress(), started: true };
    persist(progress);
    actions.enterWorld(1);
  },

  continueGame(): void {
    const { progress } = s();
    actions.enterWorld(Math.min(progress.currentWorld, progress.unlockedWorld) as WorldId);
  },

  resetProgress(): void {
    clearProgress();
    gameStore.set({ progress: defaultProgress(), overlay: "none", overlayBack: "none", attempts: {} });
  },

  enterWorld(id: WorldId, showIntro = true): void {
    const st = s();
    const level = LEVELS[id];
    const progress = { ...st.progress, currentWorld: id, started: true };
    saveProgress(progress);
    const cpId = progress.checkpoints[String(id)];
    const cp = level.checkpoints.find((c) => c.id === cpId);
    const spawn = cp ? ([cp.pos[0], cp.pos[1] + 0.6, cp.pos[2]] as [number, number, number]) : level.spawn;
    resetRuntime(spawn);
    const firstVisit = showIntro && !cpId && countCollected(progress, id, "coin") === 0;
    gameStore.set({
      progress,
      worldId: id,
      screen: "playing",
      overlay: "none",
      loading: true,
      sessionKey: st.sessionKey + 1,
      puzzle: null,
      result: null,
      feedback: null,
      prompt: null,
      toast: null,
      intro: firstVisit ? { lines: level.intro, index: 0 } : null,
    });
  },

  finishLoading(): void {
    gameStore.set({ loading: false });
  },

  advanceIntro(): void {
    const { intro, progress } = s();
    if (!intro) return;
    playSfx("click");
    if (intro.index + 1 < intro.lines.length) gameStore.set({ intro: { ...intro, index: intro.index + 1 } });
    else {
      gameStore.set({ intro: null });
      if (!progress.seenTutorial) persist({ ...progress, seenTutorial: true });
    }
  },

  restartLevel(): void {
    const st = s();
    const id = st.worldId;
    const prefix = `${id}:`;
    const flags: Record<string, true> = {};
    for (const k of Object.keys(st.progress.flags)) if (!k.startsWith(prefix)) flags[k] = true;
    const collected = { ...st.progress.collected };
    delete collected[String(id)];
    const checkpoints = { ...st.progress.checkpoints };
    delete checkpoints[String(id)];
    persist({ ...st.progress, flags, collected, checkpoints });
    gameStore.set({ attempts: {} });
    actions.enterWorld(id, false);
  },

  /** Quit to the main menu. Progress is already saved continuously. */
  exitToMenu(): void {
    rt.focus = null;
    gameStore.set({ screen: "menu", overlay: "none", puzzle: null, result: null, intro: null, prompt: null, feedback: null });
  },

  togglePause(): void {
    const st = s();
    if (st.screen !== "playing" || st.loading || st.intro) return;
    if (st.overlay === "none") gameStore.set({ overlay: "pause" });
    else if (st.overlay === "pause") gameStore.set({ overlay: "none" });
    else actions.closeOverlay();
  },

  setPrompt(prompt: string | null): void {
    if (s().prompt !== prompt) gameStore.set({ prompt });
  },

  toast(text: string): void {
    const id = msgId++;
    gameStore.set({ toast: { id, text } });
    window.setTimeout(() => {
      if (s().toast?.id === id) gameStore.set({ toast: null });
    }, 3200);
  },

  collect(id: string, kind: CollectibleKind): void {
    const st = s();
    const key = String(st.worldId);
    const list = st.progress.collected[key] ?? [];
    if (list.includes(id)) return;
    persist({ ...st.progress, collected: { ...st.progress.collected, [key]: [...list, id] } });
    playSfx(kind === "coin" ? "coin" : kind === "gem" ? "gem" : "star");
    if (kind === "star") actions.toast("You found a hidden star!");
    afterProgressChange();
  },

  setFlag(key: string): void {
    const st = s();
    const fk = flagKey(st.worldId, key);
    if (st.progress.flags[fk]) return;
    persist({ ...st.progress, flags: { ...st.progress.flags, [fk]: true } });
    afterProgressChange();
  },

  reachCheckpoint(id: string): void {
    const st = s();
    const key = String(st.worldId);
    if (st.progress.checkpoints[key] === id) return;
    const level = LEVELS[st.worldId];
    const cp = level.checkpoints.find((c) => c.id === id);
    if (!cp) return;
    rt.checkpoint.set(cp.pos[0], cp.pos[1] + 0.6, cp.pos[2]);
    const flags = { ...st.progress.flags, [flagKey(st.worldId, `reach:${id}`)]: true as const };
    persist({ ...st.progress, flags, checkpoints: { ...st.progress.checkpoints, [key]: id } });
    playSfx("checkpoint");
    actions.toast("Checkpoint saved!");
    afterProgressChange();
  },

  // ----- puzzles -----
  openCrystalPuzzle(id: string): void {
    const solved = hasFlag(`puzzle:${id}`);
    if (solved) {
      gameStore.set({ result: { id, justSolved: false } });
      return;
    }
    gameStore.set({ puzzle: { id, value: 1 }, feedback: null });
    playSfx("interact");
  },

  closePuzzle(): void {
    rt.focus = null;
    gameStore.set({ puzzle: null });
  },

  setPuzzleValue(value: number): void {
    const p = s().puzzle;
    if (!p) return;
    const def = getPuzzle(p.id);
    const max = Math.max(...def.numbers);
    const v = Math.min(max, Math.max(1, Math.round(value)));
    if (v !== p.value) {
      gameStore.set({ puzzle: { ...p, value: v }, feedback: null });
      playSfx("step");
    }
  },

  /** Judge an attempt. The only way a puzzle becomes solved. */
  attempt(id: string, value: number): AttemptStatus {
    const def = getPuzzle(id);
    if (hasFlag(`puzzle:${id}`)) return "correct";
    const res = evaluateAttempt(def, value);
    if (res.status === "correct") {
      gameStore.set({ puzzle: null, feedback: null });
      rt.focus = null;
      actions.setFlag(`puzzle:${id}`);
      playSfx("solve");
      gameStore.set({ result: { id, justSolved: true } });
      return "correct";
    }
    const attempts = { ...s().attempts, [id]: (s().attempts[id] ?? 0) + 1 };
    const n = attempts[id];
    const hint = n >= 4 ? def.hints[1] : n >= 2 ? def.hints[0] : undefined;
    gameStore.set({ attempts, feedback: { id: msgId++, text: res.message, status: res.status, hint } });
    playSfx("wrong");
    return res.status;
  },

  dismissResult(): void {
    const r = s().result;
    gameStore.set({ result: null });
    if (r?.justSolved) actions.toast("The way forward is opening!");
  },

  clearFeedback(): void {
    gameStore.set({ feedback: null });
  },

  // ----- world completion -----
  completeWorld(): void {
    const st = s();
    const id = st.worldId;
    const completed = st.progress.completedWorlds.includes(id) ? st.progress.completedWorlds : [...st.progress.completedWorlds, id];
    const unlocked = Math.max(st.progress.unlockedWorld, Math.min(4, id + 1));
    const flags = { ...st.progress.flags, [flagKey(id, "goal")]: true as const };
    const nextWorld = Math.min(4, id + 1);
    persist({ ...st.progress, completedWorlds: completed, unlockedWorld: unlocked, flags, currentWorld: id === 4 ? 4 : nextWorld });
    playSfx("complete");
    rt.victory = true;
    // brief victory dance before the card appears
    window.setTimeout(() => {
      if (s().screen === "playing" && s().worldId === id) gameStore.set({ screen: id === 4 ? "victory" : "worldComplete", puzzle: null, result: null });
    }, 1800);
  },
};

function afterProgressChange(): void {
  // objective text lives in derived selectors; touching the store re-evaluates subscribers.
  gameStore.set({});
}

function applyAudio(settings: Settings): void {
  configureAudio({ sfx: settings.sfxVolume, music: settings.musicVolume, muted: settings.muted });
}

/** Choose a sensible default preset: Intel/unknown GPUs start on Low. */
function detectQuality(): Quality {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "low";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).toLowerCase() : "";
    if (/swiftshader|software|llvmpipe/.test(name)) return "low";
    if (/intel/.test(name)) return /iris xe|arc|iris plus|uhd 7|uhd 6[3-9]/.test(name) ? "medium" : "low";
    if (/nvidia|geforce|radeon|amd/.test(name)) return "medium";
    return "low";
  } catch {
    return "low";
  }
}
