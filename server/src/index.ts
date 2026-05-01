import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Server, type Socket } from "socket.io";
import {
  getSessionUserByToken,
  logInWithGoogleProfile,
  logInWithPassword,
  revokeSession,
  signUpWithPassword,
} from "./auth/service.js";
import {
  approveFriendRequest,
  denyFriendRequest,
  getFriendsSnapshot,
  sendFriendRequest,
  unfriend,
} from "./friends/service.js";
import type {
  AuthenticatedUser,
  ClientToServerEvents,
  InterServerEvents,
  OnlineMatchRequest,
  ServerToClientEvents,
  SocketData,
} from "../../shared/socket.js";

const app = express();
app.set("trust proxy", true);
app.use(cors());
app.use(express.json());

const GOOGLE_AUTH_STATE_TTL_MS = 1000 * 60 * 5;
const GOOGLE_AUTH_MESSAGE_TYPE = "neo-chess-google-auth-result";
const googleAuthStates = new Map<string, {
  origin: string;
  expiresAt: number;
}>();
let googleOpenIdConfigurationPromise: Promise<GoogleOpenIdConfiguration> | null =
  null;

type GoogleOpenIdConfiguration = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
};

type GoogleUserProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

type GoogleAuthPopupPayload =
  | {
    type: typeof GOOGLE_AUTH_MESSAGE_TYPE;
    ok: true;
    user: AuthenticatedUser;
    sessionToken: string;
  }
  | {
    type: typeof GOOGLE_AUTH_MESSAGE_TYPE;
    ok: false;
    error: string;
  };

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

type MatchmakingEntry = {
  socket: ServerSocket;
  user: AuthenticatedUser;
  criteria: OnlineMatchRequest;
};

const matchmakingQueue = new Map<string, MatchmakingEntry>();

function getAuthenticatedUser(socket: ServerSocket): AuthenticatedUser | null {
  if (!socket.data.userId || !socket.data.username) {
    return null;
  }

  return {
    id: socket.data.userId,
    username: socket.data.username,
    elo: socket.data.elo ?? 1200,
  };
}

function getRequiredUserId(socket: ServerSocket): string | null {
  return typeof socket.data.userId === "string" ? socket.data.userId : null;
}

function emitAuthState(socket: ServerSocket): void {
  socket.emit("authStateChanged", {
    user: getAuthenticatedUser(socket),
  });
}

function emitFriendsChanged(userId: string): void {
  io.sockets.sockets.forEach((connectedSocket) => {
    if (connectedSocket.data.userId === userId) {
      connectedSocket.emit("friendsChanged");
    }
  });
}

function removeFromMatchmakingQueue(socket: ServerSocket): void {
  if (socket.data.userId) {
    matchmakingQueue.delete(socket.data.userId);
  }
}

function doMatchCriteriaFit(
  left: MatchmakingEntry,
  right: MatchmakingEntry,
): boolean {
  if (left.user.id === right.user.id) return false;
  if (left.criteria.mode !== right.criteria.mode) return false;
  if (left.criteria.timeControlId !== right.criteria.timeControlId) return false;
  if (
    left.criteria.opponentId !== null &&
    left.criteria.opponentId !== right.user.id
  ) {
    return false;
  }
  if (
    right.criteria.opponentId !== null &&
    right.criteria.opponentId !== left.user.id
  ) {
    return false;
  }
  if (
    right.user.elo < left.criteria.ratingMin ||
    right.user.elo > left.criteria.ratingMax
  ) {
    return false;
  }
  if (
    left.user.elo < right.criteria.ratingMin ||
    left.user.elo > right.criteria.ratingMax
  ) {
    return false;
  }

  return true;
}

function findMatchFor(entry: MatchmakingEntry): MatchmakingEntry | null {
  for (const candidate of matchmakingQueue.values()) {
    if (doMatchCriteriaFit(entry, candidate)) {
      return candidate;
    }
  }

  return null;
}

