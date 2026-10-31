import type { LevelDef } from "@/types/level";
import { above, block, line, slab } from "./helpers";

const SAND = "#d6c3a3";
const SAND2 = "#c3ab87";
const DARK = "#b08d6c";

export const temple: LevelDef = {
  id: 4,
  name: "The Final Math Temple",
  tagline: "Use HCF and LCM together.",
  intro: [
    "The Temple holds the last piece of the kingdom's magic. Its crystal lock needs an HCF and its bell lock needs an LCM.",
    "Watch out for moving platforms and spinning bars - hop over them! Solve both locks to open the Final Seal.",
  ],
  scenery: "temple",
  theme: {
    sky: "#3a2d6e", skyBottom: "#ffae85", fog: "#c47a8c", fogNear: 35, fogFar: 120,
    ambient: 0.8, sun: 1.0, sunColor: "#ffd9a8", sunDir: [-0.5, 0.8, 0.6],
  },
  spawn: [0, above(0), 14],
  fallY: -12,
  hazardPlane: { y: -4, color: "#ff5a1f" },
  boxes: [
    slab(0, 0, 12, 16, 20, SAND),
    // hall 1 (HCF)
    slab(0, 0, -16, 14, 12, SAND2),
    block(-7.5, 0, -16, 1, 7, 12, DARK),
    block(7.5, 0, -16, 1, 7, 12, DARK),
    // sweeper corridor
    slab(0, 0, -30, 8, 16, SAND),
    block(-4.5, 0, -30, 1, 2.5, 16, DARK),
    block(4.5, 0, -30, 1, 2.5, 16, DARK),
    // hall 2 (LCM)
    slab(0, 4, -56, 48, 16, SAND2),
    block(-24.5, 4, -56, 1, 7, 16, DARK),
    block(24.5, 4, -56, 1, 7, 16, DARK),
    block(-13.5, 4, -64, 21, 7, 1, DARK),
    block(13.5, 4, -64, 21, 7, 1, DARK),
    block(20, 4, -50, 2, 1.5, 2, DARK), // star pillar
    // final chamber
    slab(0, 4, -73.5, 16, 19, "#e8d9a0"),
    block(-8.5, 4, -73.5, 1, 7, 19, DARK),
    block(8.5, 4, -73.5, 1, 7, 19, DARK),
    block(0, 4, -83.5, 18, 7, 1, DARK),
    // trophy dais
    slab(0, 4.4, -78, 4, 3, "#f0c96b", 0.8),
  ],
  movers: [
    { id: "m1", pos: [-5, -0.4, -1], size: [4, 0.8, 4], travel: [10, 0, 0], period: 6, color: "#e0a96b" },
    { id: "m2", pos: [5, -0.4, -6.5], size: [4, 0.8, 4], travel: [-10, 0, 0], period: 6, color: "#e0a96b" },
    { id: "lift", pos: [0, -0.4, -43], size: [5, 0.8, 5], travel: [0, 4, 0], period: 7, color: "#f0c96b" },
  ],
  sweepers: [
    { id: "s1", pos: [0, 0.55, -27], length: 7, speed: 1.3 },
    { id: "s2", pos: [0, 0.55, -34], length: 7, speed: -1.5 },
  ],
  coins: [
    [0, 0.9, 18], [-3, 0.9, 8], [3, 0.9, 8], [-5, 0.9, -1], [5, 0.9, -6.5],
    [-4, 0.9, -13], [4, 0.9, -19], ...line([0, 1.5, -25], [0, 1.5, -36], 2),
    [0, 3.5, -43], [-10, 4.9, -52], [10, 4.9, -52], [-18, 4.9, -58], [18, 4.9, -58],
    [-4, 4.9, -68], [4, 4.9, -68],
  ],
  stars: [[-6, 1.4, -10], [20, 6.6, -50], [-22, 5.2, -60]],
  checkpoints: [
    { id: "cp0", pos: [0, 0.6, 12] },
    { id: "cp1", pos: [0, 0.6, -13] },
    { id: "cp2", pos: [0, 0.6, -24] },
    { id: "cp3", pos: [0, 0.6, -38] },
    { id: "cp4", pos: [0, 4.6, -50] },
    { id: "cp5", pos: [0, 4.6, -68] },
  ],
  gates: [
    { id: "a", pos: [0, 3.5, -22], size: [6, 7, 1], style: "stone", open: { type: "flag", key: "puzzle:temple-hcf" }, lockedHint: "The crystal lock must be solved first." },
    {
      id: "seal", pos: [0, 7.5, -64], size: [6, 7, 1], style: "stone",
      open: { type: "all", of: [{ type: "flag", key: "puzzle:temple-hcf" }, { type: "flag", key: "puzzle:temple-lcm" }] },
      lockedHint: "The Final Seal needs BOTH the crystal lock (HCF) and the bell lock (LCM).",
    },
  ],
  stations: [
    { type: "crystal", puzzleId: "temple-hcf", pos: [0, 0, -18] },
    { type: "lane", puzzleId: "temple-lcm", pos: [0, 4, -55], spacing: 1.1, fountainZ: -4.5 },
  ],
  decor: {
    pillars: [[-6, 0, 20], [6, 0, 20], [-6, 0, 4], [6, 0, 4]],
    torches: [[-7, 3, -12], [7, 3, -12], [-7, 3, -20], [7, 3, -20], [-4, 3, -30], [4, 3, -30], [-23, 7, -50], [23, 7, -50], [-7.5, 7, -70], [7.5, 7, -70]],
    rocks: [[-12, 0, 14], [12, 0, 10], [-12, 0, 4]],
  },
  goal: { pos: [0, 4.4, -80], label: "Claim the Lost Kingdom's treasure" },
  objectives: [
    { text: "Solve the crystal lock (HCF)", done: { type: "flag", key: "puzzle:temple-hcf" } },
    { text: "Hop past the spinning bars", done: { type: "flag", key: "reach:cp3" } },
    { text: "Solve the bell lock (LCM)", done: { type: "flag", key: "puzzle:temple-lcm" } },
    { text: "Open the Final Seal and claim the treasure", done: { type: "flag", key: "goal" } },
  ],
};
