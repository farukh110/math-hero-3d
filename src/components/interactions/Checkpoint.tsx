"use client";

import { useRef } from "react";
import { Mesh, MeshBasicMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import type { CheckpointDef } from "@/types/level";
import { actions, gameStore } from "@/systems/progression/gameStore";
import { rt } from "@/systems/runtime/runtime";

/** Flag pole. Touching it saves the spot; the flag turns green when it is the active one. */
export default function Checkpoint({ def }: { def: CheckpointDef }) {
  const flag = useRef<Mesh>(null);
  const mat = useRef<MeshBasicMaterial>(null);

  useFrame(() => {
    const st = gameStore.get();
    const active = st.progress.checkpoints[String(st.worldId)] === def.id;
    if (mat.current) mat.current.color.set(active ? "#4dff88" : "#ff6b6b");
    if (flag.current) flag.current.rotation.y = Math.sin(rt.time * 3) * 0.25;
    if (!active && !rt.locked) {
      const dx = rt.pos.x - def.pos[0], dz = rt.pos.z - def.pos[2], dy = rt.pos.y - def.pos[1];
      if (dx * dx + dz * dz < 2.6 * 2.6 && Math.abs(dy) < 2.5) actions.reachCheckpoint(def.id);
    }
  });

  return (
    <group position={[def.pos[0], def.pos[1] - 0.6, def.pos[2]]}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 2.4, 6]} />
        <meshLambertMaterial color="#d9d4c7" />
      </mesh>
      <mesh ref={flag} position={[0.45, 2.0, 0]}>
        <boxGeometry args={[0.9, 0.55, 0.04]} />
        <meshBasicMaterial ref={mat} color="#ff6b6b" />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.45, 0.55, 0.12, 10]} />
        <meshLambertMaterial color="#9a9486" />
      </mesh>
    </group>
  );
}
