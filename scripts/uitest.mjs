// Menu / settings / pause UI checks (dev tool). Usage: node scripts/uitest.mjs <shotsDir> [url]
import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const shots = process.argv[2] ?? "shots";
const base = process.argv[3] ?? "http://127.0.0.1:3210/?debug";
mkdirSync(shots, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new",
  args: ["--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
  defaultViewport: { width: 1366, height: 768 },
});
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
const ok = (c, m) => { assert.ok(c, m); passed++; console.log("  PASS", m); };
const click = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find((x) => new RegExp(src, "i").test(x.textContent)); b?.click(); return !!b; }, re.source);
const has = (re) => page.evaluate((src) => [...document.querySelectorAll("button")].some((x) => new RegExp(src, "i").test(x.textContent)), re.source);
const S = () => page.evaluate(() => { const g = window.__mathGame, s = g.store.get(); return { screen: s.screen, overlay: s.overlay, q: s.settings.quality, muted: s.settings.muted, cls: s.settings.classLevel, pos: g.rt.pos.toArray().map((n) => +n.toFixed(2)), flags: Object.keys(s.progress.flags), collected: s.progress.collected, loading: s.loading, started: s.progress.started }; });
const loaded = () => page.waitForFunction(() => !window.__mathGame.store.get().loading, { timeout: 40000 });

await page.goto(base, { waitUntil: "networkidle0" });
await sleep(600);
await page.screenshot({ path: `${shots}/50-menu-1366.png` });
ok(await has(/Start Adventure/), "main menu shows Start Adventure (no save yet)");
ok(!(await has(/Continue Adventure/)), "Continue hidden without a save");

// class selection + learn
await click(/CLASS 7/); await sleep(200);
ok((await S()).cls === 7, "Class 7 selectable");
await click(/Learn/); await sleep(300);
await page.screenshot({ path: `${shots}/51-learn.png` });
const learnText = await page.evaluate(() => document.body.innerText);
ok(/HCF\(24, 36\) = 12/.test(learnText) && /LCM\(4, 6\) = 12/.test(learnText), "Learn page examples are computed correctly");
await click(/Back to the menu/); await sleep(200);

// settings from menu
await click(/Settings/); await sleep(300);
await page.screenshot({ path: `${shots}/52-settings.png` });
await click(/^Low$/); await sleep(200);
ok((await S()).q === "low", "Low graphics preset selectable");
await click(/^High$/); await sleep(200);
ok((await S()).q === "high", "High graphics preset selectable");
await click(/^Medium$/); await sleep(200);
await page.evaluate(() => { const cb = [...document.querySelectorAll('input[type="checkbox"]')]; cb[0].click(); });
await sleep(200);
ok((await S()).muted === true, "Mute checkbox works");
await page.evaluate(() => { const cb = [...document.querySelectorAll('input[type="checkbox"]')]; cb[0].click(); });
await click(/Done/); await sleep(200);

// start game (class 7 puzzle numbers)
await click(/Start Adventure/);
await loaded(); await sleep(800);
for (let i = 0; i < 3; i++) { await page.keyboard.press("Enter"); await sleep(150); }
await page.screenshot({ path: `${shots}/53-hud-1366.png` });

// pause freezes the world
await page.keyboard.press("Escape"); await sleep(300);
ok((await S()).overlay === "pause", "Esc opens the pause menu");
await page.screenshot({ path: `${shots}/54-pause.png` });
const p0 = (await S()).pos;
await page.keyboard.down("KeyW"); await sleep(1000); await page.keyboard.up("KeyW");
ok(JSON.stringify((await S()).pos) === JSON.stringify(p0), "player does not move while paused");
await click(/Controls/); await sleep(200);
ok(/Mouse drag/.test(await page.evaluate(() => document.body.innerText)), "controls reference opens from pause");
await click(/Got it/); await sleep(200);
ok((await S()).overlay === "pause", "closing controls returns to pause menu");
await page.keyboard.press("Escape"); await sleep(300);
ok((await S()).overlay === "none", "Esc resumes");
await page.keyboard.down("KeyW"); await sleep(700); await page.keyboard.up("KeyW");
ok((await S()).pos[2] < p0[2] - 1, "player moves again after resume");

// restart level with confirmation
await page.evaluate(() => window.__mathGame.actions.collect("c15", "coin"));
ok((await S()).collected["1"]?.includes("c15"), "coin recorded before restart");
await page.keyboard.press("Escape"); await sleep(200);
await click(/Restart level/); await sleep(200);
ok((await S()).overlay === "confirm-restart", "restart asks for confirmation");
await click(/Cancel/); await sleep(200);
ok((await S()).collected["1"]?.includes("c15") && (await S()).overlay === "pause", "cancel keeps progress and returns to the pause menu");
await click(/Restart level/); await sleep(200);
await page.evaluate(() => [...document.querySelectorAll("button")].filter((x) => /^Restart level$/i.test(x.textContent.trim())).pop().click());
await loaded(); await sleep(600);
ok(!((await S()).collected["1"] ?? []).includes("c15"), "restart level resets the world's collectibles");

// quality switch while playing
await page.keyboard.press("Escape"); await sleep(200);
await click(/Settings/); await sleep(200);
await click(/^Low$/); await sleep(1800);
ok((await S()).q === "low" && (await page.evaluate(() => !!document.querySelector("canvas"))), "switching to Low in-game keeps the 3D view running");
await click(/Done/); await sleep(300);
await page.screenshot({ path: `${shots}/55-low.png` });

// FPS counter (we are on the pause menu after Done)
await click(/Settings/); await sleep(200);
await page.evaluate(() => { const cb = [...document.querySelectorAll('input[type="checkbox"]')]; cb[1].click(); });
await click(/Done/); await sleep(300);
await page.keyboard.press("Escape"); await sleep(1500);
ok(/FPS/.test(await page.evaluate(() => document.getElementById("fps-readout")?.textContent ?? "")), "FPS counter shows when enabled in Settings");

// main menu -> continue -> reset with confirmation
await page.keyboard.press("Escape"); await sleep(200);
await click(/main menu/); await sleep(300);
ok(await has(/Continue Adventure/), "Continue Adventure available after leaving to menu");
await click(/Continue Adventure/); await loaded(); await sleep(500);
for (let i = 0; i < 3; i++) { await page.keyboard.press("Enter"); await sleep(150); } // intro of an untouched world
ok((await S()).screen === "playing", "Continue resumes the adventure");
await page.keyboard.press("Escape"); await sleep(200);
await click(/main menu/); await sleep(300);
await click(/Settings/); await sleep(200);
await click(/Reset progress/); await sleep(200);
ok((await S()).overlay === "confirm-reset", "Reset progress asks for confirmation");
await click(/Cancel/); await sleep(200);
ok((await S()).started === true, "cancelling reset keeps progress");
await click(/Reset progress/); await sleep(200);
await click(/Yes, reset/); await sleep(300);
ok((await S()).started === false && !(await has(/Continue Adventure/)), "confirmed reset erases progress");

// small screen
await page.setViewport({ width: 1280, height: 720 });
await sleep(400);
await page.screenshot({ path: `${shots}/56-menu-1280.png` });
await click(/Start Adventure/); await loaded(); await sleep(800);
for (let i = 0; i < 3; i++) { await page.keyboard.press("Enter"); await sleep(150); }
await page.screenshot({ path: `${shots}/57-hud-1280.png` });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
ok(!overflow, "no page scrollbars at 1280x720");

console.log(`\n${passed} UI checks passed`);
console.log("CONSOLE ERRORS:", errors.length ? errors : "none");
await browser.close();
