"use client";

import { useEffect, useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import type { GateDef } from "@/types/level";
import { actions, countCollected, useGame } from "@/systems/progression/gameStore";
import { isMet } from "@/data/levels";
import { playSfx } from "@/systems/audio/audio";
import { useInteractable } from "./useInteractable";

/**
 * A gate that is solid until its requirement is met (decided by isMet() over saved flags /
 * coin count, never by a callback), then sinks into the floor.
 */
export default function Gate({ def, worldId }: { def: GateDef; worldId: number }) {
  const open = useGame((s) => isMet(def.open, worldId, s.progress.flags, countCollected(s.progress, worldId, "coin")));
  const coins = useGame((s) => countCollected(s.progress, worldId, "coin"));
  const door = useRef<Group>(null);
  const sink = useRef(open ? 1 : 0);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (open && !wasOpen.current) {
      playSfx("gate");
      actions.toast("A gate has opened!");
    }
    wasOpen.current = open;
  }, [open]);

  useInteractable(
    open
      ? null
      : {
          id: `gate:${def.id}`,
          pos: def.pos,
          radius: 4.2,
          prompt: () => (def.open.type === "coins" ? `${def.lockedHint} (you have ${coins})` : def.lockedHint),
          onInteract: () => playSfx("wrong"),
        },
  );

  useFrame((_, dt) => {
    sink.current += ((open ? 1 : 0) - sink.current) * Math.min(1, dt * 2.2);
    const d = door.current;
    if (d) {
      d.position.y = -sink.current * (def.size[1] + 0.3);
      d.visible = sink.current < 0.985;
    }
  });

  const [w, h, dpt] = def.size;
  const frame = def.style === "stone" ? "#9c8f7a" : def.style === "crystal" ? "#7d6aa8" : "#6b6b72";

  return (
    <group position={def.pos}>
      {!open && (
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[w / 2, h / 2, dpt / 2]} friction={0} frictionCombineRule={1} />
        </RigidBody>
      )}
      <group ref={door}>
        {def.style === "portcullis" &&
          Array.from({ length: Math.round(w * 2) }, (_, i) => (
            <mesh key={i} position={[-w / 2 + 0.25 + i * 0.5, 0, 0]}>
              <boxGeometry args={[0.16, h, 0.2]} />
              <meshLambertMaterial color="#4b4b55" />
            </mesh>
          ))}
        {def.style === "portcullis" &&
          [-0.3, 0.3].map((f) => (
            <mesh key={f} position={[0, h * f, 0]}>
              <boxGeometry args={[w, 0.18, 0.24]} />
              <meshLambertMaterial color="#4b4b55" />
            </mesh>
          ))}
        {def.style === "crystal" && (
          <>
            <mesh>
              <boxGeometry args={[w, h, 0.5]} />
              <meshLambertMaterial color={frame} />
            </mesh>
            <mesh position={[0, 0, 0.3]} scale={[1, 1.6, 0.5]}>
              <octahedronGeometry args={[Math.min(w, h) * 0.32, 0]} />
              <meshBasicMaterial color="#b58cff" />
            </mesh>
            <mesh position={[0, 0, -0.3]} scale={[1, 1.6, 0.5]}>
              <octahedronGeometry args={[Math.min(w, h) * 0.32, 0]} />
              <meshBasicMaterial color="#b58cff" />
            </mesh>
          </>
        )}
        {def.style === "stone" && (
          <>
            <mesh>
              <boxGeometry args={[w, h, dpt]} />
              <meshLambertMaterial color={frame} />
            </mesh>
            <mesh position={[0, 0, dpt / 2 + 0.02]}>
              <ringGeometry args={[Math.min(w, h) * 0.18, Math.min(w, h) * 0.26, 24]} />
              <meshBasicMaterial color="#ffb347" />
            </mesh>
            <mesh position={[0, 0, dpt / 2 + 0.02]}>
              <circleGeometry args={[Math.min(w, h) * 0.08, 12]} />
              <meshBasicMaterial color="#ffb347" />
            </mesh>
          </>
        )}
      </group>
      {/* stone frame stays in place */}
      <mesh position={[-w / 2 - 0.25, 0, 0]}>
        <boxGeometry args={[0.5, h + 0.4, dpt + 0.3]} />
        <meshLambertMaterial color={frame} />
      </mesh>
      <mesh position={[w / 2 + 0.25, 0, 0]}>
        <boxGeometry args={[0.5, h + 0.4, dpt + 0.3]} />
        <meshLambertMaterial color={frame} />
      </mesh>
      <mesh position={[0, h / 2 + 0.2, 0]}>
        <boxGeometry args={[w + 1.2, 0.5, dpt + 0.3]} />
        <meshLambertMaterial color={frame} />
      </mesh>
    </group>
  );
}