function startOnlineMatch(left: MatchmakingEntry, right: MatchmakingEntry): void {
  const roomId = randomUUID();
  left.socket.data.roomId = roomId;
  right.socket.data.roomId = roomId;
  left.socket.join(roomId);
  right.socket.join(roomId);

  left.socket.emit("onlineMatchFound", {
    roomId,
    color: "white",
    opponent: right.user,
    timeControlId: left.criteria.timeControlId,
    mode: left.criteria.mode,
  });
  right.socket.emit("onlineMatchFound", {
    roomId,
    color: "black",
    opponent: left.user,
    timeControlId: right.criteria.timeControlId,
    mode: right.criteria.mode,
  });
}

function cleanExpiredGoogleAuthStates(): void {
  const now = Date.now();
  for (const [state, value] of googleAuthStates.entries()) {
    if (value.expiresAt <= now) {
      googleAuthStates.delete(state);
    }
  }
}

function getServerOrigin(req: express.Request): string {
  return `${req.protocol}://${req.get("host")}`;
}

function getGoogleRedirectUri(req: express.Request): string {
  return process.env.GOOGLE_REDIRECT_URI ??
    `${getServerOrigin(req)}/auth/google/callback`;
}

function isAllowedPopupOrigin(
  candidateOrigin: string,
  req: express.Request,
): boolean {
  const allowedOrigins = new Set<string>([getServerOrigin(req)]);
  if (process.env.CLIENT_ORIGIN) {
    allowedOrigins.add(process.env.CLIENT_ORIGIN);
  }

  return allowedOrigins.has(candidateOrigin);
}

function createGoogleAuthState(origin: string): string {
  cleanExpiredGoogleAuthStates();
  const state = randomUUID();
  googleAuthStates.set(state, {
    origin,
    expiresAt: Date.now() + GOOGLE_AUTH_STATE_TTL_MS,
  });
  return state;
}

function consumeGoogleAuthState(state: string): { origin: string } | null {
  const storedState = googleAuthStates.get(state);
  googleAuthStates.delete(state);
  if (!storedState) {
    return null;
  }

  if (storedState.expiresAt <= Date.now()) {
    return null;
  }

  return { origin: storedState.origin };
}

function escapeInlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function sendGooglePopupResponse(
  res: express.Response,
  targetOrigin: string,
  payload: GoogleAuthPopupPayload,
): void {
  const serializedOrigin = escapeInlineJson(targetOrigin);
  const serializedPayload = escapeInlineJson(payload);
  const message = payload.ok
    ? "Authentication complete. You can close this window."
    : payload.error;

  res
    .status(payload.ok ? 200 : 400)
    .type("html")
    .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Neo Chess Authentication</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #242420;
        color: #f7f7f5;
        font-family: system-ui, sans-serif;
      }
      p {
        margin: 0;
        max-width: 28rem;
        padding: 24px;
        text-align: center;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <p>${message}</p>
    <script>
      const targetOrigin = ${serializedOrigin};
      const payload = ${serializedPayload};
      if (window.opener) {
        window.opener.postMessage(payload, targetOrigin);
        window.close();
      }
    </script>
  </body>
</html>`);
}

function getPublicGoogleAuthErrorMessage(error: unknown): string {
  if (
    process.env.NODE_ENV !== "production" &&
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return "Unable to continue with Google right now";
}

async function getGoogleOpenIdConfiguration(): Promise<GoogleOpenIdConfiguration> {
  if (!googleOpenIdConfigurationPromise) {
    googleOpenIdConfigurationPromise = fetch(
      "https://accounts.google.com/.well-known/openid-configuration",
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Google OpenID configuration request failed with ${response.status}`,
        );
      }

      return await response.json() as GoogleOpenIdConfiguration;
    }).catch((error) => {
      googleOpenIdConfigurationPromise = null;
      throw error;
    });
  }

  return await googleOpenIdConfigurationPromise;
}

async function exchangeGoogleCodeForAccessToken(input: {
  code: string;
  redirectUri: string;
}): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured");
  }

  const openIdConfiguration = await getGoogleOpenIdConfiguration();
  const response = await fetch(openIdConfiguration.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google token exchange failed with ${response.status}: ${errorText}`,
    );
  }

  const tokenResponse = await response.json() as { access_token?: string };
  if (!tokenResponse.access_token) {
    throw new Error("Google token response did not contain an access token");
  }

  return tokenResponse.access_token;
}

async function fetchGoogleUserProfile(
  accessToken: string,
): Promise<GoogleUserProfile> {
  const openIdConfiguration = await getGoogleOpenIdConfiguration();
  const response = await fetch(openIdConfiguration.userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google user info request failed with ${response.status}: ${errorText}`,
    );
  }

  return await response.json() as GoogleUserProfile;
}

