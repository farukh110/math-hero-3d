"use client";

import { actions, getPuzzle, useGame } from "@/systems/progression/gameStore";
import { explain } from "@/systems/puzzles/validate";
import { playSfx } from "@/systems/audio/audio";
import { Portrait } from "@/components/menus/Icons";
import { ControlsList } from "@/components/menus/Overlays";
import { LEVELS } from "@/data/levels";

/** Crystal machine panel: pick a group size, watch the crystals regroup, then test it. */
export function CrystalPanel() {
  const panel = useGame((s) => s.puzzle);
  const fb = useGame((s) => s.feedback);
  const attempts = useGame((s) => (s.puzzle ? s.attempts[s.puzzle.id] ?? 0 : 0));
  if (!panel) return null;
  const def = getPuzzle(panel.id);
  const g = panel.value;
  const [a, b] = def.numbers;
  const max = Math.max(a, b);

  const eq = (n: number, cls: string) => {
    const left = n % g;
    return (
      <div className={`eq ${cls}`}>
        {n} ÷ {g} = {Math.floor(n / g)} groups
        {left > 0 ? <span className="left"> + {left} left over</span> : <span className="ok"> - none left over</span>}
      </div>
    );
  };
  const adj = (d: number) => () => actions.setPuzzleValue(g + d);

  return (
    <div className="panel machine" role="dialog" aria-label={def.title}>
      <h3>{def.title}</h3>
      <p className="intro">{def.intro}</p>
      <div className="dial">
        <button className="step" onClick={adj(-5)} aria-label="minus 5">-5</button>
        <button className="step" onClick={adj(-1)} aria-label="minus 1">-1</button>
        <div className="num" aria-live="polite">{g}</div>
        <button className="step" onClick={adj(1)} aria-label="plus 1">+1</button>
        <button className="step" onClick={adj(5)} aria-label="plus 5">+5</button>
      </div>
      <input type="range" min={1} max={max} value={g} onChange={(e) => actions.setPuzzleValue(Number(e.target.value))} aria-label="Group size" style={{ width: "100%" }} />
      <div className="eqs">{eq(a, "blue")}{eq(b, "green")}</div>
      {fb && fb.status !== "info" && (
        <div className={`fb ${fb.status}`}>
          {fb.text}
          {fb.hint && <div className="hint">Hint: {fb.hint}</div>}
        </div>
      )}
      {!fb && attempts === 0 && <div className="note">Red crystals are left over. A good group size leaves none red.</div>}
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn dark small" onClick={() => { playSfx("click"); actions.closePuzzle(); }}>Leave machine (Esc)</button>
        <span className="spacer" />
        <button className="btn green" style={{ width: "auto" }} onClick={() => actions.attempt(panel.id, g)}>Test these groups (E)</button>
      </div>
      <div className="keys">A / D or Left / Right: ±1 &nbsp;|&nbsp; W / S or Up / Down: ±5</div>
    </div>
  );
}

export function ResultCard() {
  const result = useGame((s) => s.result);
  if (!result) return null;
  const def = getPuzzle(result.id);
  const lines = explain(def);
  return (
    <div className="overlay" style={{ zIndex: 45 }}>
      <div className="panel modal result">
        <h2>{result.justSolved ? "Solved!" : def.title}</h2>
        <p style={{ margin: 0 }}>
          {def.kind === "hcf" ? "The HCF (Highest Common Factor) of" : "The LCM (Lowest Common Multiple) of"} {def.numbers.join(" and ")} is the answer you found. Here is why it works:
        </p>
        <div className="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
        <button className="btn green" autoFocus onClick={() => { playSfx("click"); actions.dismissResult(); }}>
          {result.justSolved ? "Great! Continue (Enter)" : "Close (Enter)"}
        </button>
      </div>
    </div>
  );
}

export function IntroDialog() {
  const intro = useGame((s) => s.intro);
  const worldId = useGame((s) => s.worldId);
  const loading = useGame((s) => s.loading);
  if (!intro || loading) return null;
  const last = intro.index === intro.lines.length - 1;
  return (
    <div className="panel speech" role="dialog">
      <div className="avatar"><Portrait /></div>
      <div style={{ flex: 1 }}>
        <div className="who">PIP THE EXPLORER - {LEVELS[worldId].name}</div>
        <p>{intro.lines[intro.index]}</p>
        {last && worldId === 1 && <ControlsList />}
        <button className="btn green small" onClick={() => actions.advanceIntro()}>{last ? "Let's go! (Enter)" : "Next (Enter)"}</button>
      </div>
    </div>
  );
}
