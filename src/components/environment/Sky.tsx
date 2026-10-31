"use client";

import { useMemo, useRef } from "react";
import { Color, Float32BufferAttribute, Mesh, SphereGeometry } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThemeDef } from "@/types/level";

/** Gradient sky dome (vertex colours, no texture), glued to the camera. */
export default function SkyDome({ theme }: { theme: ThemeDef }) {
  const ref = useRef<Mesh>(null);
  const camera = useThree((s) => s.camera);

  const geometry = useMemo(() => {
    const g = new SphereGeometry(300, 16, 12);
    const top = new Color(theme.sky);
    const bottom = new Color(theme.skyBottom);
    const c = new Color();
    const colors: number[] = [];
    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = g.attributes.position.getY(i) / 300; // -1..1
      const t = Math.min(1, Math.max(0, (y + 0.15) / 0.9));
      c.copy(bottom).lerp(top, t);
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return g;
  }, [theme.sky, theme.skyBottom]);

  useFrame(() => {
    ref.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={ref} geometry={geometry} renderOrder={-10} frustumCulled={false}>
      <meshBasicMaterial vertexColors side={1} fog={false} depthWrite={false} />
    </mesh>
  );
}