app.get("/auth/google/start", async (req, res) => {
  const requestedOrigin = typeof req.query.origin === "string"
    ? req.query.origin
    : null;

  if (!requestedOrigin) {
    res.status(400).send("Missing origin");
    return;
  }

  if (!isAllowedPopupOrigin(requestedOrigin, req)) {
    res.status(400).send("Invalid origin");
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    sendGooglePopupResponse(res, requestedOrigin, {
      type: GOOGLE_AUTH_MESSAGE_TYPE,
      ok: false,
      error: "Google sign-in is not configured",
    });
    return;
  }

  try {
    const openIdConfiguration = await getGoogleOpenIdConfiguration();
    const redirectUri = getGoogleRedirectUri(req);
    const state = createGoogleAuthState(requestedOrigin);
    const authorizationUrl = new URL(openIdConfiguration.authorization_endpoint);
    authorizationUrl.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state,
    }).toString();

    res.redirect(authorizationUrl.toString());
  } catch (error) {
    console.error("google auth start failed", error);
    sendGooglePopupResponse(res, requestedOrigin, {
      type: GOOGLE_AUTH_MESSAGE_TYPE,
      ok: false,
      error: "Unable to start Google sign-in right now",
    });
  }
});

app.get("/auth/google/callback", async (req, res) => {
  const state = typeof req.query.state === "string" ? req.query.state : null;
  if (!state) {
    res.status(400).send("Missing state");
    return;
  }

  const storedState = consumeGoogleAuthState(state);
  if (!storedState) {
    res.status(400).send("Invalid or expired state");
    return;
  }

  if (typeof req.query.error === "string") {
    sendGooglePopupResponse(res, storedState.origin, {
      type: GOOGLE_AUTH_MESSAGE_TYPE,
      ok: false,
      error: "Google sign-in was cancelled",
    });
    return;
  }

  const code = typeof req.query.code === "string" ? req.query.code : null;
  if (!code) {
    sendGooglePopupResponse(res, storedState.origin, {
      type: GOOGLE_AUTH_MESSAGE_TYPE,
      ok: false,
      error: "Missing Google authorization code",
    });
    return;
  }

  try {
    const accessToken = await exchangeGoogleCodeForAccessToken({
      code,
      redirectUri: getGoogleRedirectUri(req),
    });
    const profile = await fetchGoogleUserProfile(accessToken);
    if (!profile.sub) {
      throw new Error("Google profile is missing a subject identifier");
    }

    const result = await logInWithGoogleProfile({
      googleSubject: profile.sub,
      email: profile.email,
      emailVerified: profile.email_verified === true,
      name: profile.name,
    });

    if (!result.ok) {
      sendGooglePopupResponse(res, storedState.origin, {
        type: GOOGLE_AUTH_MESSAGE_TYPE,
        ok: false,
        error: result.error,
      });
      return;
    }

    sendGooglePopupResponse(res, storedState.origin, {
      type: GOOGLE_AUTH_MESSAGE_TYPE,
      ok: true,
      user: result.user,
      sessionToken: result.sessionToken,
    });
  } catch (error) {
    console.error("google auth callback failed", error);
    sendGooglePopupResponse(res, storedState.origin, {
      type: GOOGLE_AUTH_MESSAGE_TYPE,
      ok: false,
      error: getPublicGoogleAuthErrorMessage(error),
    });
  }
});

