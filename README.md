## Node Tower Defense

A small **tower defense experiment** with:

- **Server-side simulation** (TypeScript + Express)
- **Phaser client** (TypeScript + Vite) that visually mirrors the same logic

The core game loop runs waves of enemies along a grid path, with a tower that has range and cooldown-based firing.

---

## Server (game simulation)

**Tech stack**

- Node.js (ESM)
- TypeScript
- Express
- `tsx` for running TS directly

**Key files**

- `server/types.ts` – `GameState` class with:
  - Grid and BFS path-finding from `start` to `end`
  - Enemies (position along the path, health, speed)
  - Towers (location, range, cooldown, damage)
  - Methods like `moveEnemysForward`, `spawnEnemy`, `spawnTower`, `targetEnemy`, `fireEnemy`
- `server/gameLoop.ts` – tick-based loop:
  - Spawns waves of enemies with scaling health/speed
  - Moves enemies each tick
  - Lets towers fire based on cooldown and range
  - Decrements player health when enemies reach the end
- `server/index.ts` – minimal Express server that starts the game loop when `/` is hit.

**Run the server**

From the repo root:

```bash
npm install            # installs root dev deps (TypeScript, tsx, etc.)
npm start              # runs ./server/index.ts via tsx
```

Then open `http://localhost:3000` – this will start the game loop on the server and log activity (waves, enemy hits, etc.) in the console.

---

## Phaser client

The client is a **Phaser 3 + TypeScript** app that recreates the same simulation locally in the browser and renders:

- The **grid and path**
- The **tower**, its **range ring**, and a **cooldown indicator**
- **Enemies** moving along the path with simple health bars
- **Wave state** (waiting/spawning/active), enemy counts, and player health as HUD

> Note: Right now the client runs its own simulation (no network connection to the Express server). It mirrors the server-side logic but is not yet authoritative-server driven.

**Client layout**

- `client/src/sim/GameState.ts` – browser-friendly copy of the server `GameState`
- `client/src/scenes/GameScene.ts` – Phaser scene:
  - Grid/path rendering
  - Wave management and enemy spawning
  - Cooldown-based tower firing
  - HUD text
- `client/src/main.ts` – Phaser bootstrapping

**Run the client**

From the repo root:

```bash
cd client
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

---

## Next steps / ideas

- Wire the Phaser client to the **server’s authoritative GameState** via REST/WebSockets.
- Add **multiple towers**, different tower types, and basic placement UI.
- Introduce more enemy types, status effects, and tower upgrades.

