"use client";

import { useEffect, useRef } from "react";
import { actions, countCollected, objectiveProgress, useGame } from "@/systems/progression/gameStore";
import { LEVELS } from "@/data/levels";
import { rt } from "@/systems/runtime/runtime";
import { useLane } from "@/systems/puzzles/laneStore";
import { getPuzzle } from "@/systems/progression/gameStore";
import { flagKey } from "@/data/levels";
import { BigStar, CoinIcon, GemIcon, HelpIcon, MenuIcon, MuteIcon, SoundIcon, Portrait } from "@/components/menus/Icons";
import { playSfx } from "@/systems/audio/audio";

const FOUNTAIN_COLORS = ["#3db4ff", "#ff6fb5", "#5fe08a"];

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const worldId = useGame((s) => s.worldId);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const level = LEVELS[worldId];
    const R = 26; // world units shown from centre to edge
    const S = cv.width / 2 / R;
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.save();
      ctx.translate(cv.width / 2, cv.height / 2);
      const px = rt.pos.x, pz = rt.pos.z;
      for (const b of level.boxes) {
        if (b.solid === false || b.size[1] > 1.6) continue;
        ctx.fillStyle = b.color;
        ctx.globalAlpha = 0.9;
        ctx.fillRect((b.pos[0] - b.size[0] / 2 - px) * S, (b.pos[2] - b.size[2] / 2 - pz) * S, b.size[0] * S, b.size[2] * S);
      }
      for (const m of level.movers ?? []) {
        ctx.fillStyle = "#f0c96b";
        ctx.fillRect((m.pos[0] - m.size[0] / 2 - px) * S, (m.pos[2] - m.size[2] / 2 - pz) * S, m.size[0] * S, m.size[2] * S);
      }
      ctx.globalAlpha = 1;
      const mark = (x: number, z: number, color: string, r: number) => {
        let dx = (x - px) * S, dz = (z - pz) * S;
        const lim = cv.width / 2 - 8;
        dx = Math.max(-lim, Math.min(lim, dx));
        dz = Math.max(-lim, Math.min(lim, dz));
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(dx, dz, r, 0, Math.PI * 2);
        ctx.fill();
      };
      for (const st of level.stations) mark(st.pos[0], st.pos[2], "#b17cff", 4);
      mark(level.goal.pos[0], level.goal.pos[2], "#ffd23f", 5);
      // player arrow
      ctx.rotate(-rt.facing + Math.PI);
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#0b1a33";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    };
    draw();
    const id = window.setInterval(draw, 100);
    return () => window.clearInterval(id);
  }, [worldId]);

  return <canvas ref={ref} className="minimap" width={150} height={150} aria-label="Mini map" />;
}

function LaneHud() {
  const step = useLane((l) => l.step);
  const puzzleId = useLane((l) => l.puzzleId);
  const solved = useGame((s) => (puzzleId ? s.progress.flags[flagKey(s.worldId, `puzzle:${puzzleId}`)] === true : false));
  if (!puzzleId || step === 0) return null;
  const def = getPuzzle(puzzleId);
  const all = def.numbers.every((n) => step % n === 0);
  return (
    <div className="panel laneHud">
      <h4>Stone {step}</h4>
      {def.numbers.map((n, i) => {
        const fires = step % n === 0;
        return (
          <div className="laneRow" key={i}>
            <span className="dot" style={{ background: FOUNTAIN_COLORS[i], opacity: fires ? 1 : 0.35 }} />
            Fountain {String.fromCharCode(65 + i)} (every {n}): {fires ? "SPRAYS" : "quiet"}
          </div>
        );
      })}
      <div className="laneRow" style={{ color: all ? "#ffd23f" : "#a9c2e6" }}>
        {all ? "All fountains spray together here!" : "Not all together here."}
      </div>
      {!solved && <div className="note">Press E on the stone you choose.</div>}
    </div>
  );
}

function Prompt() {
  const prompt = useGame((s) => s.prompt);
  if (!prompt) return null;
  const m = /^Press E( to |: )(.*)$/.exec(prompt);
  return (
    <div className="promptWrap">
      <div className="prompt">
        {m ? (<><span className="key">E</span><span>{m[1] === ": " ? m[2] : `to ${m[2]}`}</span></>) : <span>{prompt}</span>}
      </div>
    </div>
  );
}

function Feedback() {
  const fb = useGame((s) => s.feedback);
  useEffect(() => {
    if (!fb) return;
    const t = window.setTimeout(() => actions.clearFeedback(), 14000);
    return () => window.clearTimeout(t);
  }, [fb]);
  const puzzleOpen = useGame((s) => s.puzzle !== null);
  if (!fb || puzzleOpen) return null;
  return (
    <div className={`feedback ${fb.status}`} role="status">
      {fb.text}
      {fb.hint && <div className="hint">Hint: {fb.hint}</div>}
    </div>
  );
}

export default function Hud() {
  const worldId = useGame((s) => s.worldId);
  const progress = useGame((s) => s.progress);
  const toast = useGame((s) => s.toast);
  const muted = useGame((s) => s.settings.muted);
  const showFps = useGame((s) => s.settings.showFps);
  const loading = useGame((s) => s.loading);
  const puzzleOpen = useGame((s) => s.puzzle !== null);
  const level = LEVELS[worldId];
  const obj = objectiveProgress();
  void progress;
  if (loading) return null;

  return (
    <div className="hud">
      <div className="topBar">
        <div className="avatar"><Portrait /></div>
        <div className="worldBox">
          <div className="worldName">World {worldId}: {level.name}</div>
          <div className="bar"><i style={{ width: `${(obj.index / obj.total) * 100}%` }} /><span>{obj.index}/{obj.total} goals</span></div>
        </div>
        <div className="chip"><CoinIcon />{countCollected(progress, worldId, "coin")}<small style={{ opacity: 0.6, fontSize: 12 }}>/{level.coins.length}</small></div>
        <div className="chip"><GemIcon />{countCollected(progress, worldId, "gem")}</div>
        <div className="chip"><BigStar />{countCollected(progress, worldId, "star")}<small style={{ opacity: 0.6, fontSize: 12 }}>/{level.stars.length}</small></div>
      </div>

      <div className="hudRight">
        <div className="row">
          <button className="iconBtn" aria-label={muted ? "Unmute" : "Mute"} onClick={() => actions.updateSettings({ muted: !muted })}>{muted ? <MuteIcon /> : <SoundIcon />}</button>
          <button className="iconBtn" aria-label="Controls" onClick={() => actions.openOverlay("controls", "pause")}><HelpIcon /></button>
          <button className="iconBtn" aria-label="Pause" onClick={() => { playSfx("click"); actions.togglePause(); }}><MenuIcon /></button>
        </div>
        <div className="panel objective">
          <h4>Objective</h4>
          <p>{obj.text}</p>
        </div>
        <Minimap />
      </div>

      {toast && <div className="toast" key={toast.id}>{toast.text}</div>}
      {!puzzleOpen && <Prompt />}
      <Feedback />
      <LaneHud />
      {showFps && <div className="fps" id="fps-readout">-- FPS</div>}
    </div>
  );
}
