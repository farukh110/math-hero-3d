"use client";

import { actions, useGame } from "@/systems/progression/gameStore";
import { playSfx, unlockAudio } from "@/systems/audio/audio";
import { QUALITY } from "@/systems/quality";
import type { Quality } from "@/systems/save/progress";
import { LEVELS } from "@/data/levels";

export function ControlsList() {
  const rows: [string[], string][] = [
    [["W", "A", "S", "D"], "Run around"],
    [["Space"], "Jump (hold for a higher jump)"],
    [["E"], "Use things: levers, machines, stones, portals"],
    [["Mouse drag", "or", "Arrows"], "Look around"],
    [["Esc"], "Pause menu"],
  ];
  return (
    <div className="controlsGrid">
      {rows.map(([keys, text]) => (
        <div key={text} style={{ display: "contents" }}>
          <div className="keys">{keys.map((k, i) => (k === "or" ? <span key={i}>or</span> : <span key={i} className="key">{k}</span>))}</div>
          <div>{text}</div>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Confirm({ title, text, yes, onYes }: { title: string; text: string; yes: string; onYes: () => void }) {
  return (
    <Modal title={title} onClose={() => actions.closeOverlay()}>
      <p>{text}</p>
      <div className="row">
        <button className="btn dark" onClick={() => { playSfx("click"); actions.closeOverlay(); }}>Cancel</button>
        <button className="btn red" onClick={() => { playSfx("click"); onYes(); }}>{yes}</button>
      </div>
    </Modal>
  );
}

function Settings() {
  const s = useGame((st) => st.settings);
  const set = actions.updateSettings;
  const from = useGame((st) => st.overlayReturn);
  return (
    <Modal title="Settings" onClose={() => actions.closeOverlay()}>
      <div className="field"><span>Graphics</span>
        <div className="seg" style={{ gridColumn: "2 / 4" }}>
          {(["low", "medium", "high"] as Quality[]).map((q) => (
            <button key={q} className={s.quality === q ? "sel" : ""} onClick={() => { playSfx("click"); actions.setQuality(q); }}>{QUALITY[q].label}</button>
          ))}
        </div>
      </div>
      <p className="note">{QUALITY[s.quality].description} Changing graphics reloads the 3D view for a moment.</p>
      <div className="field"><span>Sound effects</span>
        <input type="range" min={0} max={1} step={0.05} value={s.sfxVolume} onChange={(e) => { unlockAudio(); set({ sfxVolume: Number(e.target.value) }); }} onPointerUp={() => playSfx("coin")} />
        <span>{Math.round(s.sfxVolume * 100)}%</span></div>
      <div className="field"><span>Music</span>
        <input type="range" min={0} max={1} step={0.05} value={s.musicVolume} onChange={(e) => { unlockAudio(); set({ musicVolume: Number(e.target.value) }); }} />
        <span>{Math.round(s.musicVolume * 100)}%</span></div>
      <div className="field"><span>Mute all</span>
        <input type="checkbox" checked={s.muted} onChange={(e) => set({ muted: e.target.checked })} style={{ width: 24, height: 24 }} /><span /></div>
      <div className="field"><span>FPS counter</span>
        <input type="checkbox" checked={s.showFps} onChange={(e) => set({ showFps: e.target.checked })} style={{ width: 24, height: 24 }} /><span /></div>
      <div className="row wrap" style={{ marginTop: 14 }}>
        <button className="btn dark small" onClick={() => actions.openOverlay("controls", from, "settings")}>Controls</button>
        <button className="btn red small" onClick={() => actions.openOverlay("confirm-reset", from, "settings")}>Reset progress</button>
        <span className="spacer" />
        <button className="btn green small" onClick={() => { playSfx("click"); actions.closeOverlay(); }}>Done</button>
      </div>
    </Modal>
  );
}

export default function Overlays() {
  const overlay = useGame((s) => s.overlay);
  const worldId = useGame((s) => s.worldId);
  const screen = useGame((s) => s.screen);
  if (overlay === "none") return null;

  if (overlay === "settings") return <Settings />;
  if (overlay === "controls") {
    return (
      <Modal title="Controls" onClose={() => actions.closeOverlay()}>
        <ControlsList />
        <button className="btn green" onClick={() => actions.closeOverlay()}>Got it</button>
      </Modal>
    );
  }
  if (overlay === "confirm-new") {
    return <Confirm title="Start a new game?" text="This erases your saved adventure on this computer and starts again from the Enchanted Kingdom. Your settings are kept." yes="Erase and start" onYes={() => actions.newGame()} />;
  }
  if (overlay === "confirm-reset") {
    return <Confirm title="Reset all progress?" text="All worlds, coins, gems and stars will be erased. This cannot be undone." yes="Yes, reset" onYes={() => { actions.resetProgress(); if (screen === "playing") actions.exitToMenu(); }} />;
  }
  if (overlay === "confirm-restart") {
    return <Confirm title="Restart this level?" text={`${LEVELS[worldId].name} will start again from the beginning. Coins and puzzles in this world will reset; other worlds are not affected.`} yes="Restart level" onYes={() => actions.restartLevel()} />;
  }
  // pause
  return (
    <Modal title="Paused">
      <div className="stack">
        <button className="btn green" onClick={() => { playSfx("click"); actions.togglePause(); }}>Resume</button>
        <button className="btn blue" onClick={() => actions.openOverlay("controls", "pause")}>Controls</button>
        <button className="btn blue" onClick={() => actions.openOverlay("settings", "pause")}>Settings</button>
        <button className="btn orange" onClick={() => actions.openOverlay("confirm-restart", "pause")}>Restart level</button>
        <button className="btn dark" onClick={() => { playSfx("click"); actions.exitToMenu(); }}>Save &amp; main menu</button>
      </div>
      <p className="note">Progress saves automatically at checkpoints, coins, and solved puzzles.</p>
    </Modal>
  );
}
