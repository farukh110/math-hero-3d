"use client";

import { useMemo } from "react";
import { Fog } from "three";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { LevelDef } from "@/types/level";
import type { QualityConfig } from "@/systems/quality";
import StaticGeometry from "@/components/environment/StaticGeometry";
import Decor from "@/components/environment/Decor";
import Scenery from "@/components/environment/Scenery";
import SkyDome from "@/components/environment/Sky";
import Lighting from "@/components/environment/Lighting";
import { MovingPlatform, Sweeper } from "@/components/environment/Movers";
import PlayerController from "@/components/character/PlayerController";
import FollowCamera from "@/components/camera/FollowCamera";
import Collectibles from "@/components/interactions/Collectibles";
import PickupFx from "@/components/interactions/PickupFx";
import Lever from "@/components/interactions/Lever";
import Gate from "@/components/interactions/Gate";
import Checkpoint from "@/components/interactions/Checkpoint";
import GoalPortal from "@/components/interactions/GoalPortal";
import CrystalMachine from "@/components/puzzles/CrystalMachine";
import LaneStation from "@/components/puzzles/LaneStation";

/** Builds one level (data) into physics + visuals. Everything here unmounts on world change. */
export default function WorldScene({ level, quality }: { level: LevelDef; quality: QualityConfig }) {
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const t = level.theme;
    scene.fog = new Fog(t.fog, t.fogNear * quality.fog, t.fogFar * quality.fog);
    scene.background = null;
    return () => {
      scene.fog = null;
    };
  }, [scene, level, quality.fog]);

  const coins = useMemo(() => level.coins.map((pos, i) => ({ id: `c${i}`, pos })), [level]);
  const stars = useMemo(() => level.stars.map((pos, i) => ({ id: `s${i}`, pos })), [level]);

  return (
    <>
      <SkyDome theme={level.theme} />
      <Lighting level={level} quality={quality} />
      <Scenery level={level} quality={quality} />
      <StaticGeometry boxes={level.boxes} receiveShadow={quality.shadows} />
      <Decor decor={level.decor} quality={quality} seed={level.id} />
      {level.movers?.map((m) => <MovingPlatform key={m.id} def={m} />)}
      {level.sweepers?.map((s) => <Sweeper key={s.id} def={s} />)}
      {level.levers?.map((l) => <Lever key={l.id} def={l} worldId={level.id} />)}
      {level.gates.map((g) => <Gate key={g.id} def={g} worldId={level.id} />)}
      {level.checkpoints.map((c) => <Checkpoint key={c.id} def={c} />)}
      {level.stations.map((st) =>
        st.type === "crystal" ? (
          <CrystalMachine key={st.puzzleId} station={st} worldId={level.id} />
        ) : (
          <LaneStation key={st.puzzleId} station={st} worldId={level.id} quality={quality} />
        ),
      )}
      <Collectibles kind="coin" items={coins} />
      <Collectibles kind="star" items={stars} />
      <GoalPortal level={level} />
      <PickupFx density={quality.particles} />
      <PlayerController level={level} />
      <FollowCamera />
    </>
  );
}
