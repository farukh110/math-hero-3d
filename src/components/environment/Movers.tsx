"use client";

import { useEffect, useMemo, useRef } from "react";
import { Euler, Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import type { MoverDef, SweeperDef } from "@/types/level";
import { platformVelocities, rt } from "@/systems/runtime/runtime";

/** Kinematic platform that glides back and forth. Its velocity is published so the player rides it. */
export function MovingPlatform({ def }: { def: MoverDef }) {
  const body = useRef<RapierRigidBody>(null);
  const vel = useMemo(() => new Vector3(), []);
  const [px, py, pz] = def.pos;
  const w = 2 * Math.PI / def.period;

  const handle = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (handle.current !== null) platformVelocities.delete(handle.current);
    },
    [],
  );

  useFrame(() => {
    const b = body.current;
    if (!b) return;
    if (handle.current === null) {
      // the physics body is created lazily, so register the first frame it exists
      handle.current = b.handle;
      platformVelocities.set(b.handle, vel);
    }
    const ph = rt.time * w + (def.phase ?? 0) * Math.PI * 2;
    const k = 0.5 - 0.5 * Math.cos(ph);
    const dk = 0.5 * Math.sin(ph) * w;
    b.setNextKinematicTranslation({ x: px + def.travel[0] * k, y: py + def.travel[1] * k, z: pz + def.travel[2] * k });
    vel.set(def.travel[0] * dk, def.travel[1] * dk, def.travel[2] * dk);
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={def.pos}>
      <CuboidCollider args={[def.size[0] / 2, def.size[1] / 2, def.size[2] / 2]} friction={0} frictionCombineRule={1} />
      <mesh>
        <boxGeometry args={def.size} />
        <meshLambertMaterial color={def.color} />
      </mesh>
      <mesh position={[0, def.size[1] / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[def.size[0] * 0.3, def.size[0] * 0.38, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial color="#fff2b8" />
      </mesh>
    </RigidBody>
  );
}

/** A low spinning bar that must be jumped over. */
export function Sweeper({ def }: { def: SweeperDef }) {
  const body = useRef<RapierRigidBody>(null);
  const q = useMemo(() => new Quaternion(), []);
  const e = useMemo(() => new Euler(), []);

  useFrame(() => {
    const b = body.current;
    if (!b) return;
    e.set(0, rt.time * def.speed, 0);
    q.setFromEuler(e);
    b.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={def.pos}>
      <CuboidCollider args={[def.length / 2, 0.25, 0.28]} friction={0} frictionCombineRule={1} />
      <mesh>
        <boxGeometry args={[def.length, 0.5, 0.56]} />
        <meshLambertMaterial color="#d9442f" />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.45, 0.55, 0.7, 10]} />
        <meshLambertMaterial color="#5a4636" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (def.length / 2 - 0.2), 0.32, 0]}>
          <coneGeometry args={[0.14, 0.3, 5]} />
          <meshBasicMaterial color="#ffd23f" />
        </mesh>
      ))}
    </RigidBody>
  );
}
