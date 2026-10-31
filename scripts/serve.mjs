// Tiny static file server for the exported game. No dependencies: only Node.js.
// Binds to 127.0.0.1 so the game is NOT reachable from other computers.
//   node scripts/serve.mjs [--open] [--port=3210]
import { createServer } from "node:http";
import { readFile, stat, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { exec } from "node:child_process";
import { extname, join, normalize, resolve, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
// The exported game lives in ./out (development folder) or ./game (school package).
const siteDir = [join(root, "out"), join(root, "game")].find((d) => existsSync(join(d, "index.html")));
const pidFile = join(root, ".server.pid");

if (!siteDir) {
  console.error("\n[ERROR] The game has not been built yet (no out/index.html found).");
  console.error("        Run build.bat first, or copy a prepared school package.\n");
  process.exit(1);
}

const args = process.argv.slice(2);
const wantOpen = args.includes("--open");
const portArg = args.find((a) => a.startsWith("--port="));
const startPort = Number(portArg?.split("=")[1] ?? process.env.PORT ?? 3210);
const HOST = "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".wasm": "application/wasm",
  ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".woff2": "font/woff2", ".woff": "font/woff", ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg", ".wav": "audio/wav", ".map": "application/json",
};

async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const target = normalize(join(siteDir, clean));
  if (target !== siteDir && !target.startsWith(siteDir + sep)) return null; // path traversal guard
  const candidates = [target, target + ".html", join(target, "index.html")];
  for (const c of candidates) {
    try {
      if ((await stat(c)).isFile()) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }
    const file = await resolveFile(req.url ?? "/");
    if (!file) {
      const nf = join(siteDir, "404.html");
      const body = existsSync(nf) ? await readFile(nf) : Buffer.from("Not found");
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(body);
      return;
    }
    const data = await readFile(file);
    const immutable = file.includes(`${sep}_next${sep}static${sep}`);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch (err) {
    console.error("Request error:", err);
    res.writeHead(500).end("Server error");
  }
});

function listen(port, attemptsLeft) {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      listen(port + 1, attemptsLeft - 1);
    } else {
      console.error("\n[ERROR] Could not start the server:", err.message, "\n");
      process.exit(1);
    }
  });
  server.listen(port, HOST, async () => {
    const url = `http://${HOST}:${port}/`;
    await writeFile(pidFile, String(process.pid)).catch(() => {});
    console.log("\n==============================================");
    console.log("  Math Adventure 3D is running (offline mode)");
    console.log(`  Open:  ${url}`);
    console.log("  Keep this window open while playing.");
    console.log("  Close this window (or run stop-game.bat) to stop.");
    console.log("==============================================\n");
    if (wantOpen) exec(`start "" "${url}"`);
  });
}

const cleanup = () => {
  unlink(pidFile).catch(() => {}).finally(() => process.exit(0));
};
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

listen(startPort, 15);
