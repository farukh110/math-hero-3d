"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, Color, Float32BufferAttribute, InstancedMesh, Object3D } from "three";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import type { BoxDef } from "@/types/level";

/** Unit box whose lower vertices are darker: cheap fake ambient occlusion / depth. */
function makeShadedBox(): BoxGeometry {
  const g = new BoxGeometry(1, 1, 1);
  const pos = g.attributes.position;
  const colors: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i); // -0.5 .. 0.5
    const k = y > 0 ? 1 : 0.62;
    colors.push(k, k, k);
  }
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return g;
}

interface Props {
  boxes: BoxDef[];
  receiveShadow: boolean;
}

/**
 * All level boxes in ONE draw call (instanced) and ONE fixed rigid body with a cuboid
 * collider per solid box. Decorative-only boxes have no collider.
 */
export default function StaticGeometry({ boxes, receiveShadow }: Props) {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => makeShadedBox(), []);
  const solid = useMemo(() => boxes.filter((b) => b.solid !== false), [boxes]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color();
    boxes.forEach((b, i) => {
      o.position.set(...b.pos);
      o.scale.set(...b.size);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      c.set(b.color);
      m.setColorAt(i, c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [boxes]);

  return (
    <>
      <instancedMesh ref={mesh} args={[geometry, undefined, boxes.length]} receiveShadow={receiveShadow} frustumCulled={false}>
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      <RigidBody type="fixed" colliders={false}>
        {solid.map((b, i) => (
          <CuboidCollider
            key={i}
            args={[b.size[0] / 2, b.size[1] / 2, b.size[2] / 2]}
            position={b.pos}
            friction={0}
            frictionCombineRule={1 /* CoefficientCombineRule.Min */}
          />
        ))}
      </RigidBody>
    </>
  );
}
