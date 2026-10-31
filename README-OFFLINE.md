# Math Adventure 3D: The Lost Kingdom - offline guide

A fully 3D, third-person adventure that teaches **HCF** (Highest Common Factor) and **LCM** (Lowest Common Multiple) to Class 6 and Class 7 students. It runs on one Windows laptop with **no internet connection** during play.

---

## 1. Game overview

Pip, an original cartoon explorer, travels through four worlds to restore the Lost Kingdom. Maths is never a quiz screen: every puzzle is a machine, a fountain or a gate you operate inside the 3D world.

| World | Place | What you do |
|---|---|---|
| 1 | The Enchanted Kingdom | Learn to run, jump, pull a lever, collect coins, and open the coin-powered Crystal Gate |
| 2 | HCF Crystal Cave | Three crystal machines. Choose a group size, watch the crystals regroup, find the *greatest* size that leaves none over |
| 3 | LCM Magic Garden | Three stone lanes with 2-3 fountains. Walk the numbered stones, watch which fountains spray, and lock in the *first* stone where they all spray together |
| 4 | The Final Math Temple | Moving platforms and spinning bars, one HCF lock and one LCM lock; the Final Seal opens only when **both** are solved |

## 2. Features and learning objectives

- Third-person camera, WASD running, jumping with gravity, real collisions, checkpoints, respawn after falling, moving platforms, hazards.
- Collectibles: coins (open gates), gems (puzzle rewards), hidden stars.
- Learning objectives: find common factors by sharing into equal groups; understand "greatest" (HCF) vs "first" (LCM); see multiples as repeating events; connect HCF and LCM (`HCF x LCM = a x b` for two numbers, shown on the *Learn* page).
- Every puzzle: in-world introduction -> experiment -> instant visual feedback -> friendly explanation of mistakes -> hint after 2 and 4 failed attempts -> reward -> explanation card generated from the real numbers.
- **Class 6 / Class 7** selector on the main menu: Class 7 swaps in harder number pairs (cave puzzle 1 uses 84 and 126, garden puzzle 1 uses 6 and 9).
- Save/continue, new game, restart level, reset (with confirmation), pause menu, controls reference, three graphics presets, volume + mute, FPS counter.
- Maths is validated in code only (`src/utils/math.ts`, `src/systems/puzzles/validate.ts`): Euclid's algorithm for HCF, `LCM = |a x b| / HCF` for LCM, with invalid input (zero, negative, non-integer) rejected.

## 3. Technology stack (exact versions installed)

Next.js 16.4.3 (static export), React 19.3.0, TypeScript 5, three 0.186.1, @react-three/fiber 9.8.2, @react-three/drei 10.7.9, @react-three/rapier 2.2.0 (Rapier physics `@dimforge/rapier3d-compat` 0.19.2, WASM embedded in the JavaScript bundle). Plain CSS, no CSS framework. Progress is stored in the browser's `localStorage`. Sound is synthesised with the Web Audio API.

**Why a static export?** `next build` with `output: "export"` produces a plain `out/` folder. A 100-line Node script (`scripts/serve.mjs`, no dependencies) serves it from `127.0.0.1`, so the school laptop does not need `node_modules`, `npm`, or a Next.js server. (`next start` is not used.)

## 4. Project structure

```
src/app/               Next.js shell (layout, page, global CSS, icon)
src/components/
  game/                GameRoot, GameCanvas (Canvas + physics), WorldScene, KeyboardController
  character/           Explorer (procedural character + animation), PlayerController (physics movement)
  camera/              FollowCamera (orbit + wall avoidance)
  environment/         StaticGeometry (instanced level), Decor (instanced trees/rocks/grass), Scenery, Sky, Lighting, Movers
  interactions/        Collectibles, Lever, Gate, Checkpoint, GoalPortal, PickupFx, useInteractable
  puzzles/             CrystalMachine (HCF), LaneStation (LCM), RewardGems
  hud/                 Hud (+ minimap), PuzzleUi (machine panel, result card, intro)
  menus/               MainMenu, Overlays (pause/settings/confirm), Screens, LoadingScreen, Icons
src/systems/
  puzzles/             validate.ts (the only place success is decided), crystalLayout.ts, laneStore.ts
  progression/         gameStore.ts (state + actions), loadingStore.ts
  save/                progress.ts (schema, sanitising loader), storage.ts (safe localStorage)
  audio/ input/ physics/ runtime/ quality.ts store.ts
src/data/levels/       the four worlds as data (kingdom, cave, garden, temple)
src/data/puzzles.ts    every puzzle definition
src/types/ src/utils/
scripts/               serve.mjs (offline server), test-math.mjs, playtest.mjs, uitest.mjs, perf-test.mjs, browser-test.mjs
install.bat build.bat start-game.bat stop-game.bat make-school-package.bat
```

