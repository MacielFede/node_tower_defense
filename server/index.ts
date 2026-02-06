import express  from "express";
import { gameLoop } from "./gameLoop.ts";

const app = express();
const PORT = 3000;

app.get("/", (_, res) => {
  gameLoop()
  res.send("Hello from the TypeScript Express server! GameLoop should've started.");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
