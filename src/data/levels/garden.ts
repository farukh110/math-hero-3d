import type { LevelDef } from "@/types/level";
import { above, block, deco, line, scatter, slab } from "./helpers";

const GRASS = "#6fd26a";
const PATH = "#f1d9c4";
const HEDGE = "#2f9b52";
const WOOD = "#b07a42";

export const garden: LevelDef = {
  id: 3,
  name: "LCM Magic Garden",
  tagline: "Make magic fountains spray together.",
  intro: [
    "The garden's fountains once danced in time. Now each one sprays at its own pace.",
    "Walk along the numbered stones: stone 5 is step 5. When the fountains spray together for the FIRST time, you have found the LCM - the Lowest Common Multiple!",
  ],
  scenery: "garden",
  theme: {
    sky: "#7cd0ff", skyBottom: "#ffe6f3", fog: "#ffe9f5", fogNear: 50, fogFar: 150,
    ambient: 0.9, sun: 1.05, sunColor: "#fff0cf", sunDir: [-0.4, 1, 0.5],
  },
  spawn: [0, above(0), 14],
  fallY: -9,
  hazardPlane: { y: -3, color: "#7fc4ff" },
  boxes: [
    slab(0, 0, 12, 20, 24, GRASS),
    slab(0, 0, -4, 4, 10, WOOD, 0.6),
    // plaza 1
    slab(0, 0, -22, 34, 26, GRASS),
    deco(0, 0.03, -22, 28, 0.06, 2.2, PATH),
    block(-10, 0, -35, 14, 5, 1, HEDGE),
    block(10, 0, -35, 14, 5, 1, HEDGE),
    slab(0, 0, -41, 6, 12, PATH),
    // plaza 2
    slab(0, 0, -61.5, 48, 29, GRASS),
    deco(0, 0.03, -62, 44, 0.06, 2.2, PATH),
    block(-13.5, 0, -76, 21, 5, 1, HEDGE),
    block(13.5, 0, -76, 21, 5, 1, HEDGE),
    slab(0, 0, -79, 6, 6, PATH),
    // stepping stones
    slab(-2, 0.5, -86.5, 4, 4, PATH),
    slab(3, 1.0, -91.5, 4, 4, PATH),
    slab(-2, 1.5, -96.5, 4, 4, PATH),
    // plaza 3
    slab(0, 2, -114, 56, 26, GRASS),
    deco(0, 2.03, -113, 52, 0.06, 2.2, PATH),
    block(-15.5, 2, -127, 25, 5, 1, HEDGE),
    block(15.5, 2, -127, 25, 5, 1, HEDGE),
    slab(0, 2, -137, 20, 20, "#a0e08a"),
    // low garden walls
    block(-17.5, 0, -22, 1, 1.5, 26, HEDGE),
    block(17.5, 0, -22, 1, 1.5, 26, HEDGE),
  ],
  coins: [
    ...line([0, 0.9, 20], [0, 0.9, 6], 5), [0, 0.9, -3], [0, 0.9, -6],
    [-12, 0.9, -15], [12, 0.9, -15], [-12, 0.9, -30], [12, 0.9, -30], [0, 0.9, -41],
    [-20, 0.9, -52], [20, 0.9, -52], [-20, 0.9, -70], [20, 0.9, -70],
    [-2, 1.4, -86.5], [3, 1.9, -91.5], [-2, 2.4, -96.5],
    [-24, 2.9, -108], [24, 2.9, -108], [-24, 2.9, -122], [24, 2.9, -122], [0, 2.9, -137], [-6, 2.9, -140], [6, 2.9, -140],
  ],
  stars: [[-15, 1.3, -13], [22, 1.3, -50], [26, 3.3, -122]],
  checkpoints: [
    { id: "cp0", pos: [0, 0.6, 12] },
    { id: "cp1", pos: [0, 0.6, -12] },
    { id: "cp2", pos: [0, 0.6, -41] },
    { id: "cp3", pos: [0, 0.6, -52] },
    { id: "cp4", pos: [0, 0.6, -79] },
    { id: "cp5", pos: [0, 2.6, -103] },
    { id: "cp6", pos: [0, 2.6, -132] },
  ],
  gates: [
    { id: "g1", pos: [0, 2.5, -35], size: [6, 5, 1], style: "crystal", open: { type: "flag", key: "puzzle:garden-1" }, lockedHint: "Synchronise the first fountains to open the garden arch." },
    { id: "g2", pos: [0, 2.5, -76], size: [6, 5, 1], style: "crystal", open: { type: "flag", key: "puzzle:garden-2" }, lockedHint: "The second garden arch opens when the blooms line up." },
    { id: "g3", pos: [0, 4.5, -127], size: [6, 5, 1], style: "crystal", open: { type: "flag", key: "puzzle:garden-3" }, lockedHint: "The garden exit needs all three fountains in sync." },
  ],
  stations: [
    { type: "lane", puzzleId: "garden-1", pos: [0, 0, -22], spacing: 1.5, fountainZ: -6 },
    { type: "lane", puzzleId: "garden-2", pos: [0, 0, -62], spacing: 1.5, fountainZ: -6 },
    { type: "lane", puzzleId: "garden-3", pos: [0, 2, -113], spacing: 1.5, fountainZ: -6 },
  ],
  decor: {
    trees: scatter(31, 40, { x: [-45, 45], z: [-150, 30] }, [{ x: [-30, 30], z: [-150, 26] }]),
    rocks: scatter(32, 10, { x: [-40, 40], z: [-130, 20] }, [{ x: [-26, 26], z: [-150, 26] }]),
    grass: [
      { center: [0, 0, 12], radius: 9, count: 60 },
      { center: [0, 0, -50], radius: 20, count: 80 },
      { center: [0, 2, -137], radius: 8, count: 40 },
    ],
    flowers: [
      { center: [0, 0, 14], radius: 9, count: 60 },
      { center: [-10, 0, -28], radius: 5, count: 30 },
      { center: [10, 0, -28], radius: 5, count: 30 },
      { center: [-18, 0, -66], radius: 5, count: 30 },
      { center: [18, 0, -66], radius: 5, count: 30 },
      { center: [-20, 2, -118], radius: 6, count: 30 },
      { center: [20, 2, -118], radius: 6, count: 30 },
      { center: [0, 2, -137], radius: 8, count: 40 },
    ],
    pillars: [[-8, 0, 20], [8, 0, 20], [-14, 0, -12], [14, 0, -12]],
  },
  goal: { pos: [0, 2, -142], label: "Enter the Final Math Temple" },
  objectives: [
    { text: "Walk the stones and sync the twin fountains", done: { type: "flag", key: "puzzle:garden-1" } },
    { text: "Sync the rotating blooms", done: { type: "flag", key: "puzzle:garden-2" } },
    { text: "Sync all three fountains", done: { type: "flag", key: "puzzle:garden-3" } },
    { text: "Step into the Temple portal", done: { type: "flag", key: "goal" } },
  ],
};
