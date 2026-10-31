import type { LevelDef, Vec3 } from "@/types/level";
import { above, block, line, rng, slab } from "./helpers";

const FLOOR = "#6a5a8e";
const FLOOR2 = "#7b69a6";
const ROCK = "#4a3d6b";

const crystalColors = ["#4fb8ff", "#b46bff", "#44f0c8", "#ff7ad9"];

function wallCrystals() {
  const r = rng(77);
  const out: { pos: Vec3; color: string; scale: number }[] = [];
  for (let i = 0; i < 46; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 20 - (i / 46) * 140 + r() * 3;
    const topY = z < -100 ? 3 : z < -80 ? 3 : z < -45 ? 1 : z < -12 ? 1 : 0;
    out.push({ pos: [side * (9.6 - r() * 0.6), topY + 0.6 + r() * 3, z], color: crystalColors[i % 4], scale: 0.7 + r() * 0.9 });
  }
  return out;
}

export const cave: LevelDef = {
  id: 2,
  name: "HCF Crystal Cave",
  tagline: "Share crystals into equal groups.",
  intro: [
    "Deep inside the cave, ancient machines guard the way. They only wake when crystals are shared into EQUAL groups with none left over.",
    "The biggest group size that works for both piles is called the HCF - the Highest Common Factor. Find it at each machine!",
  ],
  scenery: "cave",
  theme: {
    sky: "#150f2e", skyBottom: "#2a1f55", fog: "#2c2160", fogNear: 24, fogFar: 120,
    ambient: 1.05, sun: 0.8, sunColor: "#d9ccff", sunDir: [0.3, 1, 0.4],
  },
  spawn: [0, above(0), 14],
  fallY: -14,
  hazardPlane: { y: -8, color: "#1a1040" },
  boxes: [
    slab(0, 0, 12, 14, 20, FLOOR),
    slab(-2.5, 0, -2, 4, 4, FLOOR2),
    slab(2.5, 0.5, -8.5, 4, 4, FLOOR2),
    // chamber 1
    slab(0, 1, -22, 18, 18, FLOOR),
    // corridor 1
    slab(0, 1, -37, 6, 12, FLOOR2),
    // chamber 2
    slab(0, 1, -52, 18, 18, FLOOR),
    block(-5, 1, -47, 1.6, 1.6, 1.6, ROCK),
    block(5, 1, -47, 1.6, 1.6, 1.6, ROCK),
    block(-7, 1, -57, 2, 1.5, 2, ROCK), // star pillar
    // stepping stones to chamber 3
    slab(-2, 1.5, -65.5, 4, 4, FLOOR2),
    slab(3, 2, -71, 4, 4, FLOOR2),
    slab(-2, 2.5, -76.5, 4, 4, FLOOR2),
    // chamber 3
    slab(0, 3, -91, 20, 20, FLOOR),
    block(8, 3, -85, 2, 1.5, 2, ROCK), // star pillar
    // reward area
    slab(0, 3, -109, 16, 18, "#8a76bd"),
    // canyon walls
    block(-10.5, -8, -48, 1, 28, 150, ROCK),
    block(10.5, -8, -48, 1, 28, 150, ROCK),
    block(0, -8, 23, 22, 28, 1, ROCK),
    block(0, -8, -119, 22, 28, 1, ROCK),
  ],
  coins: [
    ...line([0, 0.9, 20], [0, 0.9, 6], 5),
    [-2.5, 0.9, -2], [2.5, 1.4, -8.5],
    [-6, 1.9, -18], [6, 1.9, -18], [0, 1.9, -14],
    ...line([0, 1.9, -33], [0, 1.9, -41], 3),
    [-6, 1.9, -50], [6, 1.9, -50], [-2, 2.4, -65.5], [3, 2.9, -71], [-2, 3.4, -76.5],
    [-6, 3.9, -88], [6, 3.9, -95], [-5, 3.9, -105], [5, 3.9, -105],
  ],
  stars: [[-7, 3.6, -57], [8, 5.6, -85], [-6.5, 4.1, -114]],
  checkpoints: [
    { id: "cp0", pos: [0, 0.6, 12] },
    { id: "cp1", pos: [0, 1.6, -16] },
    { id: "cp2", pos: [0, 1.6, -37] },
    { id: "cp3", pos: [0, 1.6, -46] },
    { id: "cp4", pos: [0, 3.6, -84] },
    { id: "cp5", pos: [0, 3.6, -104] },
  ],
  gates: [
    { id: "g1", pos: [0, 4, -31], size: [6, 6, 1], style: "crystal", open: { type: "flag", key: "puzzle:cave-1" }, lockedHint: "Solve the first crystal machine to open this gate." },
    { id: "g2", pos: [0, 4, -61], size: [6, 6, 1], style: "crystal", open: { type: "flag", key: "puzzle:cave-2" }, lockedHint: "The second machine guards this gate." },
    { id: "g3", pos: [0, 6, -100.5], size: [6, 6, 1], style: "crystal", open: { type: "flag", key: "puzzle:cave-3" }, lockedHint: "The ancient machine must be solved to enter the treasure room." },
  ],
  stations: [
    { type: "crystal", puzzleId: "cave-1", pos: [0, 1, -24] },
    { type: "crystal", puzzleId: "cave-2", pos: [0, 1, -54] },
    { type: "crystal", puzzleId: "cave-3", pos: [0, 3, -93] },
  ],
  decor: {
    rocks: [
      [-8.4, 0, 8], [8.4, 0, 14], [-8.2, 1, -20], [8.4, 1, -28], [-8, 1, -54], [8.3, 1, -60], [-9, 3, -96], [9, 3, -104],
    ],
    crystals: wallCrystals(),
  },
  goal: { pos: [0, 3, -112], label: "Enter the LCM Magic Garden portal" },
  objectives: [
    { text: "Solve Crystal Machine I (E)", done: { type: "flag", key: "puzzle:cave-1" } },
    { text: "Solve Crystal Machine II", done: { type: "flag", key: "puzzle:cave-2" } },
    { text: "Solve the ancient Crystal Machine III", done: { type: "flag", key: "puzzle:cave-3" } },
    { text: "Step into the Magic Garden portal", done: { type: "flag", key: "goal" } },
  ],
};
