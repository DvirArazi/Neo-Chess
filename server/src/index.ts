import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Server, type Socket } from "socket.io";
import {
  getSessionUserByToken,
  logInWithPassword,
  revokeSession,
  signUpWithPassword,
} from "./auth/service.js";
import type {
  AuthenticatedUser,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
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

type ServerSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

function getAuthenticatedUser(socket: ServerSocket): AuthenticatedUser | null {
  if (!socket.data.userId || !socket.data.username) {
    return null;
  }

  return {
    id: socket.data.userId,
    username: socket.data.username,
  };
}

function emitAuthState(socket: ServerSocket): void {
  socket.emit("authStateChanged", {
    user: getAuthenticatedUser(socket),
  });
}

function clearSocketAuth(socket: ServerSocket): void {
  delete socket.data.userId;
  delete socket.data.username;
  delete socket.data.sessionId;
}

io.use(async (socket, next) => {
  try {
    const sessionToken = typeof socket.handshake.auth.sessionToken === "string"
      ? socket.handshake.auth.sessionToken
      : null;

    if (!sessionToken) {
      clearSocketAuth(socket);
      return next();
    }

    const sessionUser = await getSessionUserByToken(sessionToken);
    if (!sessionUser) {
      clearSocketAuth(socket);
      return next();
    }

    socket.data.userId = sessionUser.user.id;
    socket.data.username = sessionUser.user.username;
    socket.data.sessionId = sessionUser.sessionId;
    return next();
  } catch (error) {
    return next(error as Error);
  }
});

io.on("connection", (socket) => {
  emitAuthState(socket);

  socket.on("signUp", async (data, callback) => {
    try {
      const result = await signUpWithPassword(data);
      if (!result.ok) {
        callback(result);
        return;
      }

      socket.data.userId = result.user.id;
      socket.data.username = result.user.username;
      socket.data.sessionId = result.sessionId;

      callback({
        ok: true,
        user: result.user,
        sessionToken: result.sessionToken,
      });
      emitAuthState(socket);
    } catch (error) {
      console.error("signUp failed", error);
      callback({
        ok: false,
        error: "Unable to sign up right now",
      });
    }
  });

  socket.on("logIn", async (data, callback) => {
    try {
      const result = await logInWithPassword(data);
      if (!result.ok) {
        callback(result);
        return;
      }

      socket.data.userId = result.user.id;
      socket.data.username = result.user.username;
      socket.data.sessionId = result.sessionId;

      callback({
        ok: true,
        user: result.user,
        sessionToken: result.sessionToken,
      });
      emitAuthState(socket);
    } catch (error) {
      console.error("logIn failed", error);
      callback({
        ok: false,
        error: "Unable to log in right now",
      });
    }
  });

  socket.on("logOut", async (callback) => {
    try {
      if (socket.data.sessionId) {
        await revokeSession(socket.data.sessionId);
      }

      clearSocketAuth(socket);
      callback({ ok: true });
      emitAuthState(socket);
    } catch (error) {
      console.error("logOut failed", error);
      callback({
        ok: false,
        error: "Unable to log out right now",
      });
    }
  });

  socket.on("createRoom", ({ name }) => {
    const roomId = randomUUID();
    socket.data.playerId = randomUUID();
    socket.data.roomId = roomId;
    socket.join(roomId);

    socket.emit("roomJoined", {
      roomId,
      playerId: socket.data.playerId,
    });
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    socket.data.playerId = randomUUID();
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

const clientDistPath = path.resolve(process.cwd(), "../client/dist");

app.use(express.static(clientDistPath));

app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDistPath, "index.html"));
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
