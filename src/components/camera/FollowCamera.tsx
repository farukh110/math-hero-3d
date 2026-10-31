"use client";

import { useMemo } from "react";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { cameraKeyAxes, input } from "@/systems/input/input";
import { refs, rt } from "@/systems/runtime/runtime";

const DISTANCE = 7.2;
const MIN_PITCH = -0.05;
const MAX_PITCH = 1.15;

/** Third-person camera: behind and above the explorer, orbitable with mouse drag / arrow keys. */
export default function FollowCamera() {
  const camera = useThree((s) => s.camera);
  const { world, rapier } = useRapier();
  const v = useMemo(
    () => ({
      target: new Vector3(),
      desired: new Vector3(),
      look: new Vector3(),
      dir: new Vector3(),
      smoothTarget: new Vector3().copy(rt.pos),
      smoothLook: new Vector3().copy(rt.pos),
      dist: DISTANCE,
      ball: new rapier.Ball(0.5),
      pos: { x: 0, y: 0, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      rot: { x: 0, y: 0, z: 0, w: 1 },
    }),
    [rapier],
  );

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);

    // ---- puzzle focus: glide to a fixed vantage point ----
    if (rt.focus) {
      const k = 1 - Math.exp(-4 * dt);
      camera.position.lerp(rt.focus.pos, k);
      v.smoothLook.lerp(rt.focus.look, k);
      camera.lookAt(v.smoothLook);
      return;
    }

    // ---- orbit input ----
    if (!rt.locked) {
      const keys = cameraKeyAxes();
      rt.camYaw += keys.yaw * 1.9 * dt - input.dragX * 0.006;
      rt.camPitch += keys.pitch * 1.2 * dt + input.dragY * 0.005;
    }
    input.dragX = 0;
    input.dragY = 0;
    rt.camPitch = Math.min(MAX_PITCH, Math.max(MIN_PITCH, rt.camPitch));

    // ---- follow target (smoothed to hide the physics-step jitter) ----
    v.target.set(rt.pos.x, rt.pos.y + 0.7, rt.pos.z);
    v.smoothTarget.lerp(v.target, 1 - Math.exp(-14 * dt));

    const cp = Math.cos(rt.camPitch);
    v.dir.set(Math.sin(rt.camYaw) * cp, Math.sin(rt.camPitch), Math.cos(rt.camYaw) * cp);

    // ---- keep the player visible: pull the camera in if a wall is in the way ----
    let dist = DISTANCE;
    v.pos.x = v.smoothTarget.x;
    v.pos.y = v.smoothTarget.y;
    v.pos.z = v.smoothTarget.z;
    v.vel.x = v.dir.x;
    v.vel.y = v.dir.y;
    v.vel.z = v.dir.z;
    // a fat sphere (not a thin ray) so the camera cannot slip over the top of low walls
    const hit = world.castShape(v.pos, v.rot, v.vel, v.ball, 0, DISTANCE, true, undefined, undefined, undefined, refs.body ?? undefined);
    if (hit) dist = Math.max(1.6, hit.time_of_impact);
    v.dist += (dist - v.dist) * (dist < v.dist ? 1 : 1 - Math.exp(-5 * dt));

    v.desired.copy(v.smoothTarget).addScaledVector(v.dir, v.dist);
    if (rt.camSnap) {
      camera.position.copy(v.desired);
      v.smoothTarget.copy(v.target);
      rt.camSnap = false;
    } else {
      camera.position.lerp(v.desired, 1 - Math.exp(-16 * dt));
    }
    v.look.set(v.smoothTarget.x, v.smoothTarget.y + 0.5, v.smoothTarget.z);
    v.smoothLook.copy(v.look);
    camera.lookAt(v.look);
  });

  return null;
}
