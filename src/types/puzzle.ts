export type PuzzleKind = "hcf" | "lcm";
export type ClassLevel = 6 | 7;

export interface PuzzleDef {
  id: string;
  kind: PuzzleKind;
  /** Two numbers for HCF (crystal machine); two or three for LCM (fountains). */
  numbers: number[];
  title: string;
  /** Short in-world dialogue shown when the player first meets the puzzle. */
  intro: string;
  /** Progressive hints, revealed after repeated failed attempts. */
  hints: string[];
  /** Number of collectible gems that spawn when solved. */
  rewardCoins: number;
  /** LCM only: how many numbered stones the lane has. */
  steps?: number;
  /** Class levels this variant is used for. Both when omitted. */
  classes?: ClassLevel[];
}

export type AttemptStatus = "correct" | "valid-not-best" | "wrong";

export interface AttemptResult {
  status: AttemptStatus;
  message: string;
}
