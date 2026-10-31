"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CanvasTexture, Color, InstancedBufferAttribute, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, SphereGeometry } from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { LaneStation as LaneDef, Vec3 } from "@/types/level";
import { actions, getPuzzle, useGame } from "@/systems/progression/gameStore";
import { flagKey } from "@/data/levels";
import { laneStore } from "@/systems/puzzles/laneStore";
import { rt } from "@/systems/runtime/runtime";
import { playSfx } from "@/systems/audio/audio";
import { useInteractable } from "@/components/interactions/useInteractable";
import type { QualityConfig } from "@/systems/quality";
import RewardGems from "./RewardGems";

const FOUNTAIN_COLORS = ["#3db4ff", "#ff6fb5", "#5fe08a"];
const GOLD = "#ffc400";
const FRESH = "#d9d0bd";
const VISITED = "#f4ecd9";
const CELLS = 8;

let atlas: CanvasTexture | null = null;
/** Numbers 0-63 drawn once into a local canvas (system font, no downloads). */
function getAtlas(): CanvasTexture {
  if (atlas) return atlas;
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size * CELLS;
  const g = c.getContext("2d")!;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let i = 0; i < CELLS * CELLS; i++) {
    const x = (i % CELLS) * size, y = Math.floor(i / CELLS) * size;
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.roundRect(x + 3, y + 3, size - 6, size - 6, 12);
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = "#7d7360";
    g.stroke();
    g.fillStyle = "#3b3326";
    g.font = "bold 34px 'Trebuchet MS', 'Segoe UI', Arial, sans-serif";
    g.fillText(String(i), x + size / 2, y + size / 2 + 2);
  }
  atlas = new CanvasTexture(c);
  atlas.anisotropy = 4;
  return atlas;
}

