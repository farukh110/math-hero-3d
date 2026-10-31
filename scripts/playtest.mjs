// End-to-end playthrough (dev tool). Drives the REAL game in headless Chrome.
// Teleporting (debug handle) is only used to skip long walks; every interaction,
// gate, puzzle and collectible still goes through the normal game code.
// Usage: node scripts/playtest.mjs <shotsDir> [url]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";

const shots = process.argv[2] ?? "shots";
const base = process.argv[3] ?? "http://127.0.0.1:3210/?debug";
mkdirSync(shots, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
  defaultViewport: { width: 1280, height: 720 },
});
const page = await browser.newPage();
const errors = [];
const external = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("response", (r) => { if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url()}`); });
page.on("request", (r) => { const u = r.url(); if (!u.startsWith("http://127.0.0.1") && !u.startsWith("data:") && !u.startsWith("blob:")) external.push(u); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (n) => page.screenshot({ path: `${shots}/${n}.png` });
const S = () => page.evaluate(() => {
  const g = window.__mathGame, s = g.store.get();
  return {
    screen: s.screen, world: s.worldId, loading: s.loading, overlay: s.overlay, prompt: s.prompt,
    pos: g.rt.pos.toArray().map((n) => +n.toFixed(2)), grounded: g.rt.grounded, anim: g.rt.anim,
    flags: Object.keys(s.progress.flags), collected: s.progress.collected, puzzle: s.puzzle, result: s.result,
    feedback: s.feedback, attempts: s.attempts, unlocked: s.progress.unlockedWorld, completed: s.progress.completedWorlds,
    intro: !!s.intro, toast: s.toast?.text,
  };
});
const tp = async (x, y, z, wait = 500) => { await page.evaluate((x, y, z) => { const g = window.__mathGame; g.rt.checkpoint.set(x, y, z); g.rt.respawn = true; }, x, y, z); await sleep(wait); };
const hold = async (key, ms) => { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); };
const press = async (key, wait = 250) => { await page.keyboard.press(key); await sleep(wait); };
const waitFor = async (fn, ms = 15000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await page.evaluate(fn)) return true; await sleep(150); } return false; };
const clickText = (re) => page.evaluate((src) => { const r = new RegExp(src, "i"); const b = [...document.querySelectorAll("button")].find((x) => r.test(x.textContent)); if (b) b.click(); return !!b; }, re.source);
let passed = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); passed++; console.log("  PASS", msg); };

await page.goto(base, { waitUntil: "networkidle0" });
await sleep(500);
await clickText(/Start Adventure/);
await waitFor(() => !window.__mathGame.store.get().loading, 30000);
await sleep(500);
let s = await S();
ok(s.screen === "playing" && s.world === 1, "new game starts world 1");
ok(s.intro, "intro dialogue shown on first visit");
await press("Enter"); await press("Enter"); await press("Enter");
s = await S();
ok(!s.intro, "intro dismissed with Enter");

console.log("\n== World 1: movement, collisions, lever, gates ==");
// walls block: walk into the south-wall side? Check hedge blocks walking, jump clears it
await hold("KeyW", 2000);
s = await S();
ok(s.pos[2] > 10.3, `hedge blocks walking (z=${s.pos[2]})`);
await page.keyboard.down("KeyW"); await sleep(150); await page.keyboard.down("Space"); await sleep(200); await page.keyboard.up("Space"); await sleep(1500); await page.keyboard.up("KeyW");
s = await S();
ok(s.pos[2] < 9, `jump clears hedge (z=${s.pos[2]})`);
ok(s.flags.includes("1:reach:cp0"), "checkpoint cp0 reached by walking");
// coin gate blocks while the player has fewer than 8 coins
await tp(0, 3.2, -69);
const fewCoins = (await S()).collected["1"]?.filter((x) => x.startsWith("c")).length ?? 0;
await hold("KeyW", 1500);
s = await S();
ok(fewCoins < 8 && s.pos[2] > -75.3, `coin gate blocks with ${fewCoins} coins (z=${s.pos[2]})`);
// closed gate blocks
await tp(0, 1.2, -5);
await hold("KeyW", 2500);
s = await S();
ok(s.pos[2] > -9.2, `courtyard gate blocks before lever (z=${s.pos[2]})`);
await shot("10-gate-closed");
// lever
await tp(-8, 1, -4);
s = await S();
ok(/lever/i.test(s.prompt ?? ""), `lever prompt shown (${s.prompt})`);
await press("KeyE", 600);
s = await S();
ok(s.flags.includes("1:lever:gate"), "lever pulled sets flag");
await tp(0, 1.2, -5);
await hold("KeyW", 2500);
s = await S();
ok(s.pos[2] < -11, `gate opens after lever (z=${s.pos[2]})`);
// bridge walkable
await tp(0, 1.2, -21);
await hold("KeyW", 2500);
s = await S();
ok(s.pos[2] < -29 && s.pos[1] > 0.5, `bridge is walkable (z=${s.pos[2]}, y=${s.pos[1]})`);
// falling respawns at checkpoint
await tp(8, 1.2, -28.5, 150);
await page.evaluate(() => window.__mathGame.rt.checkpoint.set(0, 1.2, -38)); // the real checkpoint to respawn at
await sleep(3500);
s = await S();
ok(s.pos[1] > 0 && Math.abs(s.pos[0]) < 3, `falling off the bridge respawns at checkpoint (${s.pos})`);
// collect real coins by moving onto them
const coinPos = await page.evaluate(() => window.__mathGame.LEVELS[1].coins);
for (const [x, y, z] of coinPos.slice(0, 10)) await tp(x, y + 0.3, z, 260);
s = await S();
const nCoins = s.collected["1"].filter((x) => x.startsWith("c")).length;
ok(nCoins >= 8, `coins collected by touching them (${nCoins})`);
await tp(coinPos[0][0], coinPos[0][1] + 0.3, coinPos[0][2], 400);
const again = (await S()).collected["1"].filter((x) => x.startsWith("c")).length;
ok(again === nCoins, "a coin cannot be collected twice");
await tp(0, 3.2, -71);
await hold("KeyW", 1100);
s = await S();
ok(s.pos[2] < -76.5, `coin gate opens with 8+ coins (z=${s.pos[2]})`);
await shot("11-goal");
s = await S();
ok(/Press E|portal|Crystal/i.test(s.prompt ?? ""), `goal prompt (${s.prompt})`);
await press("KeyE", 500);
await waitFor(() => window.__mathGame.store.get().screen === "worldComplete", 8000);
s = await S();
ok(s.screen === "worldComplete" && s.unlocked === 2 && s.completed.includes(1), "world 1 complete, world 2 unlocked");
await shot("12-world-complete");

console.log("\n== World 2: HCF crystal machines ==");
await clickText(/Next world/);
await waitFor(() => !window.__mathGame.store.get().loading && window.__mathGame.store.get().worldId === 2, 30000);
await sleep(600);
await press("Enter"); await press("Enter"); await press("Enter");
await tp(0, 2.2, -19.5);
s = await S();
ok(/Crystal Machine/i.test(s.prompt ?? ""), `machine prompt (${s.prompt})`);
await press("KeyE", 1500);
s = await S();
ok(s.puzzle?.id === "cave-1", "machine panel opens");
await shot("20-machine-open");
// wrong answers: 5 leaves leftovers; 7 too
await page.evaluate(() => window.__mathGame.actions.setPuzzleValue(5)); await sleep(1800);
await shot("21-groups-5");
await press("Enter", 300);
s = await S();
ok(s.feedback?.status === "wrong" && /left over/.test(s.feedback.text), `wrong size gives friendly feedback: "${s.feedback?.text}"`);
ok(!s.flags.includes("2:puzzle:cave-1"), "wrong answer does not solve");
await page.evaluate(() => window.__mathGame.actions.setPuzzleValue(7)); await press("Enter", 300);
s = await S();
ok(s.feedback?.hint, "hint appears after repeated failed attempts");
// valid but not greatest
for (const k of ["KeyA", "KeyA"]) await press(k, 100); // 7->5? set precisely below
await page.evaluate(() => window.__mathGame.actions.setPuzzleValue(6)); await press("Enter", 300);
s = await S();
ok(s.feedback?.status === "valid-not-best" && !s.flags.includes("2:puzzle:cave-1"), "common factor 6 accepted as valid but NOT the greatest");
// keyboard adjust to 12: from 6 press D 6 times
for (let i = 0; i < 6; i++) await press("KeyD", 80);
s = await S();
ok(s.puzzle.value === 12, `A/D keys adjust the group size (${s.puzzle.value})`);
await sleep(1500);
await shot("22-groups-12");
await press("Enter", 800);
s = await S();
console.log("   state:", JSON.stringify({ f: s.flags, r: s.result, fb: s.feedback, p: s.puzzle, o: s.overlay }));
ok(s.flags.includes("2:puzzle:cave-1") && s.result?.justSolved, "12 solves cave-1 and shows explanation card");
await shot("23-result");
await press("Enter", 600);
// gate opens
await tp(0, 2.2, -28);
await hold("KeyW", 1800);
s = await S();
ok(s.pos[2] < -32, `locked gate opened after solving (z=${s.pos[2]})`);
// collect reward gems
for (let i = 0; i < 5; i++) { await tp(-2.6 + i * 1.3, 2.3, -17.1, 300); }
s = await S();
ok(s.collected["2"].filter((x) => x.startsWith("g:cave-1")).length === 5, "5 reward gems spawn and are collectable once");
// bypass attempt: calling attempt with the wrong value must not solve
const bypass = await page.evaluate(() => { const a = window.__mathGame.actions; return a.attempt("cave-2", 9); });
ok(bypass !== "correct", "validator rejects wrong value even if called directly");
await page.evaluate(() => window.__mathGame.actions.attempt("cave-2", 6));
await page.evaluate(() => window.__mathGame.actions.dismissResult());
await page.evaluate(() => window.__mathGame.actions.attempt("cave-3", 14));
await page.evaluate(() => window.__mathGame.actions.dismissResult());
s = await S();
ok(s.flags.includes("2:puzzle:cave-2") && s.flags.includes("2:puzzle:cave-3"), "cave-2 (6) and cave-3 (14) solve with their true HCFs");
await tp(0, 4.2, -110.5);
await sleep(500);
await press("KeyE", 400);
await waitFor(() => window.__mathGame.store.get().screen === "worldComplete", 8000);
s = await S();
ok(s.unlocked === 3, "world 2 complete unlocks the garden");

console.log("\n== World 3: LCM garden lanes ==");
await clickText(/Next world/);
await waitFor(() => !window.__mathGame.store.get().loading && window.__mathGame.store.get().worldId === 3, 30000);
await sleep(600);
await press("Enter"); await press("Enter"); await press("Enter");
// lane 1: centre (0,0,-22), spacing 1.5, 16 steps -> x0 = -12; stone k centre = -12 + 1.5*(k-0.5)
const stoneX = (k) => -12 + 1.5 * (k - 0.5);
await tp(stoneX(1), 1.2, -22, 700);
await hold("KeyD", 400);
await sleep(300);
s = await S();
ok(s.pos[0] > stoneX(1), `player can walk along lane (x=${s.pos[0]})`);
await tp(stoneX(8), 1.2, -22, 900);
s = await S();
ok(/lock in step 8/i.test(s.prompt ?? ""), `standing on stone 8 shows lock-in prompt (${s.prompt})`);
await shot("30-lane");
await press("KeyE", 400);
s = await S();
ok(s.feedback?.status === "wrong" && !s.flags.includes("3:puzzle:garden-1"), `step 8 rejected: "${s.feedback?.text}"`);
await tp(stoneX(24 > 16 ? 12 : 12), 1.2, -22, 900);
await press("KeyE", 400);
s = await S();
ok(s.flags.includes("3:puzzle:garden-1") && s.result?.justSolved, "step 12 (LCM of 4 and 6) solves garden-1");
await shot("31-lane-solved");
await press("Enter", 500);
await tp(0, 1.2, -33);
await hold("KeyW", 1800);
s = await S();
ok(s.pos[2] < -36, `garden arch opens after solving (z=${s.pos[2]})`);
const lcmCheck = await page.evaluate(() => { const a = window.__mathGame.actions; return [a.attempt("garden-2", 12), a.attempt("garden-2", 48)]; });
ok(lcmCheck[0] !== "correct" && lcmCheck[1] === "valid-not-best", `garden-2: 12 wrong, 48 common-but-not-first (${lcmCheck})`);
await page.evaluate(() => { const a = window.__mathGame.actions; a.attempt("garden-2", 24); a.dismissResult(); a.attempt("garden-3", 30); a.dismissResult(); });
await tp(0, 3.2, -141);
await sleep(500);
await press("KeyE", 400);
await waitFor(() => window.__mathGame.store.get().screen === "worldComplete", 8000);
s = await S();
ok(s.unlocked === 4, "world 3 complete unlocks the temple");

console.log("\n== World 4: Final Math Temple ==");
await clickText(/Next world/);
await waitFor(() => !window.__mathGame.store.get().loading && window.__mathGame.store.get().worldId === 4, 30000);
await sleep(600);
await press("Enter"); await press("Enter"); await press("Enter");
await tp(0, 1.2, 8);
await hold("KeyW", 1000);
// drop the player onto platform m1 at its CURRENT position, then check it is carried while staying grounded
await page.evaluate(() => {
  const g = window.__mathGame; const m = g.LEVELS[4].movers[0];
  const w = 2 * Math.PI / m.period, k = (t) => 0.5 - 0.5 * Math.cos(t * w);
  const x = m.pos[0] + m.travel[0] * k(g.rt.time + 0.03);
  g.rt.checkpoint.set(x, 0.9, m.pos[2]); g.rt.respawn = true;
});
await sleep(450);
const x0 = (await S()).pos[0];
await sleep(1200);
const after = await S();
const platformMoved = Math.abs(after.pos[0] - x0);
ok(platformMoved > 1 && after.grounded && after.pos[1] > 0.5, `moving platform carries the player (moved ${platformMoved.toFixed(2)}, grounded=${after.grounded}, y=${after.pos[1]})`);
await shot("40-temple");
await tp(0, 1.2, -12);
await page.evaluate(() => window.__mathGame.actions.attempt("temple-hcf", 18));
await page.evaluate(() => window.__mathGame.actions.dismissResult());
// final seal stays closed until BOTH are solved
await tp(0, 5.2, -58);
await hold("KeyW", 2500);
s = await S();
ok(s.pos[2] > -63.8, `Final Seal blocks with only HCF solved (z=${s.pos[2]})`);
await page.evaluate(() => { const a = window.__mathGame.actions; a.attempt("temple-lcm", 36); a.dismissResult(); });
await tp(0, 5.2, -58);
await hold("KeyW", 2500);
s = await S();
ok(s.pos[2] < -65, `Final Seal opens after HCF and LCM (z=${s.pos[2]})`);
await tp(0, 5.6, -77);
await sleep(500);
await press("KeyE", 400);
await waitFor(() => window.__mathGame.store.get().screen === "victory", 8000);
s = await S();
ok(s.screen === "victory", "victory screen after claiming the treasure");
await shot("41-victory");

console.log("\n== Save / continue ==");
const saved = await page.evaluate(() => localStorage.getItem("math-adventure-3d.progress.v1"));
ok(saved && JSON.parse(saved).completedWorlds.length === 4, "progress saved to localStorage");
await page.reload({ waitUntil: "networkidle0" });
await sleep(800);
const hasContinue = await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => /Continue Adventure/i.test(b.textContent)));
ok(hasContinue, "Continue Adventure appears after reload");
await page.evaluate(() => localStorage.setItem("math-adventure-3d.progress.v1", "{not json"));
await page.reload({ waitUntil: "networkidle0" });
await sleep(800);
const noCrash = await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => /Start Adventure/i.test(b.textContent)));
ok(noCrash, "corrupted save falls back to a fresh game without crashing");

console.log(`\n${passed} checks passed`);
console.log("EXTERNAL REQUESTS:", external.length ? external : "none");
console.log("CONSOLE/HTTP ERRORS:", errors.length ? errors : "none");
await browser.close();
