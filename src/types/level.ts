export type Vec3 = [number, number, number];
export type WorldId = 1 | 2 | 3 | 4;
export type CollectibleKind = "coin" | "star" | "gem";

export interface BoxDef {
  pos: Vec3;
  size: Vec3;
  color: string;
  /** false = purely visual, no collider. Default true. */
  solid?: boolean;
  /** Visual style hint for the material. */
  glow?: boolean;
}

export interface MoverDef {
  id: string;
  /** Start centre. */
  pos: Vec3;
  size: Vec3;
  /** Offset from `pos` at the far end of the trip. */
  travel: Vec3;
  /** Seconds for a full there-and-back trip. */
  period: number;
  phase?: number;
  color: string;
}

export interface SweeperDef {
  id: string;
  pos: Vec3;
  length: number;
  /** Radians per second. */
  speed: number;
}

export type Requirement =
  | { type: "flag"; key: string }
  | { type: "coins"; count: number }
  | { type: "all"; of: Requirement[] };

export interface GateDef {
  id: string;
  pos: Vec3;
  size: Vec3;
  open: Requirement;
  style: "portcullis" | "crystal" | "stone";
  /** Shown while closed and the player is nearby. */
  lockedHint: string;
}

export interface LeverDef {
  id: string;
  pos: Vec3;
  label: string;
}

export interface CheckpointDef {
  id: string;
  pos: Vec3;
}

export interface CrystalStation {
  type: "crystal";
  puzzleId: string;
  pos: Vec3;
  /** Gate flag is set by solving; this is where reward gems pop out. */
}

export interface LaneStation {
  type: "lane";
  puzzleId: string;
  /** Centre of the lane. Lane runs along +x. */
  pos: Vec3;
  /** Distance between stone centres. */
  spacing: number;
  /** Fountain positions relative to lane centre, drawn along the north side. */
  fountainZ: number;
}

export type StationDef = CrystalStation | LaneStation;

export interface Objective {
  text: string;
  done: Requirement;
}

export interface ThemeDef {
  sky: string;
  skyBottom: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  ambient: number;
  sun: number;
  sunColor: string;
  sunDir: Vec3;
}

export interface DecorDef {
  trees?: Vec3[];
  rocks?: Vec3[];
  grass?: { center: Vec3; radius: number; count: number }[];
  /** Glowing cave crystals: position + colour. */
  crystals?: { pos: Vec3; color: string; scale: number }[];
  flowers?: { center: Vec3; radius: number; count: number }[];
  pillars?: Vec3[];
  torches?: Vec3[];
}

export interface LevelDef {
  id: WorldId;
  name: string;
  tagline: string;
  intro: string[];
  theme: ThemeDef;
  spawn: Vec3;
  /** Falling below this y respawns the player. */
  fallY: number;
  boxes: BoxDef[];
  movers?: MoverDef[];
  sweepers?: SweeperDef[];
  coins: Vec3[];
  stars: Vec3[];
  checkpoints: CheckpointDef[];
  levers?: LeverDef[];
  gates: GateDef[];
  stations: StationDef[];
  decor: DecorDef;
  goal: { pos: Vec3; label: string; requires?: Requirement };
  objectives: Objective[];
  /** Which special scenery the world renders. */
  scenery: "kingdom" | "cave" | "garden" | "temple";
  /** Y of the water/lava/void plane, if any. */
  hazardPlane?: { y: number; color: string };
}
