"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Color, CylinderGeometry, ExtrudeGeometry, InstancedMesh, Matrix4, Object3D, OctahedronGeometry, Shape } from "three";
import { useFrame } from "@react-three/fiber";
import type { CollectibleKind, Vec3 } from "@/types/level";
import { actions, useGame } from "@/systems/progression/gameStore";
import { rt } from "@/systems/runtime/runtime";
import { pickupFx } from "./PickupFx";

export interface CollectibleItem {
  id: string;
  pos: Vec3;
}

const COLORS: Record<CollectibleKind, string> = { coin: "#ffd23f", star: "#ff9f1c", gem: "#4fc3ff" };

function makeStar(): ExtrudeGeometry {
  const sh = new Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.5 : 0.22;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) sh.moveTo(x, y);
    else sh.lineTo(x, y);
  }
  sh.closePath();
  const g = new ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false });
  g.translate(0, 0, -0.07);
  return g;
}

/**
 * One InstancedMesh per collectible kind. Pickup is detected in the frame loop against the
 * mutable player position; the saved list decides which instances are still alive.
 */
export default function Collectibles({ kind, items, pop = false }: { kind: CollectibleKind; items: CollectibleItem[]; pop?: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const collected = useGame((s) => s.progress.collected[String(s.worldId)]);
  const alive = useRef<boolean[]>([]);
  const born = useRef(0);

  const geometry = useMemo(() => {
    if (kind === "coin") {
      const g = new CylinderGeometry(0.34, 0.34, 0.09, 14);
      g.rotateX(Math.PI / 2);
      return g;
    }
    if (kind === "star") return makeStar();
    const g = new OctahedronGeometry(0.34, 0);
    g.scale(0.75, 1.25, 0.75);
    return g;
  }, [kind]);

  useLayoutEffect(() => {
    alive.current = items.map((it) => !(collected ?? []).includes(it.id));
    const m = ref.current;
    if (m) {
      const c = new Color(COLORS[kind]);
      items.forEach((_, i) => m.setColorAt(i, c));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [items, collected, kind]);

  useEffect(() => {
    born.current = rt.time;
  }, [items]);

  const tmp = useMemo(() => ({ o: new Object3D(), zero: new Matrix4().makeScale(0, 0, 0) }), []);

  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const t = rt.time;
    const k = kind === "star" ? 1.5 : kind === "gem" ? 1.1 : 1;
    const pickR = kind === "star" ? 1.5 : 1.15;
    const popT = pop ? Math.min(1, (t - born.current) / 0.6) : 1;
    const popScale = pop ? 1 + Math.sin(popT * Math.PI) * 0.4 : 1;
    for (let i = 0; i < items.length; i++) {
      if (!alive.current[i]) {
        m.setMatrixAt(i, tmp.zero);
        continue;
      }
      const p = items[i].pos;
      const bob = Math.sin(t * 2.2 + i) * 0.12;
      const o = tmp.o;
      o.position.set(p[0], p[1] + bob + (pop ? (1 - popT) * 1.5 : 0), p[2]);
      o.rotation.set(0, t * 2.4 + i, 0);
      o.scale.setScalar(k * popT * popScale);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      // pickup test (squared distance, player centre is ~0.85 above the feet)
      if (popT >= 1 && !rt.locked) {
        const dx = rt.pos.x - p[0], dy = rt.pos.y - p[1], dz = rt.pos.z - p[2];
        if (dx * dx + dy * dy + dz * dz < pickR * pickR) {
          alive.current[i] = false;
          pickupFx.emit(p, COLORS[kind]);
          actions.collect(items[i].id, kind);
        }
      }
    }
    m.instanceMatrix.needsUpdate = true;
  });

  if (items.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} frustumCulled={false}>
      <meshBasicMaterial />
    </instancedMesh>
  );
}

