import "dotenv/config";
import express from "express";
import http from "node:http";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../../shared/socket.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("createRoom", ({ name }) => {
    const roomId = crypto.randomUUID();
    socket.data.playerId = crypto.randomUUID();
    socket.data.roomId = roomId;
    socket.join(roomId);

    socket.emit("roomJoined", {
      roomId,
      playerId: socket.data.playerId,
    });
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    socket.data.playerId = crypto.randomUUID();
    socket.data.roomId = roomId;
    socket.join(roomId);

    socket.emit("roomJoined", {
      roomId,
      playerId: socket.data.playerId,
    });
  });

  socket.on("makeMove", ({ roomId, from, to }) => {
    io.to(roomId).emit("gameStateUpdated", {
      fenLikeState: `${from}-${to}`,
    });
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../../client/dist");

app.use(express.static(clientDistPath));

app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDistPath, "index.html"));
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});