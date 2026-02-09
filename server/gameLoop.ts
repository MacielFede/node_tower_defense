import { randomUUID } from "crypto";
import { GameState } from "./types.ts";

export type WaveState = "waiting" | "spawning" | "active";

export type GameSnapshot = {
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

export const startGameLoop = (
  onSnapshot?: (snapshot: GameSnapshot) => void
) => {
  console.log("initializing game loop");
  const gameState = new GameState();
  const gameTickInterval = 500; // milliseconds

  // Store base cooldown values for each tower (in milliseconds)
  const towerBaseCooldowns = new Map<string, number>();

  const tower = {
    cooldown: 0, // ms remaining
    damage: 50,
    id: "MyTower",
    location: { x: 3, y: 4 },
    range: 5,
  };

  const baseCooldown = 1000; // milliseconds
  towerBaseCooldowns.set(tower.id, baseCooldown);
  tower.cooldown = 0;
  gameState.spawnTower(tower);

  // Wave system configuration
  let currentWave = 0;
  let waveState: WaveState = "waiting";
  let enemiesToSpawn = 0;
  let enemiesSpawned = 0;
  let nextSpawnTimeMs = 0;
  let waveStartTimeMs = Date.now();

  const waveConfig = {
    timeBetweenWaves: 5000,
    timeBetweenSpawns: 1000,
    baseEnemiesPerWave: 5,
    enemyHealthScaling: 20,
    enemySpeedScaling: 1,
    baseEnemyHealth: 100,
    baseEnemySpeed: 10,
  };

  const startWave = () => {
    currentWave++;
    waveState = "spawning";
    enemiesToSpawn =
      waveConfig.baseEnemiesPerWave + Math.floor(currentWave * 1.5);
    enemiesSpawned = 0;
    nextSpawnTimeMs = Date.now();
    waveStartTimeMs = Date.now();
  };

  const spawnNextEnemyInWave = () => {
    if (enemiesSpawned >= enemiesToSpawn) return;
    const enemyId = randomUUID();
    const enemyHealth =
      waveConfig.baseEnemyHealth + currentWave * waveConfig.enemyHealthScaling;
    const enemySpeed =
      waveConfig.baseEnemySpeed + currentWave * waveConfig.enemySpeedScaling;
    gameState.spawnEnemy(enemyId, enemyHealth, enemySpeed);
    enemiesSpawned++;

    if (enemiesSpawned < enemiesToSpawn) {
      nextSpawnTimeMs = Date.now() + waveConfig.timeBetweenSpawns;
    } else {
      waveState = "active";
    }
  };

  const snapshot = (): GameSnapshot => {
    return {
      serverTimeMs: Date.now(),
      userHealth: gameState.userHealth,
      wave: {
        currentWave,
        state: waveState,
        enemiesToSpawn,
        enemiesSpawned,
        nextSpawnTimeMs,
        waveStartTimeMs,
        config: waveConfig,
      },
      grid: gameState.getGrid(),
      path: gameState.getPath(),
      enemies: gameState.getEnemies().map((e) => ({ ...e })),
      towers: gameState.getTowers().map((t) => ({
        ...t,
        baseCooldownMs: towerBaseCooldowns.get(t.id) ?? 0,
      })),
    };
  };

  const emit = () => onSnapshot?.(snapshot());

  const firstWaveTimeout = setTimeout(() => {
    startWave();
    emit();
  }, 2000);

  const gameInterval = setInterval(() => {
    if (gameState.userHealth <= 0) {
      emit();
      clearInterval(gameInterval);
      clearTimeout(firstWaveTimeout);
      return;
    }

    const now = Date.now();

    // Wave management
    if (waveState === "waiting") {
      if (now - waveStartTimeMs >= waveConfig.timeBetweenWaves) {
        startWave();
      }
    } else if (waveState === "spawning") {
      if (now >= nextSpawnTimeMs) {
        spawnNextEnemyInWave();
      }
    } else if (waveState === "active") {
      if (gameState.getEnemyCount() === 0) {
        waveState = "waiting";
        waveStartTimeMs = Date.now();
      }
    }

    // Mechanics
    gameState.moveEnemysForward();
    gameState.getTowers().forEach((tower) => {
      tower.cooldown = Math.max(0, tower.cooldown - gameTickInterval);
      if (tower.cooldown !== 0) return;

      const enemyId = gameState.targetEnemy(tower.location, tower.range);
      if (!enemyId) return;

      gameState.fireEnemy(tower.damage, enemyId);
      tower.cooldown = towerBaseCooldowns.get(tower.id) ?? 0;
    });

    emit();
  }, gameTickInterval);

  // Emit initial snapshot immediately (wave 0, waiting)
  emit();

  return {
    stop: () => {
      clearInterval(gameInterval);
      clearTimeout(firstWaveTimeout);
    },
    getSnapshot: snapshot,
  };
};
