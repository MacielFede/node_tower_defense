import { randomUUID } from "crypto";
import { GameState } from "./types.ts";

export const gameLoop = () => {
  console.log("initializing game loop");
  const gameState = new GameState();
  const gameTickInterval = 500; // milliseconds

  // Store base cooldown values for each tower (in milliseconds)
  const towerBaseCooldowns = new Map<string, number>();

  const tower = {
    cooldown: 0, // Current cooldown timer (starts at 0 so it can fire immediately)
    damage: 50,
    id: "MyTower",
    location: { x: 3, y: 4 },
    range: 5,
  };

  // Store the base cooldown (e.g., 1000ms = 1 second between shots)
  // You can adjust this value - 0 means no cooldown, higher values mean longer wait
  const baseCooldown = 1000; // milliseconds
  towerBaseCooldowns.set(tower.id, baseCooldown);
  tower.cooldown = 0; // Start with cooldown at 0 so tower can fire immediately

  gameState.spawnTower(tower);

  // Wave system configuration
  let currentWave = 0;
  let waveState: "waiting" | "spawning" | "active" = "waiting";
  let enemiesToSpawn = 0;
  let enemiesSpawned = 0;
  let nextSpawnTime = 0;
  let waveStartTime = Date.now();

  const waveConfig = {
    timeBetweenWaves: 5000, // 5 seconds between waves
    timeBetweenSpawns: 1000, // 1 second between enemy spawns in a wave
    baseEnemiesPerWave: 5, // Starting number of enemies per wave
    enemyHealthScaling: 20, // Health increases by this amount per wave
    enemySpeedScaling: 1, // Speed increases by this amount per wave
    baseEnemyHealth: 100,
    baseEnemySpeed: 10,
  };

  const startWave = () => {
    currentWave++;
    console.log(`\n=== Starting Wave ${currentWave} ===`);
    waveState = "spawning";
    enemiesToSpawn =
      waveConfig.baseEnemiesPerWave + Math.floor(currentWave * 1.5);
    enemiesSpawned = 0;
    nextSpawnTime = Date.now();
    waveStartTime = Date.now();
  };

  const spawnNextEnemyInWave = () => {
    if (enemiesSpawned < enemiesToSpawn) {
      const enemyId = randomUUID();
      // Scale enemy stats based on wave number
      const enemyHealth =
        waveConfig.baseEnemyHealth +
        currentWave * waveConfig.enemyHealthScaling;
      const enemySpeed =
        waveConfig.baseEnemySpeed + currentWave * waveConfig.enemySpeedScaling;

      gameState.spawnEnemy(enemyId, enemyHealth, enemySpeed);
      enemiesSpawned++;
      console.log(
        `Wave ${currentWave}: Spawned enemy ${enemiesSpawned}/${enemiesToSpawn} (Health: ${enemyHealth}, Speed: ${enemySpeed})`
      );

      if (enemiesSpawned < enemiesToSpawn) {
        nextSpawnTime = Date.now() + waveConfig.timeBetweenSpawns;
      } else {
        waveState = "active";
        console.log(
          `Wave ${currentWave}: All enemies spawned. Wave is now active.`
        );
      }
    }
  };

  // Start the first wave after initial delay
  setTimeout(() => {
    startWave();
  }, 2000);
  const gameInterval = setInterval(() => {
    if (gameState.userHealth <= 0) {
      console.log("Game Over! Player health reached 0.");
      clearInterval(gameInterval);
      return;
    }

    const currentTime = Date.now();

    // Wave management logic
    if (waveState === "waiting") {
      // Check if it's time to start the next wave
      if (currentTime - waveStartTime >= waveConfig.timeBetweenWaves) {
        startWave();
      }
    } else if (waveState === "spawning") {
      // Spawn enemies at intervals
      if (currentTime >= nextSpawnTime) {
        spawnNextEnemyInWave();
      }
    } else if (waveState === "active") {
      // Check if wave is complete (all enemies killed or reached end)
      if (gameState.getEnemyCount() === 0) {
        console.log(`Wave ${currentWave} completed!`);
        waveState = "waiting";
        waveStartTime = Date.now();
      }
    }

    // Game mechanics
    gameState.moveEnemysForward();
    gameState.getTowers().forEach((tower) => {
      // Decrement cooldown by the game tick interval
      tower.cooldown = Math.max(0, tower.cooldown - gameTickInterval);

      // Only fire if cooldown is 0 and there's a target
      if (tower.cooldown === 0) {
        const enemyId = gameState.targetEnemy(tower.location, tower.range);
        if (enemyId) {
          gameState.fireEnemy(tower.damage, enemyId);
          // Reset cooldown to base value after firing
          const baseCooldown = towerBaseCooldowns.get(tower.id) || 0;
          tower.cooldown = baseCooldown;
        }
      }
    });
  }, gameTickInterval);
};
