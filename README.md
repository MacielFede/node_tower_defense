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
- `server/index.ts` – Express + WebSocket server:
  - Runs the authoritative simulation once
  - Streams state snapshots to clients over WebSockets (`/ws`)

**Run the server**

From the repo root:

```bash
cd server
npm install
npm start
```

Then open `http://localhost:3000` (optional) and/or connect a client to `ws://localhost:3000/ws`.

---

## Phaser client

The client is a **Phaser 3 + TypeScript** app that recreates the same simulation locally in the browser and renders:

- The **grid and path**
- The **tower**, its **range ring**, and a **cooldown indicator**
- **Enemies** moving along the path with simple health bars
- **Wave state** (waiting/spawning/active), enemy counts, and player health as HUD

> Note: The client connects to the server via WebSockets and renders the server’s authoritative snapshots.

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

