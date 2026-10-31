"use client";

import { useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import type { LevelDef } from "@/types/level";
import { actions, requirementMet } from "@/systems/progression/gameStore";
import { playSfx } from "@/systems/audio/audio";
import { rt } from "@/systems/runtime/runtime";
import { useInteractable } from "./useInteractable";

/** Level exit: a swirling portal (or the treasure chest in the final world). */
export default function GoalPortal({ level }: { level: LevelDef }) {
  const ring = useRef<Group>(null);
  const final = level.id === 4;
  const done = useRef(false);

  useInteractable({
    id: "goal",
    pos: level.goal.pos,
    radius: 3,
    prompt: () => {
      if (rt.victory) return null;
      if (level.goal.requires && !requirementMet(level.goal.requires)) return "The way is not open yet.";
      return `Press E: ${level.goal.label}`;
    },
    onInteract: () => {
      if (done.current || rt.victory) return;
      if (level.goal.requires && !requirementMet(level.goal.requires)) return;
      done.current = true;
      playSfx("interact");
      actions.completeWorld();
    },
  });

  useFrame(() => {
    const r = ring.current;
    if (r) {
      r.rotation.z = rt.time * 1.2;
      r.children.forEach((c, i) => c.scale.setScalar(1 + Math.sin(rt.time * 3 + i) * 0.04));
    }
  });

  const [x, y, z] = level.goal.pos;
  if (final) {
    return (
      <group position={[x, y, z]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.8, 0.9, 1.1]} />
          <meshLambertMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 1.0, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 1.8, 10, 1, false, 0, Math.PI]} />
          <meshLambertMaterial color="#a8691f" />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <octahedronGeometry args={[0.45, 0]} />
          <meshBasicMaterial color="#ffd23f" />
        </mesh>
        <mesh position={[0, 0.65, 0.58]}>
          <boxGeometry args={[0.3, 0.3, 0.06]} />
          <meshBasicMaterial color="#ffd23f" />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[x, y + 1.9, z]}>
      <group ref={ring}>
        <mesh>
          <torusGeometry args={[1.8, 0.14, 8, 28]} />
          <meshBasicMaterial color="#9b6bff" />
        </mesh>
        <mesh>
          <torusGeometry args={[1.35, 0.08, 8, 24]} />
          <meshBasicMaterial color="#4fc3ff" />
        </mesh>
      </group>
      <mesh>
        <circleGeometry args={[1.25, 20]} />
        <meshBasicMaterial color="#d9c2ff" />
      </mesh>
      <mesh position={[0, -1.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 18]} />
        <meshBasicMaterial color="#6e4bd8" />
      </mesh>
    </group>
  );
}
