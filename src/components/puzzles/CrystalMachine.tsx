"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Color, CylinderGeometry, Group, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, OctahedronGeometry, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { CrystalStation, Vec3 } from "@/types/level";
import { actions, getPuzzle, useGame } from "@/systems/progression/gameStore";
import { flagKey } from "@/data/levels";
import { layoutCrystals } from "@/systems/puzzles/crystalLayout";
import { answerOf } from "@/systems/puzzles/validate";
import { rt } from "@/systems/runtime/runtime";
import { useInteractable } from "@/components/interactions/useInteractable";
import RewardGems from "./RewardGems";

const FIELD_W = 5.8;
const FIELD_D = 5.2;
const FIELD_Z = 4.6;
const BLUE = "#3aa0ff";
const GREEN = "#38d97a";
const RED = "#ff4d5e";

/** One pile of crystals + plates that animate between layouts. */
function CrystalField({ count, baseColor, side, groupSize, active }: { count: number; baseColor: string; side: -1 | 1; groupSize: number; active: boolean }) {
  const gems = useRef<InstancedMesh>(null);
  const plates = useRef<InstancedMesh>(null);
  const gemGeo = useMemo(() => {
    const g = new OctahedronGeometry(0.2, 0);
    g.scale(0.8, 1.7, 0.8);
    g.translate(0, 0.34, 0);
    return g;
  }, []);
  const plateGeo = useMemo(() => new CylinderGeometry(0.5, 0.5, 0.06, 20), []);
  const o = useMemo(() => new Object3D(), []);
  const cur = useRef<{ gx: Float32Array; gz: Float32Array; gs: Float32Array; px: Float32Array; pz: Float32Array; ps: Float32Array }>({
    gx: new Float32Array(count), gz: new Float32Array(count), gs: new Float32Array(count),
    px: new Float32Array(count), pz: new Float32Array(count), ps: new Float32Array(count),
  });
  const layout = useMemo(() => layoutCrystals(count, groupSize > 0 ? groupSize : count, FIELD_W, FIELD_D), [count, groupSize]);
  const target = useRef(layout);
  useEffect(() => {
    target.current = layout;
  }, [layout]);
  const cx = side * 3.9;

  // colours only change when the layout does
  useLayoutEffect(() => {
    const m = gems.current, pm = plates.current;
    if (!m || !pm) return;
    const base = new Color(baseColor), red = new Color(RED);
    const plateOk = new Color("#8f8ac2"), plateBad = new Color("#b0485a");
    layout.slots.forEach((s, i) => m.setColorAt(i, s.leftover ? red : base));
    layout.plates.forEach((p, i) => pm.setColorAt(i, p.leftover ? plateBad : plateOk));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    if (pm.instanceColor) pm.instanceColor.needsUpdate = true;
  }, [layout, baseColor]);

  useFrame((_, dt) => {
    const m = gems.current, pm = plates.current;
    if (!m || !pm) return;
    const L = target.current, c = cur.current;
    const k = 1 - Math.exp(-9 * Math.min(dt, 0.05));
    for (let i = 0; i < count; i++) {
      const s = L.slots[i];
      c.gx[i] += (s.x - c.gx[i]) * k;
      c.gz[i] += (s.z - c.gz[i]) * k;
      c.gs[i] += (Math.max(0.55, L.scale) - c.gs[i]) * k;
      o.position.set(cx + c.gx[i], 0.04, FIELD_Z + c.gz[i]);
      o.rotation.set(0, i * 0.7 + rt.time * (s.leftover ? 1.5 : 0.25), 0);
      o.scale.setScalar(c.gs[i]);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      const bob = s.leftover ? Math.sin(rt.time * 6 + i) * 0.04 : 0;
      o.position.y += bob;
    }
    for (let i = 0; i < count; i++) {
      const p = L.plates[i];
      c.px[i] += ((p ? p.x : 0) - c.px[i]) * k;
      c.pz[i] += ((p ? p.z : 0) - c.pz[i]) * k;
      c.ps[i] += ((p ? p.size : 0) - c.ps[i]) * k;
      o.position.set(cx + c.px[i], 0.02, FIELD_Z + c.pz[i]);
      o.rotation.set(0, 0, 0);
      o.scale.set(c.ps[i] * 2, 1, c.ps[i] * 2);
      o.updateMatrix();
      pm.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    pm.instanceMatrix.needsUpdate = true;
    void active;
  });

  return (
    <>
      <instancedMesh ref={gems} args={[gemGeo, undefined, count]} frustumCulled={false}>
        <meshLambertMaterial emissive="#2a2a44" />
      </instancedMesh>
      <instancedMesh ref={plates} args={[plateGeo, undefined, count]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
    </>
  );
}

export default function CrystalMachine({ station, worldId }: { station: CrystalStation; worldId: number }) {
  const def = useGame((s) => (s.ready ? getPuzzle(station.puzzleId) : null));
  const solved = useGame((s) => s.progress.flags[flagKey(worldId, `puzzle:${station.puzzleId}`)] === true);
  const value = useGame((s) => (s.puzzle?.id === station.puzzleId ? s.puzzle.value : 0));
  const orb = useRef<Mesh>(null);
  const ring = useRef<Group>(null);
  const orbMat = useRef<MeshBasicMaterial>(null);
  const [x, y, z] = station.pos;

  useInteractable(
    def
      ? {
          id: `machine:${station.puzzleId}`,
          pos: station.pos,
          radius: 4.6,
          prompt: () => (solved ? "Press E to review how it works" : `Press E to use the ${def.title}`),
          onInteract: () => {
            if (!solved) {
              rt.focus = { pos: new Vector3(x, y + 9, z + 16), look: new Vector3(x, y + 0.5, z + 6) };
            }
            actions.openCrystalPuzzle(station.puzzleId);
          },
        }
      : null,
  );

  useFrame(() => {
    if (orb.current) {
      orb.current.rotation.y = rt.time * (solved ? 2.4 : 0.8);
      orb.current.position.y = 3.3 + Math.sin(rt.time * 2) * 0.1;
    }
    if (ring.current) ring.current.rotation.y = -rt.time * (solved ? 1.4 : 0.3);
    orbMat.current?.color.set(solved ? "#7dffb0" : value ? "#ffd23f" : "#ff6b6b");
  });

  const reward = def?.rewardCoins ?? 0;
  const rewards = useMemo<Vec3[]>(
    () => Array.from({ length: reward }, (_, i) => [x + (i - (reward - 1) / 2) * 1.3, y + 1.0, z + 7.6] as Vec3),
    [reward, x, y, z],
  );

  if (!def) return null;
  const a = def.numbers[0], b = def.numbers[1];
  const g = solved ? answerOf(def) : value;

  return (
    <>
      <group position={[x, y, z]}>
        {/* ancient machine */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[1.5, 1.8, 0.8, 10]} />
          <meshLambertMaterial color="#6f6a85" />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.55, 0.8, 1.8, 8]} />
          <meshLambertMaterial color="#8c86a8" />
        </mesh>
        <mesh ref={orb} position={[0, 3.3, 0]}>
          <octahedronGeometry args={[0.7, 0]} />
          <meshBasicMaterial ref={orbMat} color="#ff6b6b" />
        </mesh>
        <group ref={ring} position={[0, 3.3, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.cos((i / 3) * Math.PI * 2) * 1.3, 0, Math.sin((i / 3) * Math.PI * 2) * 1.3]}>
              <boxGeometry args={[0.25, 1.2, 0.25]} />
              <meshLambertMaterial color="#8c86a8" />
            </mesh>
          ))}
        </group>
        {/* the two piles */}
        <CrystalField count={a} baseColor={BLUE} side={-1} groupSize={g} active={value > 0} />
        <CrystalField count={b} baseColor={GREEN} side={1} groupSize={g} active={value > 0} />
        {/* floating number tags */}
        <Html position={[-3.9, 2.6, FIELD_Z]} center distanceFactor={11} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <div className="worldTag blue">{a} blue</div>
        </Html>
        <Html position={[3.9, 2.6, FIELD_Z]} center distanceFactor={11} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <div className="worldTag green">{b} green</div>
        </Html>
        {value > 0 && (
          <Html position={[0, 4.6, 0]} center distanceFactor={11} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
            <div className="worldTag big">Groups of {value}</div>
          </Html>
        )}
      </group>
      {solved && <RewardGems puzzleId={station.puzzleId} positions={rewards} />}
    </>
  );
}
