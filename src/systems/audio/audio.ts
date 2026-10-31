/**
 * Procedural audio: every sound is synthesised locally with the Web Audio API,
 * so there are no audio files to download or license. The AudioContext is created
 * lazily from a user gesture (browser autoplay rules).
 */

export type Sfx =
  | "coin" | "gem" | "star" | "jump" | "land" | "interact" | "gate"
  | "solve" | "checkpoint" | "complete" | "wrong" | "step" | "click";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let musicStep = 0;
let settings = { sfx: 0.7, music: 0.35, muted: false };

export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      sfxGain = ctx.createGain();
      musicGain = ctx.createGain();
      sfxGain.connect(master);
      musicGain.connect(master);
      master.connect(ctx.destination);
      applySettings();
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function configureAudio(next: { sfx: number; music: number; muted: boolean }): void {
  settings = next;
  applySettings();
}

function applySettings(): void {
  if (!master || !sfxGain || !musicGain) return;
  master.gain.value = settings.muted ? 0 : 1;
  sfxGain.gain.value = settings.sfx;
  musicGain.gain.value = settings.music * 0.5;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, out: AudioNode | null = sfxGain): void {
  if (!ctx || !out) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const lastPlayed: Partial<Record<Sfx, number>> = {};

export function playSfx(name: Sfx): void {
  if (!ctx || settings.muted) return;
  const now = ctx.currentTime;
  if ((lastPlayed[name] ?? -1) > now - 0.05) return;
  lastPlayed[name] = now;
  switch (name) {
    case "coin": tone(988, 0, 0.09, "square", 0.18); tone(1319, 0.07, 0.16, "square", 0.18); break;
    case "gem": tone(784, 0, 0.1, "triangle", 0.3); tone(1175, 0.08, 0.1, "triangle", 0.3); tone(1568, 0.16, 0.22, "triangle", 0.3); break;
    case "star": [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.2, "triangle", 0.3)); break;
    case "jump": tone(280, 0, 0.16, "square", 0.12, 560); break;
    case "land": tone(130, 0, 0.1, "sine", 0.3, 70); break;
    case "interact": tone(520, 0, 0.08, "triangle", 0.25); tone(780, 0.06, 0.1, "triangle", 0.25); break;
    case "step": tone(660, 0, 0.07, "sine", 0.18); break;
    case "click": tone(440, 0, 0.05, "square", 0.1); break;
    case "gate": tone(110, 0, 0.7, "sawtooth", 0.18, 55); tone(220, 0.1, 0.5, "square", 0.08, 110); break;
    case "solve": [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.35, "triangle", 0.28)); break;
    case "checkpoint": tone(660, 0, 0.12, "triangle", 0.28); tone(880, 0.1, 0.12, "triangle", 0.28); tone(1100, 0.2, 0.25, "triangle", 0.28); break;
    case "complete": [523, 587, 659, 784, 880, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.4, "triangle", 0.3)); break;
    case "wrong": tone(300, 0, 0.18, "sawtooth", 0.1, 200); break;
  }
}

/** Gentle looping arpeggio. Cheap, silent when muted. */
const SCALE = [0, 4, 7, 12, 7, 4, 9, 5, 9, 14, 9, 5];
export function startMusic(): void {
  if (!ctx || musicTimer !== null) return;
  musicTimer = window.setInterval(() => {
    if (!ctx || settings.muted || settings.music <= 0.001 || document.hidden) return;
    const root = 196; // G3
    const semi = SCALE[musicStep % SCALE.length];
    tone(root * Math.pow(2, semi / 12), 0, 0.55, "sine", 0.35, undefined, musicGain);
    if (musicStep % 6 === 0) tone(root / 2, 0, 1.4, "triangle", 0.3, undefined, musicGain);
    musicStep++;
  }, 420);
}

export function stopMusic(): void {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}
