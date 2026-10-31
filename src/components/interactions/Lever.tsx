"use client";

import { useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import type { LeverDef } from "@/types/level";
import { actions, useGame } from "@/systems/progression/gameStore";
import { flagKey } from "@/data/levels";
import { playSfx } from "@/systems/audio/audio";
import { useInteractable } from "./useInteractable";

/** A stone lever. Pulling it sets the flag "lever:<id>", which gates can require. */
export default function Lever({ def, worldId }: { def: LeverDef; worldId: number }) {
  const pulled = useGame((s) => s.progress.flags[flagKey(worldId, `lever:${def.id}`)] === true);
  const handle = useRef<Group>(null);

  useInteractable({
    id: `lever:${def.id}`,
    pos: def.pos,
    radius: 2.3,
    prompt: () => (pulled ? null : `Press E to ${def.label.toLowerCase()}`),
    onInteract: () => {
      playSfx("interact");
      actions.setFlag(`lever:${def.id}`);
      actions.toast("Click! Something heavy is moving...");
    },
  });

  useFrame((_, dt) => {
    const h = handle.current;
    if (h) h.rotation.z += ((pulled ? -0.9 : 0.9) - h.rotation.z) * Math.min(1, dt * 8);
  });

  return (
    <group position={def.pos}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.6]} />
        <meshLambertMaterial color="#8a8578" />
      </mesh>
      <group ref={handle} position={[0, 0.5, 0]} rotation={[0, 0, 0.9]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 1, 6]} />
          <meshLambertMaterial color="#6b4a2b" />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.18, 10, 8]} />
          <meshBasicMaterial color={pulled ? "#5dff9a" : "#ff5d7a"} />
        </mesh>
      </group>
    </group>
  );
}
