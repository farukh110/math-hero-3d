import type { BoxDef, Vec3 } from "@/types/level";

/** A flat slab whose TOP surface is at topY. */
export function slab(x: number, topY: number, z: number, w: number, d: number, color: string, thick = 1): BoxDef {
  return { pos: [x, topY - thick / 2, z], size: [w, thick, d], color };
}

/** A box standing on a floor at baseY. */
export function block(x: number, baseY: number, z: number, w: number, h: number, d: number, color: string): BoxDef {
  return { pos: [x, baseY + h / 2, z], size: [w, h, d], color };
}

/** Visual-only decoration box (no collider). */
export function deco(x: number, y: number, z: number, w: number, h: number, d: number, color: string, glow = false): BoxDef {
  return { pos: [x, y, z], size: [w, h, d], color, solid: false, glow };
}

/** Player spawn y for a floor whose top is at topY. */
export const above = (topY: number): number => topY + 1.2;

/** Evenly spaced points along a line. */
export function line(from: Vec3, to: Vec3, count: number): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    out.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t]);
  }
  return out;
}

/** Deterministic pseudo-random so decor is the same every run. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Scatter points in a rectangle, skipping a keep-out rectangle (the play area). */
export function scatter(
  seed: number,
  count: number,
  area: { x: [number, number]; z: [number, number]; y?: number },
  keepOut?: { x: [number, number]; z: [number, number] }[],
): Vec3[] {
  const r = rng(seed);
  const out: Vec3[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const x = area.x[0] + r() * (area.x[1] - area.x[0]);
    const z = area.z[0] + r() * (area.z[1] - area.z[0]);
    if (keepOut?.some((k) => x > k.x[0] && x < k.x[1] && z > k.z[0] && z < k.z[1])) continue;
    out.push([x, area.y ?? 0, z]);
  }
  return out;
}
