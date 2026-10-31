"use client";

import { useState } from "react";
import { actions, useGame } from "@/systems/progression/gameStore";
import { playSfx, unlockAudio, startMusic } from "@/systems/audio/audio";
import { BookIcon, CapIcon, ChestIcon, ExitIcon, GearIcon, GemIcon, LeafIcon, PlayIcon, StarIcon, TempleIcon, BigStar, CoinIcon, HeartIcon } from "./Icons";

function Scene() {
  return (
    <svg className="scene" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fd45c" /><stop offset="1" stopColor="#3f9b45" /></linearGradient>
      </defs>
      <circle cx="860" cy="90" r="46" fill="#fff6c8" opacity=".9" />
      <g fill="#fff" opacity=".9"><ellipse cx="520" cy="110" rx="70" ry="20" /><ellipse cx="570" cy="96" rx="50" ry="18" /><ellipse cx="250" cy="170" rx="60" ry="16" /></g>
      <ellipse cx="760" cy="215" rx="150" ry="22" fill="#6aa04a" /><path d="M640 215l-10 40h260l-10-40z" fill="#8c6d4b" />
      <g transform="translate(700 70)">
        <rect x="35" y="60" width="110" height="80" fill="#e6dfd2" /><rect x="75" y="100" width="30" height="40" rx="14" fill="#8d5d2e" />
        {[[0, 40, "#7c4dff"], [150, 40, "#7c4dff"], [70, 0, "#4dabf7"]].map(([x, y, c], i) => (
          <g key={i}><rect x={Number(x) + 10} y={Number(y) + 40} width="26" height={110 - Number(y)} fill="#d8d0c2" /><path d={`M${Number(x) + 4} ${Number(y) + 42}l19-40 19 40z`} fill={String(c)} /></g>
        ))}
      </g>
      <path d="M0 470 Q250 380 500 450 T1000 430 V600 H0z" fill="url(#hill)" />
      <path d="M0 540 Q300 470 620 530 T1000 510 V600 H0z" fill="#58b84a" />
      <path d="M420 600 Q560 500 700 330" stroke="#e0c590" strokeWidth="46" fill="none" strokeLinecap="round" />
      {[[560, 470], [640, 500], [330, 520], [860, 540]].map(([x, y], i) => (
        <g key={i}><rect x={x - 5} y={y} width="10" height="38" fill="#7a5230" /><circle cx={x} cy={y - 8} r="30" fill="#2f9e5b" /><circle cx={x + 14} cy={y + 2} r="20" fill="#3db563" /></g>
      ))}
    </svg>
  );
}

