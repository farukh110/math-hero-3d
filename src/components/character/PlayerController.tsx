"use client";

import { useEffect, useMemo, useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier";
import Explorer from "./Explorer";
import { input, moveAxes, wantsJump } from "@/systems/input/input";
import { platformVelocities, refs, rt } from "@/systems/runtime/runtime";
import { actions, gameStore } from "@/systems/progression/gameStore";
import { playSfx } from "@/systems/audio/audio";
import { PLAYER } from "@/systems/physics/constants";
import type { LevelDef } from "@/types/level";

const FEET_OFFSET = PLAYER.halfHeight + PLAYER.radius;
const RAY_OFFSETS: [number, number][] = [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]];

export default function PlayerController({ level }: { level: LevelDef }) {
  const body = useRef<RapierRigidBody>(null);
  const facing = useRef<Group>(null);
  const { world, rapier } = useRapier();
  const ray = useMemo(() => new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }), [rapier]);
  const s = useRef({ coyote: 0, jumpBuf: 0, wasGrounded: false, jumpHeldPrev: false, lastFallVy: 0 });

  useEffect(() => {
    refs.body = body.current;
    return () => {
      refs.body = null;
    };
  }, []);

  useFrame((_, dtRaw) => {
    const b = body.current;
    if (!b) return;
    if (gameStore.get().overlay !== "none") return; // paused: freeze the whole world
    const dt = Math.min(dtRaw, 0.05);
    rt.time += dt;
    const st = s.current;

    if (rt.respawn) {
      b.setTranslation({ x: rt.checkpoint.x, y: rt.checkpoint.y, z: rt.checkpoint.z }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rt.pos.copy(rt.checkpoint);
      rt.respawn = false;
      rt.camSnap = true;
      st.coyote = 0;
      return;
    }

    const t = b.translation();
    const v = b.linvel();
    rt.pos.set(t.x, t.y, t.z);
    rt.vel.set(v.x, v.y, v.z);

    if (t.y < level.fallY) {
      rt.respawn = true;
      playSfx("wrong");
      actions.toast("Oops! Back to your last checkpoint.");
      return;
    }

    // ---- ground detection: 5 short rays so the player can stand on edges ----
    let grounded = false;
    rt.platformVel.set(0, 0, 0);
    if (v.y <= 0.5) {
      for (const [ox, oz] of RAY_OFFSETS) {
        ray.origin.x = t.x + ox;
        ray.origin.y = t.y;
        ray.origin.z = t.z + oz;
        const hit = world.castRay(ray, FEET_OFFSET + PLAYER.groundSlop, true, undefined, undefined, undefined, b);
        if (hit) {
          grounded = true;
          const parent = hit.collider.parent();
          const pv = parent ? platformVelocities.get(parent.handle) : undefined;
          if (pv) rt.platformVel.copy(pv);
          break;
        }
      }
    }
    rt.grounded = grounded;

    // ---- input ----
    const controllable = !rt.locked && !rt.victory;
    const axes = controllable ? moveAxes() : { x: 0, z: 0 };
    const yaw = rt.camYaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let mx = rx * axes.x + fx * -axes.z;
    let mz = rz * axes.x + fz * -axes.z;
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    const moving = len > 0.01;

    const tx = mx * PLAYER.speed + rt.platformVel.x;
    const tz = mz * PLAYER.speed + rt.platformVel.z;
    const accel = (grounded ? PLAYER.groundAccel : PLAYER.airAccel) * dt;
    const vx = v.x + Math.max(-accel, Math.min(accel, tx - v.x));
    const vz = v.z + Math.max(-accel, Math.min(accel, tz - v.z));
    let vy = v.y;

    // ---- jump with coyote time + input buffer ----
    const jumpHeld = controllable && wantsJump();
    if (jumpHeld && !st.jumpHeldPrev) st.jumpBuf = PLAYER.jumpBuffer;
    st.jumpHeldPrev = jumpHeld;
    st.jumpBuf = Math.max(0, st.jumpBuf - dt);
    st.coyote = grounded ? PLAYER.coyote : Math.max(0, st.coyote - dt);
    if (st.jumpBuf > 0 && st.coyote > 0) {
      vy = PLAYER.jumpSpeed + Math.max(0, rt.platformVel.y);
      st.jumpBuf = 0;
      st.coyote = 0;
      playSfx("jump");
    } else if (!jumpHeld && vy > PLAYER.jumpCutSpeed) {
      vy = Math.max(PLAYER.jumpCutSpeed, vy - 80 * dt); // short hop when released early
    }
    vy = Math.max(vy, -PLAYER.maxFall);
    b.setLinvel({ x: vx, y: vy, z: vz }, true);

    // ---- landing ----
    if (!st.wasGrounded && grounded && st.lastFallVy < -6) {
      rt.landTimer = 0.16;
      playSfx("land");
    }
    st.wasGrounded = grounded;
    st.lastFallVy = v.y;
    rt.landTimer = Math.max(0, rt.landTimer - dt);

    // ---- facing + animation state ----
    if (moving) {
      const target = Math.atan2(mx, mz);
      let d = target - rt.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      rt.facing += d * Math.min(1, dt * 14);
    }
    if (facing.current) facing.current.rotation.y = rt.facing;
    const horiz = Math.hypot(vx - rt.platformVel.x, vz - rt.platformVel.z);
    rt.anim = rt.victory ? "victory" : rt.landTimer > 0 ? "land" : !grounded ? (vy > 0 ? "jump" : "fall") : horiz > 0.6 && moving ? "run" : "idle";

    // ---- interaction ----
    if (rt.locked) {
      rt.nearest = null;
      actions.setPrompt(null);
      input.interactEdge = false;
    } else {
      let best: (typeof rt.nearest) = null;
      let bestD = Infinity;
      let bestPrompt: string | null = null;
      for (const it of rt.interactables.values()) {
        const dx = it.pos[0] - t.x, dz = it.pos[2] - t.z, dy = it.pos[1] - (t.y - FEET_OFFSET);
        const d2 = dx * dx + dz * dz;
        if (d2 > it.radius * it.radius || Math.abs(dy) > 3.2 || d2 >= bestD) continue;
        const p = it.prompt();
        if (p === null) continue;
        best = it;
        bestD = d2;
        bestPrompt = p;
      }
      rt.nearest = best;
      actions.setPrompt(bestPrompt);
      if (input.interactEdge) {
        input.interactEdge = false;
        if (best) best.onInteract();
      }
    }
  });

  return (
    <RigidBody
      ref={body}
      position={[rt.pos.x, rt.pos.y, rt.pos.z]}
      colliders={false}
      enabledRotations={[false, false, false]}
      linearDamping={0}
      canSleep={false}
      ccd
    >
      <CapsuleCollider args={[PLAYER.halfHeight, PLAYER.radius]} friction={0} frictionCombineRule={1} restitution={0} />
      <group ref={facing} position={[0, -FEET_OFFSET, 0]}>
        <Explorer />
      </group>
    </RigidBody>
  );
}
