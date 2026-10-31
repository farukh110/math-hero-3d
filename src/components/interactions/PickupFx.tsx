"use client";

import { useMemo, useRef } from "react";
import { Color, InstancedMesh, MeshBasicMaterial, Object3D, OctahedronGeometry } from "three";
import { useFrame } from "@react-three/fiber";
import type { Vec3 } from "@/types/level";

const SPARKS_PER_BURST = 8;
const BURSTS = 6;
const LIFE = 0.55;

interface Burst {
  x: number; y: number; z: number; t: number; color: Color;
}

const queue: { pos: Vec3; color: string }[] = [];

/** Fire-and-forget sparkle burst, drawn by <PickupFx/> from a fixed pool. */
export const pickupFx = {
  emit(pos: Vec3, color: string): void {
    queue.push({ pos, color });
  },
};

/** Pool of tiny sparks in a single InstancedMesh (no allocation per pickup). */
export default function PickupFx({ density = 1 }: { density?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new OctahedronGeometry(0.09, 0), []);
  const mat = useMemo(() => new MeshBasicMaterial(), []);
  const state = useMemo(
    () => ({
      bursts: Array.from({ length: BURSTS }, (): Burst => ({ x: 0, y: 0, z: 0, t: 99, color: new Color() })),
      next: 0,
      o: new Object3D(),
    }),
    [],
  );
  const sparks = Math.max(3, Math.round(SPARKS_PER_BURST * density));

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    while (queue.length) {
      const q = queue.pop()!;
      const b = state.bursts[state.next++ % BURSTS];
      b.x = q.pos[0]; b.y = q.pos[1]; b.z = q.pos[2]; b.t = 0; b.color.set(q.color);
    }
    const o = state.o;
    for (let bi = 0; bi < BURSTS; bi++) {
      const b = state.bursts[bi];
      b.t += dt;
      for (let i = 0; i < SPARKS_PER_BURST; i++) {
        const idx = bi * SPARKS_PER_BURST + i;
        if (b.t > LIFE || i >= sparks) {
          o.scale.setScalar(0);
        } else {
          const a = (i / sparks) * Math.PI * 2;
          const r = b.t * 3.2;
          o.position.set(b.x + Math.cos(a) * r, b.y + b.t * 2 - b.t * b.t * 4, b.z + Math.sin(a) * r);
          o.scale.setScalar(1 - b.t / LIFE);
        }
        o.rotation.set(b.t * 6, b.t * 4, 0);
        o.updateMatrix();
        m.setMatrixAt(idx, o.matrix);
        m.setColorAt(idx, b.color);
      }
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geo, mat, BURSTS * SPARKS_PER_BURST]} frustumCulled={false} />;
}
