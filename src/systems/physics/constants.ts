/** Tuned so a full jump rises ~2.2 units and clears gaps of ~5 units at run speed. */
export const GRAVITY: [number, number, number] = [0, -30, 0];

export const PLAYER = {
  radius: 0.4,
  /** Half height of the cylindrical part of the capsule. */
  halfHeight: 0.45,
  speed: 7.5,
  groundAccel: 70,
  airAccel: 30,
  jumpSpeed: 11.5,
  jumpCutSpeed: 4,
  maxFall: 38,
  coyote: 0.1,
  jumpBuffer: 0.12,
  groundSlop: 0.14,
} as const;