`public/assets/{models,textures,audio,fonts}` is intentionally empty: see the asset inventory in section 17.

## 5. Required Node.js

**Node.js 20.9 or newer** (Next.js 16 requirement). Developed and tested with Node 24.21.0 / npm 11.19.0 on Windows 11. Needs 64-bit Windows 10 or 11.

## 6. Installation (needs internet - do this on a connected computer)

1. Install Node.js (LTS) from nodejs.org.
2. Double-click **install.bat** (runs `npm install`).

## 7. Production build (works offline once installed)

Double-click **build.bat** (runs `npm run build`). The game is written to the `out` folder.

## 8. Running the game offline

Double-click **start-game.bat**. A black server window opens and your default browser opens `http://127.0.0.1:3210/`. Keep the black window open while playing. To stop: close that window, or run **stop-game.bat**.

The server only listens on `127.0.0.1`, so other computers cannot reach it. Nothing in the game makes a network request except loading its own files from that address.

## 9. Copying the game to the school laptop

On the connected computer:

1. Run `build.bat`, then **make-school-package.bat**. It creates `school-package/` containing the built game, the tiny server, the launcher scripts, this README, **and a copy of `node.exe`**.
2. Copy the whole `school-package` folder to a USB drive, then to the laptop (for example `C:\MathAdventure`).
3. On the laptop, double-click `start-game.bat`. No installation, no internet, no administrator rights needed.

(If you would rather install Node on the laptop, copy the Node installer on the USB drive and delete the `node` folder from the package.)

## 10. Controls

| Key | Action |
|---|---|
| W A S D | Run |
| Space | Jump (hold longer to jump higher) |
| E | Use the thing you are next to (lever, machine, stone, portal) |
| Mouse drag (hold button on the game) or arrow keys | Look around |
| Esc | Pause menu |
| In a crystal machine: A/D or Left/Right (+-1), W/S or Up/Down (+-5), Enter or E to test, Esc to leave | |

## 11. Graphics settings

| Preset | Render scale | Shadows | Scenery density | Notes |
|---|---|---|---|---|
| Low | 0.75x | off | 35% | default on Intel/unknown GPUs |
| Medium | 1x | 1024 px shadow map, short range | 70% | default on NVIDIA/AMD |
| High | up to 1.5x, antialiasing | 2048 px | 100% | for machines with a graphics card |

The first launch chooses Low or Medium automatically from the GPU name (Intel/unknown/software -> Low). Change it any time in **Settings**. Turn on **FPS counter** there for troubleshooting.

## 12. How saved progress works

Progress (unlocked/completed worlds, collected coins/gems/stars, solved puzzles, last checkpoint) and settings are saved automatically in the browser's `localStorage`, under the keys `math-adventure-3d.progress.v1` and `math-adventure-3d.settings.v1`. Corrupted data is ignored and replaced with a fresh game.

**Important:** browsers keep storage *per address*. Always use the same browser and the same address (`http://127.0.0.1:3210/`). If port 3210 is busy the server silently uses 3211, 3212... and progress saved on another port will not appear. Close the other program, or restart the computer, to get port 3210 back. Clearing "site data" or using a private window also removes/ignores progress.

## 13. Troubleshooting

- **Black screen / "3D graphics are not available"**: use current Chrome or Edge, update the graphics driver, and make sure *Use hardware acceleration* is on (browser Settings -> System). Then reload (F5).
- **Slow or choppy**: Settings -> Graphics -> Low. Close other tabs and programs. Enable the FPS counter to check.
- **Window says "Missing assets" / blank page**: the `out` (or `game`) folder is incomplete. Rebuild with `build.bat`, or copy the whole `school-package` folder again.
- **"Port busy" message**: another copy is running (run `stop-game.bat`) or another program uses port 3210. The game will move to the next free port automatically (see the warning in section 12). You can force a port with `node scripts\serve.mjs --port=4000`.
- **start-game.bat says Node was not found**: put `node.exe` in a folder called `node` next to `start-game.bat`, or install Node.js.
- **Sound missing**: browsers only start sound after a click or key press; click once on the game. Check *Mute all* in Settings and the laptop volume.

