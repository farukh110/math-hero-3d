// Headless-browser smoke test (dev tool). Usage: node scripts/browser-test.mjs <shotsDir> [url]
// Loads the built game in Chrome (software WebGL), records console errors and every network request.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const shots = process.argv[2] ?? "shots";
const base = process.argv[3] ?? "http://127.0.0.1:3210/?debug";
mkdirSync(shots, { recursive: true });
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: ["--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--window-size=1280,720", "--no-sandbox"],
  defaultViewport: { width: 1280, height: 720 },
});
const page = await browser.newPage();
const errors = [];
const external = [];
const requests = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("response", (r) => { if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url()}`); });
page.on("request", (r) => {
  const u = r.url();
  requests.push(u);
  if (!u.startsWith("http://127.0.0.1") && !u.startsWith("data:") && !u.startsWith("blob:")) external.push(u);
});

const game = (fn, ...a) => page.evaluate(fn, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (n) => page.screenshot({ path: `${shots}/${n}.png` });
const state = () => game(() => {
  const g = window.__mathGame; const s = g.store.get();
  return { screen: s.screen, world: s.worldId, loading: s.loading, pos: g.rt.pos.toArray().map((n) => +n.toFixed(2)), grounded: g.rt.grounded, anim: g.rt.anim, flags: Object.keys(s.progress.flags), collected: s.progress.collected, prompt: s.prompt, puzzle: s.puzzle, result: !!s.result, overlay: s.overlay };
});

await page.goto(base, { waitUntil: "networkidle0" });
await sleep(800);
await shot("01-menu");
console.log("menu ok; title:", await page.title());

// Start adventure
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Start Adventure/i.test(b.textContent))?.click());
await sleep(4000);
console.log("after start:", JSON.stringify(await state()));
await shot("02-intro");
// dismiss intro (2 lines)
for (let i = 0; i < 3; i++) { await page.keyboard.press("Enter"); await sleep(200); }
await sleep(1500);
await shot("03-world1");
console.log("playing:", JSON.stringify(await state()));

// movement + jump
const hold = async (key, ms) => { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); };
const before = (await state()).pos;
await hold("KeyW", 1500);
const after = (await state()).pos;
console.log("moved W:", before, "->", after);
await page.keyboard.down("Space"); await sleep(250); const air = await state(); await page.keyboard.up("Space");
console.log("jump airborne:", air.pos[1], air.grounded, air.anim);
await sleep(900);
await shot("04-moved");
console.log("final:", JSON.stringify(await state()));

console.log("EXTERNAL REQUESTS:", external.length ? external : "none");
console.log("TOTAL REQUESTS:", requests.length);
console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
