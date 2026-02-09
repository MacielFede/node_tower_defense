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
