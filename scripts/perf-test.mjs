// Measures renderer statistics per world and quality (dev tool). Software WebGL FPS is NOT representative
// of real hardware; draw calls / triangles / GPU resource counts are.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox", "--enable-precise-memory-info"], defaultViewport: { width: 1280, height: 720 } });
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://127.0.0.1:3210/?debug", { waitUntil: "networkidle0" });
await sleep(500);
const rows = [];
async function measure(world, quality) {
  await page.evaluate((w, q) => { const g = window.__mathGame; g.actions.updateSettings({ quality: q }); g.actions.enterWorld(w); }, world, quality);
  await page.waitForFunction(() => !window.__mathGame.store.get().loading, { timeout: 60000 });
  await sleep(1500);
  for (let i = 0; i < 3; i++) { await page.keyboard.press("Enter"); await sleep(150); }
  await sleep(1000);
  const r = await page.evaluate(() => new Promise((res) => {
    const g = window.__mathGame, info = g.gl.info; let frames = 0; const t0 = performance.now();
    const tick = () => { frames++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res({ fps: +(frames / 3).toFixed(1), calls: info.render.calls, tris: info.render.triangles, geos: info.memory.geometries, tex: info.memory.textures, progs: info.programs?.length, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(0) : null }); };
    requestAnimationFrame(tick);
  }));
  rows.push({ world, quality, ...r });
  console.log(JSON.stringify({ world, quality, ...r }));
}
for (const q of ["low", "medium", "high"]) for (const w of [1, 2, 3, 4]) await measure(w, q);
// leak check: re-enter world 1 and 3 repeatedly on medium and compare resource counts / heap
for (let i = 0; i < 6; i++) { await measure(i % 2 ? 3 : 1, "medium"); }
console.log("errors:", errors.length ? errors : "none");
await browser.close();
