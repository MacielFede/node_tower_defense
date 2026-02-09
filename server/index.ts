import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { startGameLoop, type GameSnapshot } from "./gameLoop.ts";

const app = express();
const PORT = 3000;

// Simple CORS so the Vite client (usually http://localhost:5173) can call POST /start-game
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

const broadcast = (snapshot: GameSnapshot) => {
  latestSnapshot = snapshot;
  const payload = JSON.stringify({ type: "snapshot", snapshot });
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.send(payload);
  });
};

app.get("/", (_, res) => {
  res.send(
    "Server is running. Connect the Phaser client via WebSocket at /ws."
  );
});

app.post("/start-game", (_, res) => {
  // Start authoritative simulation once
  startGameLoop(broadcast);
  res.send("Game loop started!");
});

const server = http.createServer(app);

// --- WebSocket server ---
const wss = new WebSocketServer({ server, path: "/ws" });
let latestSnapshot: GameSnapshot | null = null;

wss.on("connection", (socket) => {
  // Send the latest snapshot immediately so the client can render without waiting
  console.log("Connection made!");
  if (latestSnapshot) {
    socket.send(JSON.stringify({ type: "snapshot", snapshot: latestSnapshot }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