function clearSocketAuth(socket: ServerSocket): void {
  delete socket.data.userId;
  delete socket.data.username;
  delete socket.data.elo;
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
    socket.data.elo = sessionUser.user.elo;
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
      socket.data.elo = result.user.elo;
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
      socket.data.elo = result.user.elo;
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
      removeFromMatchmakingQueue(socket);
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

  socket.on("getFriends", async (data, callback) => {
    try {
      const userId = getRequiredUserId(socket);
      if (!userId) {
        callback({ ok: false, error: "Log in to view friends" });
        return;
      }

      const snapshot = await getFriendsSnapshot({
        userId,
        search: data.search,
        markRequestsSeen: data.markRequestsSeen,
      });

      callback({
        ok: true,
        ...snapshot,
      });
    } catch (error) {
      console.error("getFriends failed", error);
      callback({
        ok: false,
        error: "Unable to load friends right now",
      });
    }
  });

  socket.on("sendFriendRequest", async (data, callback) => {
    try {
      const userId = getRequiredUserId(socket);
      if (!userId) {
        callback({ ok: false, error: "Log in to add friends" });
        return;
      }

      const result = await sendFriendRequest({
        requesterId: userId,
        recipientId: data.userId,
      });

      callback(result);
      if (result.ok) {
        emitFriendsChanged(data.userId);
        emitFriendsChanged(userId);
      }
    } catch (error) {
      console.error("sendFriendRequest failed", error);
      callback({
        ok: false,
        error: "Unable to send friend request right now",
      });
    }
  });

  socket.on("approveFriendRequest", async (data, callback) => {
    try {
      const userId = getRequiredUserId(socket);
      if (!userId) {
        callback({ ok: false, error: "Log in to approve requests" });
        return;
      }

      const requesterId = await approveFriendRequest({
        requestId: data.requestId,
        recipientId: userId,
      });

      callback({ ok: true });
      emitFriendsChanged(userId);
      if (requesterId) {
        emitFriendsChanged(requesterId);
      }
    } catch (error) {
      console.error("approveFriendRequest failed", error);
      callback({
        ok: false,
        error: "Unable to approve request right now",
      });
    }
  });

  socket.on("denyFriendRequest", async (data, callback) => {
    try {
      const userId = getRequiredUserId(socket);
      if (!userId) {
        callback({ ok: false, error: "Log in to deny requests" });
        return;
      }

      await denyFriendRequest({
        requestId: data.requestId,
        recipientId: userId,
      });

      callback({ ok: true });
      emitFriendsChanged(userId);
    } catch (error) {
      console.error("denyFriendRequest failed", error);
      callback({
        ok: false,
        error: "Unable to deny request right now",
      });
    }
  });

  socket.on("unfriend", async (data, callback) => {
    try {
      const userId = getRequiredUserId(socket);
      if (!userId) {
        callback({ ok: false, error: "Log in to update friends" });
        return;
      }

      await unfriend({
        userId,
        friendId: data.userId,
      });

      callback({ ok: true });
      emitFriendsChanged(userId);
      emitFriendsChanged(data.userId);
    } catch (error) {
      console.error("unfriend failed", error);
      callback({
        ok: false,
        error: "Unable to remove friend right now",
      });
    }
  });

  socket.on("findOnlineMatch", (data, callback) => {
    const user = getAuthenticatedUser(socket);
    if (!user) {
      callback({ ok: false, error: "Log in to play online" });
      return;
    }

    if (data.ratingMax - data.ratingMin < 100) {
      callback({ ok: false, error: "Rating range must be at least 100 points" });
      return;
    }

    const entry: MatchmakingEntry = {
      socket,
      user,
      criteria: data,
    };
    removeFromMatchmakingQueue(socket);

    const match = findMatchFor(entry);
    if (match) {
      removeFromMatchmakingQueue(match.socket);
      startOnlineMatch(entry, match);
      callback({ ok: true });
      return;
    }

    matchmakingQueue.set(user.id, entry);
    callback({ ok: true });
  });

  socket.on("cancelOnlineMatch", (callback) => {
    removeFromMatchmakingQueue(socket);
    callback({ ok: true });
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

  socket.on("disconnect", () => {
    removeFromMatchmakingQueue(socket);
  });
});

const clientDistPath = path.resolve(process.cwd(), "../client/dist");

app.use(express.static(clientDistPath));

app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDistPath, "index.html"));
});

const port = Number(process.env.PORT) || 3000;
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the existing dev server or run with a different PORT.`,
    );
    process.exit(1);
  }

  throw error;
});

server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
