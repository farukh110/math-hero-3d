// Saves progress, stops/starts the packaged server with its own scripts, reloads, checks progress survived.
import puppeteer from "puppeteer-core";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const pkg = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "mathadv-"));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", userDataDir: profile, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:3210/?debug", { waitUntil: "networkidle0" });
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Start Adventure/i.test(b.textContent)).click());
await page.waitForFunction(() => !window.__mathGame.store.get().loading, { timeout: 30000 });
await page.evaluate(() => { const a = window.__mathGame.actions; a.collect("c7", "coin"); a.setFlag("lever:gate"); a.reachCheckpoint("cp1"); });
const before = await page.evaluate(() => localStorage.getItem("math-adventure-3d.progress.v1"));
// stop server with the shipped stop script, confirm it is down
execFileSync("cmd.exe", ["/c", ".\\stop-game.bat < nul"], { cwd: pkg });
await sleep(800);
let down = false;
try { await fetch("http://127.0.0.1:3210/", { signal: AbortSignal.timeout(1500) }); } catch { down = true; }
assert.ok(down, "server should be stopped");
// start again (same package, bundled node)
const child = spawn(join(pkg, "node", "node.exe"), [join(pkg, "scripts", "serve.mjs")], { cwd: pkg, stdio: "ignore", detached: true });
child.unref();
await sleep(2000);
await page.goto("http://127.0.0.1:3210/?debug", { waitUntil: "networkidle0" });
await sleep(500);
const after = await page.evaluate(() => localStorage.getItem("math-adventure-3d.progress.v1"));
const hasContinue = await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => /Continue Adventure/i.test(b.textContent)));
assert.equal(after, before, "saved progress must be identical after server restart");
assert.ok(hasContinue, "Continue Adventure available");
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Continue Adventure/i.test(b.textContent)).click());
await page.waitForFunction(() => !window.__mathGame.store.get().loading, { timeout: 30000 });
const st = await page.evaluate(() => { const s = window.__mathGame.store.get(); const rt = window.__mathGame.rt; return { cp: s.progress.checkpoints["1"], coins: s.progress.collected["1"], z: rt.pos.z }; });
console.log("restored:", JSON.stringify(st));
assert.equal(st.cp, "cp1");
assert.ok(st.coins.includes("c7"));
assert.ok(Math.abs(st.z - -14) < 1.5, "Continue puts the player at the saved checkpoint");
console.log("PASS: progress and checkpoint survive a server restart");
await browser.close();
