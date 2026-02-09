import Phaser from "phaser";
import { GameState, type Point, type Tower } from "../sim/GameState";

type WaveState = "waiting" | "spawning" | "active";

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;

  private readonly gameTickIntervalMs = 500;
  private towerBaseCooldowns = new Map<string, number>();

  private currentWave = 0;
  private waveState: WaveState = "waiting";
  private enemiesToSpawn = 0;
  private enemiesSpawned = 0;
  private nextSpawnTimeMs = 0;
  private waveStartTimeMs = 0;

  private readonly waveConfig = {
    timeBetweenWaves: 5000,
    timeBetweenSpawns: 1000,
    baseEnemiesPerWave: 5,
    enemyHealthScaling: 20,
    enemySpeedScaling: 1,
    baseEnemyHealth: 100,
    baseEnemySpeed: 10,
  };

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
    this.gameState = new GameState();

    // One starter tower (mirrors server skeleton)
    const tower: Tower = {
      cooldown: 0,
      damage: 50,
      id: "MyTower",
      location: { x: 3, y: 4 },
      range: 5,
    };
    const baseCooldownMs = 1000;
    this.towerBaseCooldowns.set(tower.id, baseCooldownMs);
    this.gameState.spawnTower(tower);

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

    // Wave timing
    this.waveStartTimeMs = this.time.now;

    // Start first wave shortly after boot
    this.time.delayedCall(2000, () => {
      this.startWave();
    });

    // Tick loop (mirrors server gameLoop cadence)
    this.time.addEvent({
      delay: this.gameTickIntervalMs,
      loop: true,
      callback: () => this.tick(),
    });
  }

  private tick() {
    if (this.gameState.userHealth <= 0) return;

    // Wave management
    if (this.waveState === "waiting") {
      if (
        this.time.now - this.waveStartTimeMs >=
        this.waveConfig.timeBetweenWaves
      ) {
        this.startWave();
      }
    } else if (this.waveState === "spawning") {
      if (this.time.now >= this.nextSpawnTimeMs) {
        this.spawnNextEnemyInWave();
      }
    } else if (this.waveState === "active") {
      if (this.gameState.getEnemyCount() === 0) {
        this.waveState = "waiting";
        this.waveStartTimeMs = this.time.now;
      }
    }

    // Mechanics (movement + towers firing w/ cooldown)
    this.gameState.moveEnemysForward();
    this.gameState.getTowers().forEach((tower) => {
      tower.cooldown = Math.max(0, tower.cooldown - this.gameTickIntervalMs);
      if (tower.cooldown !== 0) return;

      const enemyId = this.gameState.targetEnemy(tower.location, tower.range);
      if (!enemyId) return;

      this.gameState.fireEnemy(tower.damage, enemyId);
      tower.cooldown = this.towerBaseCooldowns.get(tower.id) ?? 0;
    });

    this.renderFrame();
  }

  private startWave() {
    this.currentWave++;
    this.waveState = "spawning";
    this.enemiesToSpawn =
      this.waveConfig.baseEnemiesPerWave + Math.floor(this.currentWave * 1.5);
    this.enemiesSpawned = 0;
    this.nextSpawnTimeMs = this.time.now;
    this.waveStartTimeMs = this.time.now;
  }

  private spawnNextEnemyInWave() {
    if (this.enemiesSpawned >= this.enemiesToSpawn) return;

    const enemyId = crypto.randomUUID();
    const enemyHealth =
      this.waveConfig.baseEnemyHealth +
      this.currentWave * this.waveConfig.enemyHealthScaling;
    const enemySpeed =
      this.waveConfig.baseEnemySpeed +
      this.currentWave * this.waveConfig.enemySpeedScaling;

    this.gameState.spawnEnemy(enemyId, enemyHealth, enemySpeed);
    this.enemiesSpawned++;

    if (this.enemiesSpawned < this.enemiesToSpawn) {
      this.nextSpawnTimeMs = this.time.now + this.waveConfig.timeBetweenSpawns;
    } else {
      this.waveState = "active";
    }
  }

  private renderFrame() {
    this.gGrid.clear();
    this.gEntities.clear();

    this.drawGridAndPath();
    this.drawTowers();
    this.drawEnemies();
    this.drawHud();
  }

  private drawGridAndPath() {
    const grid = this.gameState.getGrid();

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
    const path = this.gameState.getPath();
    this.gGrid.lineStyle(6, 0x2dd4bf, 0.5);
    for (let i = 0; i < path.length - 1; i++) {
      const a = this.cellCenter(path[i]!);
      const b = this.cellCenter(path[i + 1]!);
      this.gGrid.strokeLineShape(new Phaser.Geom.Line(a.x, a.y, b.x, b.y));
    }
  }

  private drawTowers() {
    const towers = this.gameState.getTowers();
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
      const base = this.towerBaseCooldowns.get(tower.id) ?? 1;
      const pct = Phaser.Math.Clamp(1 - tower.cooldown / base, 0, 1);
      this.gEntities.fillStyle(0x0b0f17, 0.9);
      this.gEntities.fillCircle(c.x, c.y, 7);
      this.gEntities.fillStyle(0xfbbf24, 1);
      this.gEntities.fillCircle(c.x, c.y, 7 * pct);
    });
  }

  private drawEnemies() {
    const enemies = this.gameState.getEnemies();
    const path = this.gameState.getPath();

    enemies.forEach((enemy) => {
      const p = path[enemy.location];
      if (!p) return;

      const c = this.cellCenter(p);

      // body
      this.gEntities.fillStyle(0xf87171, 1);
      this.gEntities.fillCircle(c.x, c.y, 10);

      // health bar
      const maxHealth =
        this.waveConfig.baseEnemyHealth +
        this.currentWave * this.waveConfig.enemyHealthScaling;
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

  private drawHud() {
    const nextWaveIn =
      this.waveState === "waiting"
        ? Math.max(
            0,
            Math.ceil(
              (this.waveConfig.timeBetweenWaves -
                (this.time.now - this.waveStartTimeMs)) /
                1000
            )
          )
        : 0;

    const text = this.gameState.userHealth <= 0 ? `Game Over\n` : "";

    this.hudText.setText(
      `${text}Health: ${this.gameState.userHealth}\nWave: ${
        this.currentWave
      } (${this.waveState})\nEnemies: ${this.gameState.getEnemyCount()}\n` +
        (this.waveState === "waiting" ? `Next wave in: ${nextWaveIn}s` : "")
    );
  }

  private cellCenter(p: Point) {
    return {
      x: this.gridOrigin.x + p.x * this.cellSize + this.cellSize / 2,
      y: this.gridOrigin.y + p.y * this.cellSize + this.cellSize / 2,
    };
  }
}
