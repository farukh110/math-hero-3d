"use client";

import { useEffect, useMemo, useRef } from "react";
import { Color, DirectionalLight, HemisphereLight } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { LevelDef } from "@/types/level";
import type { QualityConfig } from "@/systems/quality";
import { rt } from "@/systems/runtime/runtime";
import { useGame } from "@/systems/progression/gameStore";

interface Props {
  level: LevelDef;
  quality: QualityConfig;
}

/** One hemisphere light + ONE directional light that follows the player (small shadow box). */
export default function Lighting({ level, quality }: Props) {
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const t = level.theme;
  // Solving puzzles "lights up" the world a little: +12% per solved puzzle.
  const solved = useGame((s) => Object.keys(s.progress.flags).filter((k) => k.startsWith(`${level.id}:puzzle:`)).length);
  const boost = useRef(0);
  // hemisphere: lifted sky colour above, darker copy below, so every theme stays readable
  const [skyCol, ground] = useMemo(() => {
    const c = new Color(t.skyBottom).lerp(new Color("#ffffff"), 0.35);
    return [c.getStyle(), c.clone().multiplyScalar(0.62).getStyle()];
  }, [t.skyBottom]);
  const scene = useThree((st) => st.scene);

  useEffect(() => {
    const target = sun.current?.target;
    if (!target) return;
    scene.add(target);
    return () => {
      scene.remove(target);
    };
  }, [scene]);

  useEffect(() => {
    const s = sun.current;
    if (s) {
      s.shadow.camera.near = 1;
      s.shadow.camera.far = 90;
      const r = quality.shadowRange;
      s.shadow.camera.left = -r;
      s.shadow.camera.right = r;
      s.shadow.camera.top = r;
      s.shadow.camera.bottom = -r;
      s.shadow.camera.updateProjectionMatrix();
      s.shadow.bias = -0.0008;
      s.shadow.normalBias = 0.04;
    }
  }, [quality.shadowRange]);

  useFrame((_, dt) => {
    const s = sun.current;
    if (s) {
      s.position.set(rt.pos.x + t.sunDir[0] * 30, rt.pos.y + t.sunDir[1] * 30, rt.pos.z + t.sunDir[2] * 30);
      s.target.position.copy(rt.pos);
      s.target.updateMatrixWorld();
    }
    boost.current += (solved * 0.12 - boost.current) * Math.min(1, dt * 1.5);
    if (hemi.current) hemi.current.intensity = t.ambient * (1 + boost.current);
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={[skyCol, ground, t.ambient]} />
      <directionalLight
        ref={sun}
        color={t.sunColor}
        intensity={t.sun}
        castShadow={quality.shadows}
        shadow-mapSize={[quality.shadowMapSize || 512, quality.shadowMapSize || 512]}
      />
    </>
  );
}
