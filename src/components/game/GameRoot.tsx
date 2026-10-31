"use client";

import { useEffect } from "react";
import GameCanvas from "./GameCanvas";
import KeyboardController from "./KeyboardController";
import MainMenu from "@/components/menus/MainMenu";
import Overlays from "@/components/menus/Overlays";
import LoadingScreen from "@/components/menus/LoadingScreen";
import { Learn, Victory, WorldComplete, WorldSelect } from "@/components/menus/Screens";
import Hud from "@/components/hud/Hud";
import { CrystalPanel, IntroDialog, ResultCard } from "@/components/hud/PuzzleUi";
import { actions, gameStore, useGame } from "@/systems/progression/gameStore";
import { configureAudio, stopMusic } from "@/systems/audio/audio";
import { rt } from "@/systems/runtime/runtime";
import { LEVELS } from "@/data/levels";

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function GameRoot() {
  const ready = useGame((s) => s.ready);
  const screen = useGame((s) => s.screen);
  const webglOk = useGame((s) => s.webglOk);
  const loading = useGame((s) => s.loading);
  const settings = useGame((s) => s.settings);

  useEffect(() => {
    actions.setWebgl(hasWebGL());
    actions.hydrate();
    // Read-only debug handle for troubleshooting: add ?debug to the address.
    if (new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as Record<string, unknown>).__mathGame = { rt, store: gameStore, actions, LEVELS };
    }
    return () => stopMusic();
  }, []);

  useEffect(() => {
    configureAudio({ sfx: settings.sfxVolume, music: settings.musicVolume, muted: settings.muted });
  }, [settings.sfxVolume, settings.musicVolume, settings.muted]);

  if (!ready) return null;

  const showWorld = (screen === "playing" || screen === "worldComplete" || screen === "victory") && webglOk;

  return (
    <div className="app">
      <KeyboardController />
      {!webglOk && screen !== "menu" && screen !== "learn" && (
        <div className="fallback panel">
          <div>
            <h2>3D graphics are not available</h2>
            <p>This browser could not start WebGL. Try Chrome or Edge, update the graphics driver, or enable hardware acceleration in the browser settings.</p>
            <button className="btn blue" onClick={() => actions.exitToMenu()}>Back to the menu</button>
          </div>
        </div>
      )}
      {showWorld && (
        <div className="canvasWrap">
          <GameCanvas />
        </div>
      )}
      {screen === "menu" && <MainMenu />}
      {screen === "worlds" && <WorldSelect />}
      {screen === "learn" && <Learn />}
      {screen === "playing" && webglOk && (
        <>
          <Hud />
          <CrystalPanel />
          <IntroDialog />
          <ResultCard />
        </>
      )}
      {screen === "worldComplete" && <WorldComplete />}
      {screen === "victory" && <Victory />}
      {screen === "playing" && loading && <LoadingScreen />}
      <Overlays />
    </div>
  );
}