function makeTileMaterial(): MeshBasicMaterial {
  const mat = new MeshBasicMaterial({ map: getAtlas(), alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aCell;")
      .replace("#include <uv_vertex>", `#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = (vMapUv + vec2(mod(aCell, ${CELLS}.0), ${CELLS - 1}.0 - floor(aCell / ${CELLS}.0))) / ${CELLS}.0;\n#endif`);
  };
  return mat;
}

const DROPS = 14;

function Fountain({ x, z, color, interval, fire, particles, solved }: {
  x: number; z: number; color: string; interval: number;
  fire: React.MutableRefObject<number>; particles: number; solved: boolean;
}) {
  const drops = useRef<InstancedMesh>(null);
  const water = useRef<Mesh>(null);
  const dropGeo = useMemo(() => new SphereGeometry(0.1, 6, 5), []);
  const o = useMemo(() => new Object3D(), []);
  const n = Math.max(5, Math.round(DROPS * particles));
  const mats = useMemo(() => ({ water: new MeshBasicMaterial({ color: "#7ec8ff" }), drop: new MeshBasicMaterial({ color }), glow: new Color(color) }), [color]);
  const base = useMemo(() => new Color("#6fb6ee"), []);
  const mix = useMemo(() => new Color(), []);

  useFrame(() => {
    const m = drops.current;
    if (!m) return;
    // celebratory loop once solved
    const t = solved ? (rt.time % 1.8) / 1.1 : (rt.time - fire.current) / 1.1;
    for (let i = 0; i < n; i++) {
      if (t < 0 || t > 1) {
        o.scale.setScalar(0);
      } else {
        const a = (i / n) * Math.PI * 2;
        const spread = i % 3 === 0 ? 0 : 1.6 + (i % 4) * 0.35;
        const v0 = 7.4 + (i % 3);
        const tt = t * 1.25;
        o.position.set(x + Math.cos(a) * spread * tt, 0.9 + v0 * tt - 6 * tt * tt * 1.0, z + Math.sin(a) * spread * tt);
        o.scale.setScalar(1);
      }
      o.rotation.set(0, 0, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (water.current) {
      const glow = Math.max(0, 1 - (rt.time - fire.current) / 0.9);
      mix.copy(base).lerp(mats.glow, solved ? 0.7 : glow);
      (water.current.material as MeshBasicMaterial).color.copy(mix);
    }
  });

  return (
    <group>
      <mesh position={[x, 0.3, z]}>
        <cylinderGeometry args={[1.35, 1.5, 0.6, 14]} />
        <meshLambertMaterial color="#cfc7b6" />
      </mesh>
      <mesh ref={water} position={[x, 0.62, z]} rotation={[-Math.PI / 2, 0, 0]} material={mats.water}>
        <circleGeometry args={[1.15, 16]} />
      </mesh>
      <mesh position={[x, 0.9, z]}>
        <cylinderGeometry args={[0.12, 0.18, 0.9, 8]} />
        <meshLambertMaterial color="#b9b09c" />
      </mesh>
      <instancedMesh ref={drops} args={[dropGeo, mats.drop, n]} frustumCulled={false} />
      <Html position={[x, 3.4, z]} center distanceFactor={12} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <div className="worldTag" style={{ background: color }}>every {interval}</div>
      </Html>
    </group>
  );
}

export default function LaneStation({ station, worldId, quality }: { station: LaneDef; worldId: number; quality: QualityConfig }) {
  const def = useGame((s) => (s.ready ? getPuzzle(station.puzzleId) : null));
  const solved = useGame((s) => s.progress.flags[flagKey(worldId, `puzzle:${station.puzzleId}`)] === true);
  const [cx, cy, cz] = station.pos;
  const steps = def?.steps ?? 0;
  const nums = def?.numbers ?? [];
  const sp = station.spacing;
  const x0 = cx - (steps * sp) / 2;

  const tiles = useRef<InstancedMesh>(null);
  const numsKey = nums.join(",");
  const fire = useMemo(() => numsKey.split(",").map(() => ({ current: -99 })), [numsKey]);
  const lastStep = useRef(0);
  const lanePos = useMemo<Vec3>(() => [9999, 9999, 9999], []);
  const mech = useRef<Object3D>(null);

  const tileMat = useMemo(() => (typeof document === "undefined" ? null : makeTileMaterial()), []);
  const tileGeo = useMemo(() => {
    const g = new PlaneGeometry(sp * 0.88, 1.5);
    g.rotateX(-Math.PI / 2);
    const cell = new Float32Array(Math.max(1, steps));
    for (let i = 0; i < steps; i++) cell[i] = i + 1;
    g.setAttribute("aCell", new InstancedBufferAttribute(cell, 1));
    return g;
  }, [sp, steps]);

  const colorFor = useMemo(() => {
    const cols = FOUNTAIN_COLORS.map((c) => new Color(c));
    const tmp = new Color();
    return (m: number, count: number): Color => {
      if (m === 0) return tmp.set(VISITED);
      const fired = [] as number[];
      for (let i = 0; i < count; i++) if (m & (1 << i)) fired.push(i);
      if (fired.length === count) return tmp.set(GOLD);
      tmp.setRGB(0, 0, 0);
      fired.forEach((i) => tmp.add(cols[i].clone().multiplyScalar(1 / fired.length)));
      return tmp;
    };
  }, []);

  useLayoutEffect(() => {
    const m = tiles.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color(FRESH);
    for (let i = 0; i < steps; i++) {
      o.position.set(x0 + sp * (i + 0.5), cy + 0.09, cz);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [steps, sp, x0, cy, cz]);

  useEffect(
    () => () => {
      if (laneStore.get().puzzleId === station.puzzleId) laneStore.set({ puzzleId: null, step: 0 });
    },
    [station.puzzleId],
  );

  useInteractable(
    def
      ? {
          id: `lane:${station.puzzleId}`,
          pos: lanePos,
          radius: 1.6,
          prompt: () => (solved || lastStep.current === 0 ? null : `Press E to lock in step ${lastStep.current}`),
          onInteract: () => {
            if (lastStep.current > 0) {
              playSfx("interact");
              actions.attempt(station.puzzleId, lastStep.current);
            }
          },
        }
      : null,
  );

  useFrame(() => {
    if (!def || rt.locked) return;
    const u = (rt.pos.x - x0) / sp;
    const onLane = Math.abs(rt.pos.z - cz) < 1.2 && u >= 0 && u < steps && Math.abs(rt.pos.y - (cy + 0.85)) < 1.4;
    let step = lastStep.current;
    if (!onLane) step = 0;
    else if (rt.grounded) step = Math.floor(u) + 1;

    if (step !== lastStep.current) {
      lastStep.current = step;
      laneStore.set({ puzzleId: step > 0 ? station.puzzleId : null, step });
      if (step > 0) {
        // real maths: a fountain fires when the stone number is a multiple of its interval
        let m = 0;
        nums.forEach((n, i) => {
          if (step % n === 0) {
            m |= 1 << i;
            fire[i].current = rt.time;
          }
        });
        const t = tiles.current;
        if (t) {
          t.setColorAt(step - 1, colorFor(m, nums.length));
          if (t.instanceColor) t.instanceColor.needsUpdate = true;
        }
        playSfx("step");
      }
    }
    if (step > 0) {
      lanePos[0] = x0 + sp * (step - 0.5);
      lanePos[1] = cy;
      lanePos[2] = cz;
    } else {
      lanePos[0] = 9999;
    }
    if (mech.current) mech.current.rotation.y = rt.time * (solved ? 2 : 0.5);
  });

  const rewards = useMemo<Vec3[]>(() => {
    const n = def?.rewardCoins ?? 0;
    return Array.from({ length: n }, (_, i) => [cx + (i - (n - 1) / 2) * 1.4, cy + 1.0, cz + station.fountainZ / 2] as Vec3);
  }, [def?.rewardCoins, cx, cy, cz, station.fountainZ]);

  if (!def || !tileMat) return null;
  const fxz = cz + station.fountainZ;
  const spreadF = 7;
  const quiet = quality.particles;

  return (
    <>
      <instancedMesh ref={tiles} args={[tileGeo, tileMat, steps]} frustumCulled={false} />
      {nums.map((n, i) => (
        <Fountain
          key={i} x={cx + (i - (nums.length - 1) / 2) * spreadF} z={fxz} color={FOUNTAIN_COLORS[i]} interval={n}
          fire={fire[i]} particles={quiet} solved={solved}
        />
      ))}
      {/* the ancient synchronisation mechanism */}
      <group position={[cx, cy, fxz - 2.9]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.9, 1.1, 1.2, 8]} />
          <meshLambertMaterial color="#8c86a8" />
        </mesh>
        <object3D ref={mech}>
          <mesh position={[0, 2.0, 0]}>
            <octahedronGeometry args={[0.6, 0]} />
            <meshBasicMaterial color={solved ? "#7dffb0" : "#ff8a6b"} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos((i / 4) * Math.PI * 2) * 1.1, 2.0, Math.sin((i / 4) * Math.PI * 2) * 1.1]}>
              <boxGeometry args={[0.18, 0.9, 0.18]} />
              <meshLambertMaterial color="#b9b0d6" />
            </mesh>
          ))}
        </object3D>
      </group>
      {solved && <RewardGems puzzleId={station.puzzleId} positions={rewards} />}
    </>
  );
}

