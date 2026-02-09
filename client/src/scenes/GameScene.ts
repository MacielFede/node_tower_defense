import Phaser from "phaser";

type WaveState = "waiting" | "spawning" | "active";

type GameSnapshot = {
  serverTimeMs: number;
  userHealth: number;
  wave: {
    currentWave: number;
    state: WaveState;
    enemiesToSpawn: number;
    enemiesSpawned: number;
    nextSpawnTimeMs: number;
    waveStartTimeMs: number;
    config: {
      timeBetweenWaves: number;
      timeBetweenSpawns: number;
      baseEnemiesPerWave: number;
      enemyHealthScaling: number;
      enemySpeedScaling: number;
      baseEnemyHealth: number;
      baseEnemySpeed: number;
    };
  };
  grid: number[][];
  path: { x: number; y: number }[];
  enemies: {
    id: string;
    name: string;
    location: number;
    health: number;
    speed: number;
  }[];
  towers: {
    id: string;
    location: { x: number; y: number };
    range: number;
    cooldown: number;
    damage: number;
    baseCooldownMs: number;
  }[];
};

export class GameScene extends Phaser.Scene {
  private ws: WebSocket | null = null;
  private latestSnapshot: GameSnapshot | null = null;
  private snapshotDirty = false;

  // Rendering config
  private readonly cellSize = 48;
  private readonly gridOrigin = { x: 70, y: 70 };

  private gGrid!: Phaser.GameObjects.Graphics;
  private gEntities!: Phaser.GameObjects.Graphics;

  private hudText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.gGrid = this.add.graphics();
    this.gEntities = this.add.graphics();

    this.hudText = this.add
      .text(24, 18, "", {
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        fontSize: "16px",
        color: "#e6eefc",
      })
      .setDepth(10);
    this.connectWebSocket();
    this.renderFrame();
  }

  update() {
    if (this.snapshotDirty) {
      this.snapshotDirty = false;
      this.renderFrame();
    }
  }

  private connectWebSocket() {
    const url = `ws://${window.location.hostname}:3000/ws`;
    this.ws = new WebSocket(url);

    this.ws.addEventListener("message", (evt) => {
      try {
        const msg = JSON.parse(String(evt.data));
        if (msg?.type === "snapshot" && msg.snapshot) {
          this.latestSnapshot = msg.snapshot as GameSnapshot;
          this.snapshotDirty = true;
        }
      } catch {
        // ignore malformed messages
      }
    });

    this.ws.addEventListener("close", () => {
      this.ws = null;
    });
  }

  private renderFrame() {
    this.gGrid.clear();
    this.gEntities.clear();

    if (this.latestSnapshot) {
      this.drawGridAndPath(this.latestSnapshot);
      this.drawTowers(this.latestSnapshot);
      this.drawEnemies(this.latestSnapshot);
    }
    this.drawHud(this.latestSnapshot);
  }

  private drawGridAndPath(snapshot: GameSnapshot) {
    const grid = snapshot.grid;

    // background tiles
    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid[x]!.length; y++) {
        const cell = grid[x]![y]!;
        const fill = cell === 1 ? 0x131a2a : 0x0f2a22; // wall vs road
        const alpha = 1;

        const px = this.gridOrigin.x + x * this.cellSize;
        const py = this.gridOrigin.y + y * this.cellSize;

        this.gGrid.fillStyle(fill, alpha);
        this.gGrid.fillRoundedRect(
          px,
          py,
          this.cellSize - 2,
          this.cellSize - 2,
          8
        );
      }
    }

    // path overlay
    const path = snapshot.path;
    this.gGrid.lineStyle(6, 0x2dd4bf, 0.5);
    for (let i = 0; i < path.length - 1; i++) {
      const a = this.cellCenter(path[i]!);
      const b = this.cellCenter(path[i + 1]!);
      this.gGrid.strokeLineShape(new Phaser.Geom.Line(a.x, a.y, b.x, b.y));
    }
  }

  private drawTowers(snapshot: GameSnapshot) {
    const towers = snapshot.towers;
    towers.forEach((tower) => {
      const c = this.cellCenter(tower.location);

      // range ring
      const r = (tower.range + 0.5) * this.cellSize;
      this.gEntities.lineStyle(2, 0x60a5fa, 0.35);
      this.gEntities.strokeCircle(c.x, c.y, r);

      // body
      this.gEntities.fillStyle(0x60a5fa, 1);
      this.gEntities.fillCircle(c.x, c.y, 12);

      // cooldown indicator
      const base = tower.baseCooldownMs || 1;
      const pct = Phaser.Math.Clamp(1 - tower.cooldown / base, 0, 1);
      this.gEntities.fillStyle(0x0b0f17, 0.9);
      this.gEntities.fillCircle(c.x, c.y, 7);
      this.gEntities.fillStyle(0xfbbf24, 1);
      this.gEntities.fillCircle(c.x, c.y, 7 * pct);
    });
  }

  private drawEnemies(snapshot: GameSnapshot) {
    const enemies = snapshot.enemies;
    const path = snapshot.path;

    enemies.forEach((enemy) => {
      const p = path[enemy.location];
      if (!p) return;

      const c = this.cellCenter(p);

      // body
      this.gEntities.fillStyle(0xf87171, 1);
      this.gEntities.fillCircle(c.x, c.y, 10);

      // health bar
      const maxHealth =
        snapshot.wave.config.baseEnemyHealth +
        snapshot.wave.currentWave * snapshot.wave.config.enemyHealthScaling;
      const hpPct = Phaser.Math.Clamp(enemy.health / maxHealth, 0, 1);
      const barW = 26;
      const barH = 5;
      const x = c.x - barW / 2;
      const y = c.y - 18;

      this.gEntities.fillStyle(0x111827, 0.9);
      this.gEntities.fillRoundedRect(x, y, barW, barH, 3);
      this.gEntities.fillStyle(0x22c55e, 0.95);
      this.gEntities.fillRoundedRect(x, y, barW * hpPct, barH, 3);
    });
  }

  private drawHud(snapshot: GameSnapshot | null) {
    if (!snapshot) {
      this.hudText.setText(
        `Connecting to server...\nExpected: ws://${window.location.hostname}:3000/ws`
      );
      return;
    }

    const cfg = snapshot.wave.config;
    const nextWaveIn =
      snapshot.wave.state === "waiting"
        ? Math.max(
            0,
            Math.ceil(
              (cfg.timeBetweenWaves -
                (snapshot.serverTimeMs - snapshot.wave.waveStartTimeMs)) /
                1000
            )
          )
        : 0;

    const text = snapshot.userHealth <= 0 ? `Game Over\n` : "";

    this.hudText.setText(
      `${text}Health: ${snapshot.userHealth}\n` +
        `Wave: ${snapshot.wave.currentWave} (${snapshot.wave.state})\n` +
        `Enemies: ${snapshot.enemies.length}\n` +
        (snapshot.wave.state === "waiting"
          ? `Next wave in: ${nextWaveIn}s`
          : "")
    );
  }

  private cellCenter(p: { x: number; y: number }) {
    return {
      x: this.gridOrigin.x + p.x * this.cellSize + this.cellSize / 2,
      y: this.gridOrigin.y + p.y * this.cellSize + this.cellSize / 2,
    };
  }
}
