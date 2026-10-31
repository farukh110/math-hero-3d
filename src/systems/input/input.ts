/** Centralised keyboard / mouse input. Held state is read per frame; edges use callbacks. */

export const input = {
  keys: new Set<string>(),
  /** Camera drag accumulated since last frame (pixels). */
  dragX: 0,
  dragY: 0,
  dragging: false,
  /** Set true on the frame E was pressed; consumed by the player controller. */
  interactEdge: false,
};

export function moveAxes(): { x: number; z: number } {
  const k = input.keys;
  const x = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
  const z = (k.has("KeyS") ? 1 : 0) - (k.has("KeyW") ? 1 : 0);
  return { x, z };
}

export function cameraKeyAxes(): { yaw: number; pitch: number } {
  const k = input.keys;
  return {
    yaw: (k.has("ArrowLeft") ? 1 : 0) - (k.has("ArrowRight") ? 1 : 0),
    pitch: (k.has("ArrowUp") ? 1 : 0) - (k.has("ArrowDown") ? 1 : 0),
  };
}

export function wantsJump(): boolean {
  return input.keys.has("Space");
}

export function wantsRun(): boolean {
  return input.keys.has("ShiftLeft") || input.keys.has("ShiftRight");
}

export function clearInput(): void {
  input.keys.clear();
  input.dragX = 0;
  input.dragY = 0;
  input.dragging = false;
  input.interactEdge = false;
}
