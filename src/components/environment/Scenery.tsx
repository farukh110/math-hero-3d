"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, ConeGeometry, InstancedMesh, Mesh, Object3D } from "three";
import { useFrame } from "@react-three/fiber";
import type { LevelDef } from "@/types/level";
import type { QualityConfig } from "@/systems/quality";
import { rng } from "@/data/levels/helpers";

/** Large flat plane under the level: water, lava or the cave abyss. */
export function HazardPlane({ y, color, animated }: { y: number; color: string; animated?: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (animated && ref.current) ref.current.position.y = y + Math.sin(clock.elapsedTime * 1.2) * 0.12;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, -60]}>
      <planeGeometry args={[500, 500]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Tower({ x, z, h, r, roof }: { x: number; z: number; h: number; r: number; roof: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r, r * 1.08, h, 10]} />
        <meshLambertMaterial color="#d8d0c2" />
      </mesh>
      <mesh position={[0, h + r * 0.9, 0]}>
        <coneGeometry args={[r * 1.3, r * 2.2, 10]} />
        <meshLambertMaterial color={roof} />
      </mesh>
      <mesh position={[0, h + r * 2.4, 0]}>
        <boxGeometry args={[0.08, 1.2, 0.08]} />
        <meshLambertMaterial color="#6b5a45" />
      </mesh>
      <mesh position={[0.45, h + r * 2.7, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.05]} />
        <meshBasicMaterial color="#ff5d7a" />
      </mesh>
    </group>
  );
}

/** Kingdom backdrop: a colourful castle behind the courtyard. */
function Castle() {
  return (
    <group position={[0, 1, -108]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[16, 12, 8]} />
        <meshLambertMaterial color="#e6dfd2" />
      </mesh>
      <mesh position={[0, 3, -4.1]}>
        <boxGeometry args={[4, 6, 0.3]} />
        <meshLambertMaterial color="#8d5d2e" />
      </mesh>
      <mesh position={[0, 6.2, -4.1]}>
        <cylinderGeometry args={[2, 2, 0.3, 12, 1, false, 0, Math.PI]} />
        <meshLambertMaterial color="#8d5d2e" />
      </mesh>
      <Tower x={-10} z={0} h={14} r={2.2} roof="#7c4dff" />
      <Tower x={10} z={0} h={14} r={2.2} roof="#7c4dff" />
      <Tower x={-5} z={3} h={17} r={1.6} roof="#ff6b9d" />
      <Tower x={5} z={3} h={17} r={1.6} roof="#ff6b9d" />
      <Tower x={0} z={2} h={20} r={2.4} roof="#4dabf7" />
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} position={[x, 12.5, -3]}>
          <boxGeometry args={[1.4, 1.2, 1.4]} />
          <meshLambertMaterial color="#e6dfd2" />
        </mesh>
      ))}
    </group>
  );
}

/** Stalactites hanging in the dark above the cave. */
function Stalactites({ count }: { count: number }) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new ConeGeometry(1, 1, 6), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const r = rng(5);
    const o = new Object3D();
    const c = new Color();
    for (let i = 0; i < count; i++) {
      const s = 1 + r() * 3.5;
      o.position.set((r() - 0.5) * 24, 16 + r() * 10 - s / 2, 20 - r() * 140);
      o.rotation.set(Math.PI, r() * 6, 0);
      o.scale.set(0.6 + r() * 1.2, s, 0.6 + r() * 1.2);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(i % 5 === 0 ? "#6a4fb8" : "#3d2f66"));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} frustumCulled={false}>
      <meshLambertMaterial />
    </instancedMesh>
  );
}

/** Temple: a grand arch and columns around the final chamber. */
function TempleBackdrop() {
  const cols = [-30, -18, 18, 30];
  return (
    <group>
      {cols.map((x) => (
        <mesh key={x} position={[x, 8, -84]}>
          <cylinderGeometry args={[1.5, 1.8, 22, 10]} />
          <meshLambertMaterial color="#e8d9b5" />
        </mesh>
      ))}
      <mesh position={[0, 13, -86]}>
        <boxGeometry args={[60, 3, 4]} />
        <meshLambertMaterial color="#d6c3a3" />
      </mesh>
      <mesh position={[0, 17, -86]}>
        <coneGeometry args={[18, 8, 4]} />
        <meshLambertMaterial color="#c9553d" />
      </mesh>
    </group>
  );
}

export default function Scenery({ level, quality }: { level: LevelDef; quality: QualityConfig }) {
  return (
    <>
      {level.hazardPlane && (
        <HazardPlane y={level.hazardPlane.y} color={level.hazardPlane.color} animated={level.scenery === "kingdom" || level.scenery === "temple" || level.scenery === "garden"} />
      )}
      {level.scenery === "kingdom" && <Castle />}
      {level.scenery === "cave" && <Stalactites count={Math.round(60 * quality.decor)} />}
      {level.scenery === "temple" && <TempleBackdrop />}
    </>
  );
}
