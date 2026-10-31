import type { LevelDef } from "@/types/level";
import { above, block, deco, line, scatter, slab } from "./helpers";

const WOOD = "#b07a42";
const GRASS = "#78cf58";
const STONE = "#c9c2b4";

export const kingdom: LevelDef = {
  id: 1,
  name: "The Enchanted Kingdom",
  tagline: "Learn to move, jump and explore.",
  intro: [
    "Welcome, explorer! The Lost Kingdom's magic has faded and only numbers can bring it back.",
    "Use W A S D to run and Space to jump. Press E to use things. Collect coins, and head north to the HCF Crystal Cave!",
  ],
  scenery: "kingdom",
  theme: {
    sky: "#5ab4f2", skyBottom: "#e4f6ff", fog: "#d4efff", fogNear: 45, fogFar: 140,
    ambient: 0.85, sun: 1.15, sunColor: "#fff3d6", sunDir: [0.5, 1, 0.35],
  },
  spawn: [0, above(0), 18],
  fallY: -9,
  hazardPlane: { y: -3, color: "#3d9be0" },
  boxes: [
    // courtyard
    slab(0, 0, 8, 30, 36, GRASS),
    block(0, 0, 10, 30, 1, 1, "#3f9b45"), // hedge to jump over
    block(-15.5, 0, 8, 1, 3, 36, STONE), // west fence
    block(15.5, 0, 8, 1, 3, 36, STONE), // east fence
    block(0, 0, 26.5, 32, 7, 1, STONE), // south wall (tall so the camera never peeks over it)
    block(-8.5, 0, -9.5, 13, 5, 1, STONE), // north wall left
    block(8.5, 0, -9.5, 13, 5, 1, STONE), // north wall right
    block(-8, 0, 15, 1.6, 1, 1.6, WOOD), // crates
    block(-6.4, 0, 15, 1.6, 2, 1.6, WOOD),
    block(8, 0, -4, 1.8, 1, 1.8, WOOD), // crate stairs to the star
    block(10, 0, -4, 1.8, 1.7, 1.8, WOOD),
    deco(0, 0.03, 7.5, 4, 0.06, 33, "#e0cfa5"), // cobble path
    // path, bridge, landing
    slab(0, 0, -16, 8, 13, GRASS),
    deco(0, 0.03, -16, 3, 0.06, 13, "#e0cfa5"),
    slab(0, 0, -28.5, 4, 12, WOOD, 0.6),
    deco(-2.1, 0.5, -28.5, 0.25, 1, 12, "#8d5d2e"),
    deco(2.1, 0.5, -28.5, 0.25, 1, 12, "#8d5d2e"),
    slab(0, 0, -38, 10, 8, GRASS),
    // stepping stones up to the hill
    slab(-3, 0.5, -46.5, 4, 4, "#d8c9a5"),
    slab(3, 1.0, -51.5, 4, 4, "#d8c9a5"),
    slab(-2, 1.5, -56.5, 4, 4, "#d8c9a5"),
    slab(2, 2.0, -61.5, 4, 4, "#d8c9a5"),
    slab(8.5, 2.5, -61.5, 3, 3, "#f0c96b"),
    // hill with the crystal gate
    slab(0, 2, -73, 20, 14, GRASS),
    block(-6.5, 2, -76, 7, 5, 1, STONE),
    block(6.5, 2, -76, 7, 5, 1, STONE),
    block(-10.5, 2, -73, 1, 2.5, 14, STONE),
    block(10.5, 2, -73, 1, 2.5, 14, STONE),
  ],
  coins: [
    [0, 0.9, 16], [-3, 0.9, 13.5], [3, 0.9, 13.5], [0, 2.4, 10], [0, 0.9, 6],
    [-5, 0.9, 2], [5, 0.9, 2], [0, 0.9, -4], [0, 0.9, -14], [0, 0.9, -19],
    [-1, 0.9, -26], [1, 0.9, -31], [0, 0.9, -38], ...line([-3, 1.5, -46.5], [2, 3, -61.5], 4).slice(0, 4),
    [-5, 2.9, -70], [5, 2.9, -70], [0, 2.9, -73],
  ],
  stars: [[10, 3.2, -4], [-13, 1.2, 23], [8.5, 3.6, -61.5]],
  checkpoints: [
    { id: "cp0", pos: [0, 0.6, 4] },
    { id: "cp1", pos: [0, 0.6, -14] },
    { id: "cp2", pos: [0, 0.6, -38] },
    { id: "cp3", pos: [0, 2.6, -68] },
  ],
  levers: [{ id: "gate", pos: [-8, 0, -5], label: "Pull the lever" }],
  gates: [
    {
      id: "courtyard", pos: [0, 2.5, -9.5], size: [4, 5, 1], style: "portcullis",
      open: { type: "flag", key: "lever:gate" }, lockedHint: "The gate is shut. Find the lever in the courtyard!",
    },
    {
      id: "crystal", pos: [0, 4.5, -76], size: [6, 5, 1], style: "crystal",
      open: { type: "coins", count: 8 }, lockedHint: "The Crystal Gate wakes when you hold 8 coins.",
    },
  ],
  stations: [],
  decor: {
    trees: [
      ...scatter(11, 26, { x: [-34, 34], z: [-30, 42] }, [{ x: [-17, 17], z: [-36, 28] }]),
      ...scatter(12, 12, { x: [-16, 16], z: [-70, -40] }, [{ x: [-8, 8], z: [-80, -36] }]),
    ],
    rocks: scatter(13, 16, { x: [-26, 26], z: [-70, 34] }, [{ x: [-16, 16], z: [-42, 28] }, { x: [-6, 6], z: [-80, -40] }]),
    grass: [
      { center: [0, 0, 8], radius: 15, count: 100 },
      { center: [0, 2, -73], radius: 8, count: 40 },
    ],
    flowers: [
      { center: [-10, 0, 14], radius: 4, count: 24 },
      { center: [11, 0, 6], radius: 4, count: 24 },
      { center: [0, 2, -70], radius: 8, count: 24 },
    ],
  },
  goal: { pos: [0, 2, -79], label: "Enter the HCF Crystal Cave" },
  objectives: [
    { text: "Jump over the hedge with Space", done: { type: "flag", key: "reach:cp0" } },
    { text: "Pull the lever to open the courtyard gate (E)", done: { type: "flag", key: "lever:gate" } },
    { text: "Cross the bridge and the stepping stones", done: { type: "flag", key: "reach:cp2" } },
    { text: "Collect 8 coins to open the Crystal Gate", done: { type: "coins", count: 8 } },
    { text: "Step into the Crystal Cave portal", done: { type: "flag", key: "goal" } },
  ],
};
