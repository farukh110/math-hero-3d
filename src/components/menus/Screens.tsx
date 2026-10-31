"use client";

import { actions, countCollected, useGame } from "@/systems/progression/gameStore";
import { LEVELS, WORLD_IDS } from "@/data/levels";
import { factorsOf, hcfOf, lcmOf, multiplesOf, list } from "@/utils/math";
import { playSfx } from "@/systems/audio/audio";
import { BigStar, CoinIcon, GemIcon } from "./Icons";

export function WorldSelect() {
  const progress = useGame((s) => s.progress);
  return (
    <div className="overlay" style={{ background: "linear-gradient(#10264a, #1d4d88)" }}>
      <div className="panel modal" style={{ width: "min(760px, 100%)" }}>
        <h2>Choose a world</h2>
        <div className="worldCards">
          {WORLD_IDS.map((id) => {
            const lv = LEVELS[id];
            const locked = progress.unlockedWorld < id;
            return (
              <button key={id} className="wcard" disabled={locked} onClick={() => { playSfx("click"); actions.enterWorld(id); }}>
                <h3>{id}. {lv.name}</h3>
                <p>{locked ? "Locked - finish the previous world first." : lv.tagline}</p>
                <div className="stats">
                  <span className="row"><CoinIcon width={20} />{countCollected(progress, id, "coin")}/{lv.coins.length}</span>
                  <span className="row"><BigStar width={20} />{countCollected(progress, id, "star")}/{lv.stars.length}</span>
                  <span className="row"><GemIcon width={20} />{countCollected(progress, id, "gem")}</span>
                  {progress.completedWorlds.includes(id) && <span style={{ color: "#8dffb4" }}>Completed</span>}
                </div>
              </button>
            );
          })}
        </div>
        <button className="btn dark" style={{ marginTop: 14 }} onClick={() => actions.showScreen("menu")}>Back</button>
      </div>
    </div>
  );
}

/** Concept guide - worked examples are computed from the real maths helpers. */
export function Learn() {
  const a = 24, b = 36, c = 4, d = 6;
  return (
    <div className="overlay" style={{ background: "linear-gradient(#10264a, #1d4d88)" }}>
      <div className="panel modal learn" style={{ width: "min(780px, 100%)" }}>
        <h2>How HCF and LCM work</h2>
        <h3>HCF - Highest Common Factor</h3>
        <p>
          The HCF of two numbers is the <b>biggest number that divides both exactly</b>. In the Crystal Cave it is the largest group size that
          shares every crystal with none left over.
        </p>
        <p>
          Factors of {a}: {list(factorsOf(a))}<br />
          Factors of {b}: {list(factorsOf(b))}<br />
          Biggest shared factor: <code>HCF({a}, {b}) = {hcfOf([a, b])}</code>
        </p>
        <h3>LCM - Lowest Common Multiple</h3>
        <p>
          The LCM of two numbers is the <b>smallest number that is in both times tables</b>. In the Magic Garden it is the first stone where
          fountains that spray every {c} and every {d} steps spray together.
        </p>
        <p>
          Multiples of {c}: {list(multiplesOf(c, 24))}<br />
          Multiples of {d}: {list(multiplesOf(d, 24))}<br />
          First shared multiple: <code>LCM({c}, {d}) = {lcmOf([c, d])}</code>
        </p>
        <h3>A handy check</h3>
        <p>HCF × LCM = the two numbers multiplied: {hcfOf([c, d])} × {lcmOf([c, d])} = {c} × {d} = {c * d}.</p>
        <button className="btn green" onClick={() => { playSfx("click"); actions.showScreen("menu"); }}>Back to the menu</button>
      </div>
    </div>
  );
}

export function WorldComplete() {
  const worldId = useGame((s) => s.worldId);
  const progress = useGame((s) => s.progress);
  const lv = LEVELS[worldId];
  const next = Math.min(4, worldId + 1);
  return (
    <div className="overlay">
      <div className="panel modal">
        <h2>{lv.name} complete!</h2>
        <div className="stats" style={{ margin: "6px 0 12px" }}>
          <span className="row"><CoinIcon width={26} />{countCollected(progress, worldId, "coin")}/{lv.coins.length}</span>
          <span className="row"><BigStar width={26} />{countCollected(progress, worldId, "star")}/{lv.stars.length}</span>
          <span className="row"><GemIcon width={26} />{countCollected(progress, worldId, "gem")}</span>
        </div>
        <p>Great work! The next area of the Lost Kingdom is now open: <b>{LEVELS[next as 1 | 2 | 3 | 4].name}</b>.</p>
        <div className="stack">
          <button className="btn green" onClick={() => { playSfx("click"); actions.enterWorld(next as 1 | 2 | 3 | 4); }}>Next world</button>
          <button className="btn blue" onClick={() => { playSfx("click"); actions.enterWorld(worldId); }}>Replay this world</button>
          <button className="btn dark" onClick={() => actions.exitToMenu()}>Main menu</button>
        </div>
      </div>
    </div>
  );
}

export function Victory() {
  const progress = useGame((s) => s.progress);
  let coins = 0, stars = 0, gems = 0;
  for (const id of WORLD_IDS) {
    coins += countCollected(progress, id, "coin");
    stars += countCollected(progress, id, "star");
    gems += countCollected(progress, id, "gem");
  }
  return (
    <div className="overlay">
      <div className="panel modal">
        <h2>The Lost Kingdom is restored!</h2>
        <p>You used HCF to share crystals fairly and LCM to make fountains dance together. The kingdom&apos;s magic shines again - thank you, explorer!</p>
        <div className="stats" style={{ margin: "6px 0 14px" }}>
          <span className="row"><CoinIcon width={26} />{coins}</span>
          <span className="row"><BigStar width={26} />{stars}</span>
          <span className="row"><GemIcon width={26} />{gems}</span>
        </div>
        <div className="stack">
          <button className="btn blue" onClick={() => { playSfx("click"); actions.showScreen("worlds"); }}>Revisit a world</button>
          <button className="btn dark" onClick={() => actions.exitToMenu()}>Main menu</button>
        </div>
      </div>
    </div>
  );
}
