import type { ClassLevel, PuzzleDef } from "@/types/puzzle";

/**
 * All puzzle definitions. Answers are NOT stored here - they are computed in
 * systems/puzzles/validate.ts. To add a puzzle, append an entry and reference its
 * id from a level in data/levels/.
 */
export const PUZZLES: PuzzleDef[] = [
  // ---- World 2: HCF Crystal Cave ----
  {
    id: "cave-1", kind: "hcf", numbers: [24, 36], rewardCoins: 5,
    title: "Crystal Machine I",
    intro: "24 blue crystals and 36 green crystals! The machine wants equal-sized groups with no crystal left over. What is the BIGGEST group size that works for both piles?",
    hints: [
      "Try a group size and watch for red leftover crystals. A good size leaves none.",
      "A group size must divide both 24 and 36 exactly. Does 12 divide both?",
    ],
  },
  {
    id: "cave-2", kind: "hcf", numbers: [18, 48], rewardCoins: 5,
    title: "Crystal Machine II",
    intro: "18 blue and 48 green crystals. Again: equal groups, nothing left over, and as big as possible.",
    hints: [
      "Start with small sizes (1, 2, 3) and go up while no crystals are left over.",
      "The factors of 18 are 1, 2, 3, 6, 9, 18. Which of them also divide 48?",
    ],
  },
  {
    id: "cave-3", kind: "hcf", numbers: [42, 70], rewardCoins: 6,
    title: "Crystal Machine III",
    intro: "The ancient machine at last! 42 blue and 70 green crystals. Find the greatest group size.",
    hints: [
      "Both numbers are even, so 2 works. Can you go higher? Think about the 7 times table.",
      "42 = 6 x 7 and 70 = 10 x 7. Try 14 = 2 x 7.",
    ],
  },
  // Class 7 harder variant of the first cave puzzle (replaces the one above for Class 7)
  {
    id: "cave-1", kind: "hcf", numbers: [84, 126], rewardCoins: 5, classes: [7],
    title: "Crystal Machine I",
    intro: "84 blue and 126 green crystals! Equal groups, nothing left over. What is the biggest group size?",
    hints: [
      "Both numbers are multiples of 2, 3 and 7. Combine those.",
      "84 = 2 x 2 x 3 x 7 and 126 = 2 x 3 x 3 x 7. Multiply what they share.",
    ],
  },
  // ---- World 3: LCM Magic Garden ----
  {
    id: "garden-1", kind: "lcm", numbers: [4, 6], steps: 16, rewardCoins: 5,
    title: "Twin Fountains",
    intro: "One fountain sprays every 4 steps, the other every 6 steps. Walk along the numbered stones and watch them. Stand on the FIRST stone where both spray together, then press E.",
    hints: [
      "Each fountain colours the stones it sprayed on. Look for a stone with both colours.",
      "List the 4 times table (4, 8, 12...) and the 6 times table (6, 12...). Which number is in both?",
    ],
  },
  {
    id: "garden-2", kind: "lcm", numbers: [6, 8], steps: 28, rewardCoins: 5,
    title: "Rotating Blooms",
    intro: "Now the fountains spray every 6 and every 8 steps. Find the first stone where they spray together.",
    hints: [
      "Common steps are in BOTH times tables. Walk on and see which stones light up twice.",
      "Multiples of 8: 8, 16, 24... Is 24 also a multiple of 6?",
    ],
  },
  {
    id: "garden-3", kind: "lcm", numbers: [3, 5, 6], steps: 34, rewardCoins: 6,
    title: "Triple Fountain",
    intro: "Three fountains this time: every 3, every 5 and every 6 steps. Find the first stone where ALL three spray together.",
    hints: [
      "The step must be a multiple of 3, of 5 AND of 6. Start with multiples of 5.",
      "Multiples of 5 that are also multiples of 6: 30 is the first. Is it a multiple of 3 too?",
    ],
  },
  {
    id: "garden-1", kind: "lcm", numbers: [6, 9], steps: 24, rewardCoins: 5, classes: [7],
    title: "Twin Fountains",
    intro: "One fountain sprays every 6 steps, the other every 9 steps. Stand on the FIRST stone where both spray together, then press E.",
    hints: [
      "Each fountain colours the stones it sprayed on. Look for a stone with both colours.",
      "Multiples of 9: 9, 18, 27... Which one is also in the 6 times table?",
    ],
  },
  // ---- World 4: Final Math Temple ----
  {
    id: "temple-hcf", kind: "hcf", numbers: [54, 90], rewardCoins: 6,
    title: "Temple Crystal Lock",
    intro: "The temple's crystal lock needs 54 blue and 90 green crystals in equal groups. Find the greatest group size.",
    hints: [
      "Both numbers are multiples of 9. Is there an even bigger common factor?",
      "54 = 2 x 3 x 3 x 3 and 90 = 2 x 3 x 3 x 5. Multiply 2 x 3 x 3.",
    ],
  },
  {
    id: "temple-lcm", kind: "lcm", numbers: [12, 18], steps: 40, rewardCoins: 6,
    title: "Temple Bell Lock",
    intro: "Two temple bells ring every 12 and every 18 steps. When do they first ring together? Walk the stones and press E on the answer.",
    hints: [
      "Multiples of 18: 18, 36, 54... Which is the first that 12 divides into?",
      "LCM = (12 x 18) / HCF(12, 18). The HCF is 6, so 216 / 6.",
    ],
  },
];

/** Resolve the puzzle set for a class: class-specific variants override the default. */
export function puzzlesForClass(cls: ClassLevel): Map<string, PuzzleDef> {
  const map = new Map<string, PuzzleDef>();
  for (const p of PUZZLES) {
    if (!p.classes) {
      if (!map.has(p.id)) map.set(p.id, p);
    } else if (p.classes.includes(cls)) {
      map.set(p.id, p);
    }
  }
  return map;
}
