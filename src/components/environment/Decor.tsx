"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry, Color, ConeGeometry, CylinderGeometry, DodecahedronGeometry, InstancedMesh,
  Object3D, OctahedronGeometry, SphereGeometry,
} from "three";
import type { DecorDef, Vec3 } from "@/types/level";
import type { QualityConfig } from "@/systems/quality";
import { rng } from "@/data/levels/helpers";

interface Item {
  pos: Vec3;
  scale: [number, number, number];
  rotY: number;
  color?: string;
}

function InstancedSet({ items, geometry, children, castShadow = false }: { items: Item[]; geometry: BufferGeometry; children: React.ReactNode; castShadow?: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color();
    items.forEach((it, i) => {
      o.position.set(...it.pos);
      o.rotation.set(0, it.rotY, 0);
      o.scale.set(...it.scale);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      if (it.color) {
        c.set(it.color);
        m.setColorAt(i, c);
      }
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  if (items.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} castShadow={castShadow} frustumCulled={false}>
      {children}
    </instancedMesh>
  );
}

function thin<T>(arr: T[], factor: number): T[] {
  const n = Math.max(0, Math.round(arr.length * factor));
  if (n >= arr.length) return arr;
  const step = arr.length / Math.max(1, n);
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)]);
}

function disc(seed: number, center: Vec3, radius: number, count: number): Vec3[] {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * radius;
    return [center[0] + Math.cos(a) * d, center[1], center[2] + Math.sin(a) * d] as Vec3;
  });
}

export default function Decor({ decor, quality, seed = 1 }: { decor: DecorDef; quality: QualityConfig; seed?: number }) {
  const k = quality.decor;

  const geos = useMemo(
    () => ({
      trunk: new CylinderGeometry(0.28, 0.4, 2, 6),
      leafLow: new ConeGeometry(1.7, 2.6, 7),
      leafHigh: new ConeGeometry(1.2, 2.2, 7),
      rock: new DodecahedronGeometry(1, 0),
      tuft: new ConeGeometry(0.1, 0.55, 4),
      flower: new SphereGeometry(0.13, 6, 5),
      crystal: new OctahedronGeometry(1, 0),
      pillar: new CylinderGeometry(0.55, 0.65, 1, 10),
      torch: new CylinderGeometry(0.1, 0.14, 1.1, 5),
      flame: new ConeGeometry(0.22, 0.6, 5),
    }),
    [],
  );

  const items = useMemo(() => {
    const r = rng(seed * 97);
    const trees = thin(decor.trees ?? [], k);
    const treeItems: Item[] = trees.map((p) => {
      const s = 0.8 + r() * 0.8;
      return { pos: [p[0], p[1] + s, p[2]], scale: [s, s, s], rotY: r() * 6 };
    });
    const leafLow: Item[] = trees.map((p, i) => {
      const s = treeItems[i].scale[0];
      return { pos: [p[0], p[1] + 2 * s + 0.9 * s, p[2]], scale: [s, s, s], rotY: 0, color: i % 3 === 0 ? "#2f9e5b" : "#3db563" };
    });
    const leafHigh: Item[] = trees.map((p, i) => {
      const s = treeItems[i].scale[0];
      return { pos: [p[0], p[1] + 2 * s + 2.4 * s, p[2]], scale: [s, s, s], rotY: 0, color: "#52c97a" };
    });
    const rocks: Item[] = thin(decor.rocks ?? [], Math.max(0.5, k)).map((p) => {
      const s = 0.6 + r() * 1.1;
      return { pos: [p[0], p[1] + s * 0.45, p[2]], scale: [s * 1.2, s * 0.8, s], rotY: r() * 6, color: "#8c8a9a" };
    });
    const tufts: Item[] = [];
    for (const g of decor.grass ?? []) {
      for (const p of thin(disc(seed + tufts.length, g.center, g.radius, g.count), k)) {
        const s = 0.7 + r() * 0.8;
        tufts.push({ pos: [p[0], p[1] + 0.25 * s, p[2]], scale: [s, s, s], rotY: r() * 6, color: r() > 0.5 ? "#5fbf4a" : "#86d65f" });
      }
    }
    const flowerCols = ["#ff6b9d", "#ffd23f", "#ffffff", "#b388ff", "#ff8a4c"];
    const flowers: Item[] = [];
    for (const g of decor.flowers ?? []) {
      for (const p of thin(disc(seed * 3 + flowers.length, g.center, g.radius, g.count), k)) {
        flowers.push({ pos: [p[0], p[1] + 0.22, p[2]], scale: [1, 1, 1], rotY: 0, color: flowerCols[Math.floor(r() * flowerCols.length)] });
      }
    }
    const crystals: Item[] = thin(decor.crystals ?? [], Math.max(0.5, k)).map((c) => ({
      pos: c.pos, scale: [0.45 * c.scale, 1.1 * c.scale, 0.45 * c.scale], rotY: r() * 6, color: c.color,
    }));
    const pillars: Item[] = (decor.pillars ?? []).map((p) => ({ pos: [p[0], p[1] + 2.5, p[2]], scale: [1, 5, 1], rotY: 0, color: "#f4efe6" }));
    const torches: Item[] = (decor.torches ?? []).map((p) => ({ pos: [p[0], p[1], p[2]], scale: [1, 1, 1], rotY: 0, color: "#5b4636" }));
    const flames: Item[] = (decor.torches ?? []).map((p) => ({ pos: [p[0], p[1] + 0.75, p[2]], scale: [1, 1, 1], rotY: 0, color: "#ffb347" }));
    return { treeItems, leafLow, leafHigh, rocks, tufts, flowers, crystals, pillars, torches, flames };
  }, [decor, k, seed]);

  return (
    <>
      <InstancedSet items={items.treeItems.map((t) => ({ ...t, color: "#7a5230" }))} geometry={geos.trunk} castShadow>
        <meshLambertMaterial />
      </InstancedSet>
      <InstancedSet items={items.leafLow} geometry={geos.leafLow} castShadow>
        <meshLambertMaterial />
      </InstancedSet>
      <InstancedSet items={items.leafHigh} geometry={geos.leafHigh}>
        <meshLambertMaterial />
      </InstancedSet>
      <InstancedSet items={items.rocks} geometry={geos.rock}>
        <meshLambertMaterial flatShading />
      </InstancedSet>
      <InstancedSet items={items.tufts} geometry={geos.tuft}>
        <meshLambertMaterial />
      </InstancedSet>
      <InstancedSet items={items.flowers} geometry={geos.flower}>
        <meshBasicMaterial />
      </InstancedSet>
      <InstancedSet items={items.crystals} geometry={geos.crystal}>
        <meshBasicMaterial />
      </InstancedSet>
      <InstancedSet items={items.pillars} geometry={geos.pillar}>
        <meshLambertMaterial />
      </InstancedSet>
      <InstancedSet items={items.torches} geometry={geos.torch}>
        <meshLambertMaterial />
      </InstancedSet>
      <InstancedSet items={items.flames} geometry={geos.flame}>
        <meshBasicMaterial />
      </InstancedSet>
    </>
  );
}
