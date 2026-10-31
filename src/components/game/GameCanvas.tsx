"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import WorldScene from "./WorldScene";
import { LEVELS } from "@/data/levels";
import { actions, useGame } from "@/systems/progression/gameStore";
import { QUALITY } from "@/systems/quality";
import { GRAVITY } from "@/systems/physics/constants";
import { loadingStore } from "@/systems/progression/loadingStore";

/** Counts a few real rendered frames after the physics engine is up, then ends the loading screen. */
function ReadySignal() {
  const frames = useRef(0);
  const fired = useRef(false);
  useEffect(() => {
    loadingStore.set({ stage: "Building the world...", progress: 0.7 });
  }, []);
  useFrame(() => {
    if (fired.current) return;
    frames.current++;
    if (frames.current === 6) {
      fired.current = true;
      loadingStore.set({ stage: "Ready!", progress: 1 });
      window.setTimeout(() => actions.finishLoading(), 250);
    }
  });
  return null;
}

/** Writes the FPS straight into a DOM node (never React state). */
function FpsProbe() {
  const acc = useRef({ t: 0, n: 0 });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt;
    a.n++;
    if (a.t >= 0.5) {
      const el = document.getElementById("fps-readout");
      if (el) el.textContent = `${Math.round(a.n / a.t)} FPS`;
      a.t = 0;
      a.n = 0;
    }
  });
  return null;
}

export default function GameCanvas() {
  const worldId = useGame((s) => s.worldId);
  const sessionKey = useGame((s) => s.sessionKey);
  const quality = useGame((s) => s.settings.quality);
  const paused = useGame((s) => s.overlay !== "none");
  const q = QUALITY[quality];
  const level = LEVELS[worldId];

  return (
    <Canvas
      // new key => fresh GL context for a changed antialias setting / fresh world
      key={`${sessionKey}-${quality}`}
      dpr={[0.5, q.dpr]}
      shadows={q.shadows ? "basic" : false}
      gl={{ antialias: q.antialias, powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ fov: 58, near: 0.3, far: 420, position: [0, 6, 22] }}
      onCreated={({ gl }) => {
        loadingStore.set({ stage: "Starting physics...", progress: 0.4 });
        const dbg = (window as unknown as { __mathGame?: Record<string, unknown> }).__mathGame;
        if (dbg) dbg.gl = gl; // debug-only handle (?debug) used to read renderer statistics
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <color attach="background" args={[level.theme.fog]} />
      <Suspense fallback={null}>
        <Physics gravity={GRAVITY} paused={paused} timeStep={1 / 60}>
          <WorldScene level={level} quality={q} />
        </Physics>
        <ReadySignal />
      </Suspense>
      <FpsProbe />
    </Canvas>
  );
}
