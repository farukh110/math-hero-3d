import { Vector3 } from "three";
import type { RapierRigidBody } from "@react-three/rapier";
import type { Vec3 } from "@/types/level";

/**
 * Mutable per-frame game state. Deliberately NOT React state: the player moves 60x a
 * second and nothing in React should re-render for that. Systems read/write this
 * directly inside useFrame callbacks.
 */
export interface Interactable {
  id: string;
  pos: Vec3;
  radius: number;
  /** Prompt text, or null when the object is currently not usable. */
  prompt: () => string | null;
  onInteract: () => void;
}

export type PlayerAnim = "idle" | "run" | "jump" | "fall" | "land" | "victory";

export const rt = {
  pos: new Vector3(),
  vel: new Vector3(),
  facing: 0,
  grounded: false,
  anim: "idle" as PlayerAnim,
  landTimer: 0,
  /** Input is ignored while a menu, puzzle or card is open. */
  locked: false,
  camYaw: 0,
  camPitch: 0.35,
  /** Camera override while using a puzzle machine. */
  focus: null as null | { pos: Vector3; look: Vector3 },
  checkpoint: new Vector3(),
  respawn: false,
  victory: false,
  interactables: new Map<string, Interactable>(),
  nearest: null as Interactable | null,
  /** Velocity of the moving platform under the player. */
  platformVel: new Vector3(),
  /** step index of the lane tile under the player, per station id. */
  laneStep: new Map<string, number>(),
  time: 0,
  /** Snap the camera to its follow position on the next frame (spawn / respawn). */
  camSnap: true,
};

export function resetRuntime(spawn: Vec3): void {
  rt.pos.set(...spawn);
  rt.vel.set(0, 0, 0);
  rt.checkpoint.set(...spawn);
  rt.grounded = false;
  rt.anim = "idle";
  rt.landTimer = 0;
  rt.respawn = true;
  rt.victory = false;
  rt.focus = null;
  rt.interactables.clear();
  rt.laneStep.clear();
  rt.nearest = null;
  rt.camSnap = true;
  rt.facing = Math.PI; // models face +z at 0; the adventure runs towards -z
  rt.camYaw = 0;
  rt.camPitch = 0.35;
}

/** Handles to physics objects other systems need (camera ray exclusion, platform carry). */
export const refs = {
  body: null as RapierRigidBody | null,
};

/** Velocity of each moving platform by rigid-body handle, so the player can ride them. */
export const platformVelocities = new Map<number, Vector3>();