export default function MainMenu() {
  const progress = useGame((s) => s.progress);
  const classLevel = useGame((s) => s.settings.classLevel);
  const [overlay, setOverlay] = useState<null | "progress" | "exit">(null);
  const hasSave = progress.started;

  const go = (fn: () => void) => () => {
    unlockAudio();
    startMusic();
    playSfx("click");
    fn();
  };
  const totals = (() => {
    let coins = 0, stars = 0, gems = 0;
    for (const [k, list] of Object.entries(progress.collected)) {
      void k;
      for (const id of list) {
        if (id.startsWith("c")) coins++;
        else if (id.startsWith("s")) stars++;
        else if (id.startsWith("g")) gems++;
      }
    }
    return { coins, stars, gems };
  })();
  const names = ["The Enchanted Kingdom", "HCF Crystal Cave", "LCM Magic Garden", "The Final Math Temple"];

  return (
    <div className="menu">
      <Scene />
      <div className="menuLeft">
        <div className="logo">
          <div className="m"><span>M</span><span>A</span><span>T</span><span>H</span></div>
          <div className="a">ADVENTURE 3D</div>
          <div className="sub">The Lost Kingdom</div>
        </div>
        {hasSave && (
          <button className="btn green" onClick={go(() => actions.continueGame())}>
            <PlayIcon className="ico" /> Continue Adventure
          </button>
        )}
        <button
          className={`btn ${hasSave ? "dark" : "green"}`}
          onClick={go(() => (hasSave ? actions.openOverlay("confirm-new") : actions.newGame()))}
        >
          <PlayIcon className="ico" /> {hasSave ? "New Game" : "Start Adventure"}
        </button>
        <button className="btn blue" onClick={go(() => actions.showScreen("learn"))}>
          <BookIcon className="ico" /> Learn
        </button>
        <button className="btn blue" onClick={go(() => actions.showScreen("worlds"))} disabled={!hasSave}>
          <TempleIcon className="ico" /> Worlds
        </button>
        <div className="btn purple" style={{ cursor: "default", padding: "8px 18px" }}>
          <CapIcon className="ico" /> Select Class
        </div>
        <div className="classRow">
          <button className={`classBtn c6 ${classLevel === 6 ? "sel" : ""}`} onClick={go(() => actions.updateSettings({ classLevel: 6 }))}>CLASS 6</button>
          <button className={`classBtn c7 ${classLevel === 7 ? "sel" : ""}`} onClick={go(() => actions.updateSettings({ classLevel: 7 }))}>CLASS 7</button>
        </div>
        <div className="iconRow">
          <button className="tileBtn" onClick={go(() => actions.openOverlay("settings", "menu"))}><GearIcon /> Settings</button>
          <button className="tileBtn" onClick={go(() => setOverlay("progress"))}><StarIcon style={{ color: "#ffc400" }} /> Progress</button>
          <button className="tileBtn" onClick={go(() => setOverlay("exit"))}><ExitIcon /> Exit</button>
        </div>
      </div>

      <div className="signs">
        {[
          { n: "HCF", s: "Crystal Cave", i: <GemIcon />, w: 2 },
          { n: "LCM", s: "Magic Garden", i: <LeafIcon />, w: 3 },
          { n: "TREASURE", s: "Math Temple", i: <ChestIcon />, w: 4 },
        ].map((x) => {
          const locked = progress.unlockedWorld < x.w;
          return (
            <div key={x.n} className={`sign ${locked ? "locked" : ""}`} onClick={() => !locked && hasSave && go(() => actions.enterWorld(x.w as 2 | 3 | 4))()}>
              {x.i}
              <div><b>{x.n}</b><small>{locked ? "LOCKED" : x.s.toUpperCase()}</small></div>
            </div>
          );
        })}
      </div>

      <div className="benefits panel">
        <div className="benefit"><BigStar /><div><b>Earn Stars</b>Find hidden stars while you explore</div></div>
        <div className="benefit"><CoinIcon /><div><b>Collect Coins</b>Coins open gates to new areas</div></div>
        <div className="benefit"><GemIcon /><div><b>Discover Secrets</b>Solve puzzles to win crystal gems</div></div>
        <div className="benefit"><HeartIcon /><div><b>Learn Math</b>Experiment - mistakes are fine!</div></div>
        <div className="benefit"><ChestIcon /><div><b>Unlock the Temple</b>Solve every challenge to win</div></div>
      </div>

      {overlay === "progress" && (
        <div className="overlay" onClick={() => setOverlay(null)}>
          <div className="panel modal" onClick={(e) => e.stopPropagation()}>
            <h2>Your Progress</h2>
            <div className="stats" style={{ margin: "6px 0 12px" }}>
              <span>Coins: {totals.coins}</span><span>Gems: {totals.gems}</span><span>Stars: {totals.stars}</span>
            </div>
            {names.map((n, i) => (
              <p key={n} style={{ margin: "4px 0" }}>
                World {i + 1}: {n} - {progress.completedWorlds.includes(i + 1) ? "Completed" : progress.unlockedWorld >= i + 1 ? "Unlocked" : "Locked"}
              </p>
            ))}
            <p className="note">Progress is saved automatically on this computer.</p>
            <button className="btn blue" onClick={() => setOverlay(null)}>Close</button>
          </div>
        </div>
      )}
      {overlay === "exit" && (
        <div className="overlay" onClick={() => setOverlay(null)}>
          <div className="panel modal" onClick={(e) => e.stopPropagation()}>
            <h2>Leaving the game</h2>
            <p>Your progress is saved automatically. Just close this browser tab or window to quit.</p>
            <p>To switch the local game server off, close the black server window or run <b>stop-game.bat</b>.</p>
            <button className="btn blue" onClick={() => setOverlay(null)}>Back to the menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
