import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0b0f17",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 980,
    height: 620,
  },
  scene: [GameScene],
};

new Phaser.Game(config);

// Wire up "Start Game" button to call the server /start-game endpoint
const button = document.getElementById(
  "start-game-btn"
) as HTMLButtonElement | null;
const statusEl = document.getElementById("start-game-status");

if (button) {
  button.addEventListener("click", async () => {
    button.disabled = true;
    if (statusEl) statusEl.textContent = "Starting game...";
    try {
      const res = await fetch("http://localhost:3000/start-game", {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (statusEl) statusEl.textContent = "Game started!";
    } catch (err) {
      console.error(err);
      if (statusEl)
        statusEl.textContent = "Failed to start game (check server)";
      button.disabled = false;
    }
  });
}