## 14. Adding new HCF and LCM puzzles

1. Open `src/data/puzzles.ts` and add an entry:
   ```ts
   { id: "cave-4", kind: "hcf", numbers: [60, 84], rewardCoins: 5,
     title: "...", intro: "...", hints: ["first hint", "second hint"] }
   // LCM puzzles also need `steps` (lane length, must be >= the LCM)
   { id: "garden-4", kind: "lcm", numbers: [8, 12], steps: 30, ... }
   ```
   Do **not** write the answer anywhere: it is computed. Use `classes: [7]` to make a variant used only for Class 7 (it replaces the entry with the same `id`).
2. Add a station to a world in `src/data/levels/<world>.ts`: `{ type: "crystal", puzzleId, pos }` or `{ type: "lane", puzzleId, pos, spacing, fountainZ }`, and a gate requiring the flag `puzzle:<id>`.
3. Run `npm run test:math` - it checks every puzzle against every possible answer from 1 to 400 and that the lane is long enough.
4. Run `build.bat`.

## 15. Quality checks (run during development)

`npm run typecheck`, `npm run lint`, `npm run test:math`, then with the built game served (`node scripts/serve.mjs`): `node scripts/playtest.mjs <dir>` (45-check playthrough in headless Chrome), `node scripts/uitest.mjs <dir>` (25-check menu/settings/pause test), `node scripts/perf-test.mjs`. These need Google Chrome installed at its default path and are developer tools, not part of the school package.

## 16. Known limitations (honest list)

- **Not yet tested on the real target laptop** (Core i5 4th-7th gen, Intel HD graphics). All automated runs used headless Chrome with *software* WebGL (SwiftShader) on a modern PC. Software FPS numbers are not predictive. What was measured: 100-142 draw calls and 9k-32k triangles per frame depending on world and preset, about 20-35 MB JS heap, identical GPU-resource counts after re-entering worlds six times. Please test on the school laptop and use Low if needed.
- Only Chrome (headless) was tested. Edge uses the same engine; Firefox and Safari are untested.
- Sound is generated by code. It runs without errors, but nobody has listened to it yet (headless browser); volumes/tones may need tuning.
- Camera look is mouse drag or arrow keys (no pointer lock). No gamepad or touch support.
- Moving platforms/spinning bars were tested for carrying and blocking by script, not for fairness/difficulty with real students.
- Teleporting was used by the automated test to skip long walks; real walking was tested for movement, jumping, the hedge, the bridge, lane stepping and moving-platform riding, but a full start-to-finish walk by a human has not been done.
- Two harmless notices from third-party libraries (`THREE.Clock` deprecation, Rapier init parameters) may appear in the browser console log.
- The loading screen shows real stages (renderer, physics, first frames), but worlds are generated in code so loading is very short; "load only the current world" is satisfied by the structure (each world is separate data and a fresh 3D canvas), not by downloading files.
- Character and world art are simple low-poly primitives made in code rather than modelled GLB assets.
- Class 6 / Class 7 differ by only two puzzle variants.

## 17. Asset inventory

**Models:** none. Every object (character, castle, trees, rocks, crystals, fountains, machines, gates) is built in code from three.js primitives. **Textures:** none as files; the numbered-stone atlas is drawn at runtime on a local canvas. **Audio:** none as files; all effects and the background loop are synthesised at runtime (Web Audio API). **Fonts:** none bundled; the interface uses the system fonts "Trebuchet MS" / "Segoe UI" / Verdana (installed with Windows) with generic fallbacks. **Icons/logo:** inline SVG written for this project. No third-party art, music, or models are included, and nothing copies a commercial character.

Third-party code (bundled into the build; licences allow redistribution):

| Package | Licence |
|---|---|
| next, react, react-dom | MIT |
| three, @react-three/fiber, @react-three/drei, @react-three/rapier | MIT |
| @dimforge/rapier3d-compat (Rapier physics, WASM inlined) | Apache-2.0 |
| Node.js `node.exe` copied into the school package | MIT (Node.js licence) |
