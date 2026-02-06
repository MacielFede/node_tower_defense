import { randomUUID } from "crypto";
import { GameState } from "./types.ts";

export const gameLoop = () => {
  console.log("initializing game loop");
  const gameState = new GameState();
  // setInterval(() => {
  // gameState.spawnEnemy(randomUUID())
  // gameState.moveEnemysForward()
  // }, 500);
};
