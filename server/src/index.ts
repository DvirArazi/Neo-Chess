import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
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
import {
  loadPersistedOnlineGames,
  persistOnlineGameSnapshot,
} from "./onlineGames/persistence.js";
import type {
  AuthenticatedUser,
  ClientToServerEvents,
  InterServerEvents,
  OnlineGameListEntry,
  OnlineGameState,
  OnlineMatchFound,
  OnlineMatchRequest,
  ServerToClientEvents,
  SocketData,
} from "../../shared/socket.js";
import { createInitialBoard } from "../../shared/chess/setup.js";
import {
  applyMove,
  getBoardGameOutcome,
  getLegalMoves,
} from "../../shared/chess/moveGeneration.js";
import type { MoveInput, PieceColor } from "../../shared/chess/types.js";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";

const app = express();
app.set("trust proxy", true);
app.use(cors());
app.use(express.json());

const GOOGLE_AUTH_STATE_TTL_MS = 1000 * 60 * 5;
const GOOGLE_AUTH_MESSAGE_TYPE = "neo-chess-google-auth-result";
const RATING_K_FACTOR = 32;
const MIN_ELO = 100;
const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
]);
const PRIVATE_IPV4_RANGES = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
];
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

function getConfiguredClientOrigins(): Set<string> {
  return new Set(
    [
      process.env.CLIENT_ORIGIN,
      process.env.CLIENT_ORIGINS,
    ].filter(Boolean)
      .flatMap((value) => value!.split(","))
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function isLocalDevelopmentHostname(hostname: string): boolean {
  return LOCAL_DEVELOPMENT_HOSTS.has(hostname) ||
    PRIVATE_IPV4_RANGES.some((range) => range.test(hostname));
}

function isLocalDevelopmentOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === "production") return false;

  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      isLocalDevelopmentHostname(url.hostname)
    );
  } catch {
    return false;
  }
}

const configuredClientOrigins = getConfiguredClientOrigins();

function isAllowedClientOrigin(origin: string): boolean {
  return configuredClientOrigins.has(origin) || isLocalDevelopmentOrigin(origin);
}

function getSingleHeaderValue(
  value: string | string[] | undefined,
): string | null {
  const headerValue = Array.isArray(value) ? value[0] : value;
  return headerValue?.split(",")[0]?.trim() || null;
}

function getRequestOriginFromHeaders(req: http.IncomingMessage): string | null {
  const host = getSingleHeaderValue(req.headers["x-forwarded-host"]) ??
    getSingleHeaderValue(req.headers.host);
  if (!host) return null;

  const socket = req.socket as typeof req.socket & { encrypted?: boolean };
  const protocol = getSingleHeaderValue(req.headers["x-forwarded-proto"]) ??
    (socket.encrypted ? "https" : "http");

  return `${protocol}://${host}`;
}

function isAllowedSocketRequest(req: http.IncomingMessage): boolean {
  const origin = getSingleHeaderValue(req.headers.origin);
  if (!origin || isAllowedClientOrigin(origin)) {
    return true;
  }

  return origin === getRequestOriginFromHeaders(req);
}

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
    origin: true,
    methods: ["GET", "POST"],
  },
  allowRequest: (req, callback) => {
    callback(null, isAllowedSocketRequest(req));
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

type StartedOnlineMatch = {
  leftMatch: OnlineMatchFound;
  rightMatch: OnlineMatchFound;
};

const matchmakingQueue = new Map<string, MatchmakingEntry>();
const onlineGames = new Map<string, OnlineGameState>();
const pendingOnlineGamePersistence = new Map<string, OnlineGameState>();
let onlineGamePersistenceFlushTimeout: NodeJS.Timeout | null = null;
let onlineGamePersistenceChain: Promise<void> = Promise.resolve();

function flushOnlineGamePersistence(): void {
  onlineGamePersistenceFlushTimeout = null;
  const gamesToPersist = [...pendingOnlineGamePersistence.values()];
  pendingOnlineGamePersistence.clear();
  if (gamesToPersist.length === 0) return;

  onlineGamePersistenceChain = onlineGamePersistenceChain
    .then(async () => {
      const results = await Promise.allSettled(
        gamesToPersist.map((game) => persistOnlineGameSnapshot(game)),
      );
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("online game persistence failed", result.reason);
        }
      }
    })
    .catch((error) => {
      console.error("online game persistence queue failed", error);
    });
}

function queueOnlineGamePersistence(game: OnlineGameState): void {
  pendingOnlineGamePersistence.set(game.id, game);
  if (onlineGamePersistenceFlushTimeout !== null) return;

  onlineGamePersistenceFlushTimeout = setTimeout(
    flushOnlineGamePersistence,
    0,
  );
}

async function hydrateOnlineGames(): Promise<void> {
  try {
    const persistedGames = await loadPersistedOnlineGames();
    for (const game of persistedGames) {
      onlineGames.set(game.id, game);
    }
    console.log(`Loaded ${persistedGames.length} online games from database`);
  } catch (error) {
    console.error("Unable to load online games from database", error);
  }
}

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

function startOnlineMatch(
  left: MatchmakingEntry,
  right: MatchmakingEntry,
): StartedOnlineMatch {
  const gameId = randomUUID();
  const nowMs = Date.now();
  const isLeftWhite = Math.random() < 0.5;
  const whiteEntry = isLeftWhite ? left : right;
  const blackEntry = isLeftWhite ? right : left;
  const initialState = createInitialBoard();
  const game: OnlineGameState = {
    id: gameId,
    mode: left.criteria.mode,
    timeControlId: left.criteria.timeControlId,
    players: {
      white: {
        ...whiteEntry.user,
        color: "white",
      },
      black: {
        ...blackEntry.user,
        color: "black",
      },
    },
    state: initialState,
    history: [initialState],
    moves: [],
    status: { type: "active" },
    drawOffer: undefined,
    createdAt: nowMs,
    updatedAt: nowMs,
  };

  onlineGames.set(gameId, game);
  queueOnlineGamePersistence(game);
  console.log("online match created", {
    gameId,
    white: whiteEntry.user.username,
    black: blackEntry.user.username,
    mode: game.mode,
    timeControlId: game.timeControlId,
  });
  left.socket.data.roomId = gameId;
  right.socket.data.roomId = gameId;
  left.socket.join(gameId);
  right.socket.join(gameId);

  const leftMatch: OnlineMatchFound = {
    gameId,
    color: isLeftWhite ? "white" : "black",
    opponent: right.user,
    timeControlId: left.criteria.timeControlId,
    mode: left.criteria.mode,
  };
  const rightMatch: OnlineMatchFound = {
    gameId,
    color: isLeftWhite ? "black" : "white",
    opponent: left.user,
    timeControlId: right.criteria.timeControlId,
    mode: right.criteria.mode,
  };

  left.socket.emit("onlineMatchFound", leftMatch);
  right.socket.emit("onlineMatchFound", rightMatch);
  io.to(gameId).emit("onlineGameUpdated", game);
  return { leftMatch, rightMatch };
}

function getOnlinePlayerColor(
  game: OnlineGameState,
  userId: string,
): PieceColor | null {
  if (game.players.white.id === userId) return "white";
  if (game.players.black.id === userId) return "black";
  return null;
}

function toOnlineGameListEntry(game: OnlineGameState): OnlineGameListEntry {
  return {
    id: game.id,
    mode: game.mode,
    timeControlId: game.timeControlId,
    players: game.players,
    state: game.state,
    status: game.status,
    updatedAt: game.updatedAt,
  };
}

function isLegalOnlineMove(game: OnlineGameState, move: MoveInput): boolean {
  const legalMoves = getLegalMoves(move.from, game.state);
  return legalMoves.some((legalMove) =>
    legalMove.x === move.to.x && legalMove.y === move.to.y
  );
}

function getExpectedRatingScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + 10 ** ((opponentElo - playerElo) / 400));
}

function getRatingDeltas(
  game: OnlineGameState,
  result: { winner: PieceColor } | { winner: null },
): Record<PieceColor, number> {
  const whiteElo = game.players.white.elo;
  const blackElo = game.players.black.elo;
  const whiteScore = result.winner === null
    ? 0.5
    : result.winner === "white"
    ? 1
    : 0;
  const whiteExpected = getExpectedRatingScore(whiteElo, blackElo);
  const whiteDelta = Math.round(RATING_K_FACTOR * (whiteScore - whiteExpected));

  return {
    white: whiteDelta,
    black: -whiteDelta,
  };
}

function updateConnectedUserElo(userId: string, elo: number): void {
  io.sockets.sockets.forEach((connectedSocket) => {
    if (connectedSocket.data.userId !== userId) return;

    connectedSocket.data.elo = elo;
    emitAuthState(connectedSocket as ServerSocket);
  });
}

async function applyRatedGameResult(
  game: OnlineGameState,
): Promise<OnlineGameState> {
  if (
    game.mode !== "rated" ||
    game.status.type === "active" ||
    game.ratingDeltas
  ) {
    return game;
  }

  const result = game.status.type === "draw"
    ? { winner: null }
    : { winner: game.status.winner };
  const ratingUpdate = await db.transaction(async (tx) => {
    const [whiteUser, blackUser] = await Promise.all([
      tx
        .select({ elo: users.elo })
        .from(users)
        .where(eq(users.id, game.players.white.id))
        .limit(1),
      tx
        .select({ elo: users.elo })
        .from(users)
        .where(eq(users.id, game.players.black.id))
        .limit(1),
    ]);
    const currentWhiteElo = whiteUser[0]?.elo ?? game.players.white.elo;
    const currentBlackElo = blackUser[0]?.elo ?? game.players.black.elo;
    const ratingDeltas = getRatingDeltas(
      {
        ...game,
        players: {
          white: { ...game.players.white, elo: currentWhiteElo },
          black: { ...game.players.black, elo: currentBlackElo },
        },
      },
      result,
    );
    const nextWhiteElo = Math.max(MIN_ELO, currentWhiteElo + ratingDeltas.white);
    const nextBlackElo = Math.max(MIN_ELO, currentBlackElo + ratingDeltas.black);

    await tx
      .update(users)
      .set({ elo: nextWhiteElo })
      .where(eq(users.id, game.players.white.id));
    await tx
      .update(users)
      .set({ elo: nextBlackElo })
      .where(eq(users.id, game.players.black.id));

    return {
      whiteElo: nextWhiteElo,
      blackElo: nextBlackElo,
      ratingDeltas: {
        white: nextWhiteElo - currentWhiteElo,
        black: nextBlackElo - currentBlackElo,
      },
    };
  });

  updateConnectedUserElo(game.players.white.id, ratingUpdate.whiteElo);
  updateConnectedUserElo(game.players.black.id, ratingUpdate.blackElo);

  return {
    ...game,
    players: {
      white: {
        ...game.players.white,
        elo: ratingUpdate.whiteElo,
      },
      black: {
        ...game.players.black,
        elo: ratingUpdate.blackElo,
      },
    },
    ratingDeltas: ratingUpdate.ratingDeltas,
  };
}

async function finalizeOnlineGame(
  game: OnlineGameState,
): Promise<OnlineGameState> {
  const nextGame = await applyRatedGameResult(game);
  onlineGames.set(nextGame.id, nextGame);
  io.to(nextGame.id).emit("onlineGameUpdated", nextGame);
  queueOnlineGamePersistence(nextGame);
  return nextGame;
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

function shouldUseConfiguredGoogleRedirectUri(
  configuredRedirectUri: string,
  requestOrigin: string,
): boolean {
  try {
    const configuredUrl = new URL(configuredRedirectUri);
    const requestUrl = new URL(requestOrigin);
    return !(
      isLocalDevelopmentHostname(configuredUrl.hostname) &&
      !isLocalDevelopmentHostname(requestUrl.hostname)
    );
  } catch {
    return false;
  }
}

function getGoogleRedirectUri(req: express.Request): string {
  const requestOrigin = getServerOrigin(req);
  const requestRedirectUri = `${requestOrigin}/auth/google/callback`;
  const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!configuredRedirectUri) {
    return requestRedirectUri;
  }

  return shouldUseConfiguredGoogleRedirectUri(
    configuredRedirectUri,
    requestOrigin,
  )
    ? configuredRedirectUri
    : requestRedirectUri;
}

function isAllowedPopupOrigin(
  candidateOrigin: string,
  req: express.Request,
): boolean {
  const allowedOrigins = new Set<string>([getServerOrigin(req)]);
  for (const origin of configuredClientOrigins) {
    allowedOrigins.add(origin);
  }

  return allowedOrigins.has(candidateOrigin) ||
    isLocalDevelopmentOrigin(candidateOrigin);
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

    const criteria: OnlineMatchRequest = {
      mode: data.mode,
      timeControlId: data.timeControlId,
      opponentId: data.opponentId ?? null,
      ratingMin: Math.min(data.ratingMin, data.ratingMax),
      ratingMax: Math.max(data.ratingMin, data.ratingMax),
    };

    const entry: MatchmakingEntry = {
      socket,
      user,
      criteria,
    };
    removeFromMatchmakingQueue(socket);

    console.log("online matchmaking request", {
      userId: user.id,
      username: user.username,
      elo: user.elo,
      criteria,
      queuedUsers: [...matchmakingQueue.values()].map((queuedEntry) => ({
        userId: queuedEntry.user.id,
        username: queuedEntry.user.username,
        elo: queuedEntry.user.elo,
        criteria: queuedEntry.criteria,
      })),
    });

    const match = findMatchFor(entry);
    if (match) {
      removeFromMatchmakingQueue(match.socket);
      const startedMatch = startOnlineMatch(entry, match);
      callback({
        ok: true,
        status: "matched",
        match: startedMatch.leftMatch,
      });
      return;
    }

    matchmakingQueue.set(user.id, entry);
    callback({ ok: true, status: "queued" });
  });

  socket.on("cancelOnlineMatch", (callback) => {
    removeFromMatchmakingQueue(socket);
    callback({ ok: true });
  });

  socket.on("getOnlineGame", (data, callback) => {
    const userId = getRequiredUserId(socket);
    if (!userId) {
      callback({ ok: false, error: "Log in to view this game" });
      return;
    }

    const game = onlineGames.get(data.gameId);
    if (!game) {
      callback({ ok: false, error: "Online game not found" });
      return;
    }

    if (!getOnlinePlayerColor(game, userId)) {
      callback({ ok: false, error: "You are not a player in this game" });
      return;
    }

    socket.data.roomId = game.id;
    socket.join(game.id);
    callback({ ok: true, game });
  });

  socket.on("listOnlineGames", (callback) => {
    const userId = getRequiredUserId(socket);
    if (!userId) {
      callback({ ok: false, error: "Log in to view your games" });
      return;
    }

    const games = [...onlineGames.values()]
      .filter((game) => getOnlinePlayerColor(game, userId) !== null)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(toOnlineGameListEntry);

    callback({ ok: true, games });
  });

  socket.on("makeOnlineMove", async (data, callback) => {
    const userId = getRequiredUserId(socket);
    if (!userId) {
      callback({ ok: false, error: "Log in to move" });
      return;
    }

    const game = onlineGames.get(data.gameId);
    if (!game) {
      callback({ ok: false, error: "Online game not found" });
      return;
    }

    if (game.status.type !== "active") {
      callback({ ok: false, error: "This game is already over" });
      return;
    }

    const playerColor = getOnlinePlayerColor(game, userId);
    if (!playerColor) {
      callback({ ok: false, error: "You are not a player in this game" });
      return;
    }

    if (game.state.turn !== playerColor) {
      callback({ ok: false, error: "It is not your turn" });
      return;
    }

    const movingPiece = game.state.board[data.move.from.y]?.[data.move.from.x];
    if (!movingPiece || movingPiece.color !== playerColor) {
      callback({ ok: false, error: "You can only move your own pieces" });
      return;
    }

    if (!isLegalOnlineMove(game, data.move)) {
      callback({ ok: false, error: "Illegal move" });
      return;
    }

    const nextState = applyMove(game.state, data.move);
    const boardOutcome = getBoardGameOutcome(nextState);
    const nextStatus = boardOutcome
      ? boardOutcome.result === "draw"
        ? { type: "draw" as const, reason: boardOutcome.reason }
        : {
          type: "checkmate" as const,
          winner: boardOutcome.winner,
          loser: boardOutcome.winner === "white" ? "black" as const : "white" as const,
        }
      : game.status;
    const nextGame: OnlineGameState = {
      ...game,
      state: nextState,
      history: [...game.history, nextState],
      moves: [...game.moves, data.move],
      status: nextStatus,
      drawOffer: undefined,
      updatedAt: Date.now(),
    };
    if (nextGame.status.type === "active") {
      onlineGames.set(nextGame.id, nextGame);
      callback({ ok: true });
      io.to(nextGame.id).emit("onlineGameUpdated", nextGame);
      queueOnlineGamePersistence(nextGame);
      return;
    }

    onlineGames.set(nextGame.id, nextGame);
    callback({ ok: true });
    io.to(nextGame.id).emit("onlineGameUpdated", nextGame);
    queueOnlineGamePersistence(nextGame);

    void finalizeOnlineGame(nextGame).catch((error) => {
      console.error("rated game finalization failed", error);
    });
  });

  socket.on("resignOnlineGame", async (data, callback) => {
    const userId = getRequiredUserId(socket);
    if (!userId) {
      callback({ ok: false, error: "Log in to resign" });
      return;
    }

    const game = onlineGames.get(data.gameId);
    if (!game) {
      callback({ ok: false, error: "Online game not found" });
      return;
    }

    if (game.status.type !== "active") {
      callback({ ok: false, error: "This game is already over" });
      return;
    }

    const loser = getOnlinePlayerColor(game, userId);
    if (!loser) {
      callback({ ok: false, error: "You are not a player in this game" });
      return;
    }

    const winner = loser === "white" ? "black" : "white";
    const nextGame: OnlineGameState = {
      ...game,
      status: { type: "resigned", winner, loser },
      drawOffer: undefined,
      updatedAt: Date.now(),
    };
    try {
      await finalizeOnlineGame(nextGame);
      callback({ ok: true });
    } catch (error) {
      console.error("rated game finalization failed", error);
      callback({ ok: false, error: "Unable to finish the rated game" });
    }
  });

  socket.on("offerOnlineDraw", (data, callback) => {
    const userId = getRequiredUserId(socket);
    if (!userId) {
      callback({ ok: false, error: "Log in to offer a draw" });
      return;
    }

    const game = onlineGames.get(data.gameId);
    if (!game) {
      callback({ ok: false, error: "Online game not found" });
      return;
    }

    if (game.status.type !== "active") {
      callback({ ok: false, error: "This game is already over" });
      return;
    }

    const offeredBy = getOnlinePlayerColor(game, userId);
    if (!offeredBy) {
      callback({ ok: false, error: "You are not a player in this game" });
      return;
    }

    const nextGame: OnlineGameState = {
      ...game,
      drawOffer: { offeredBy },
      updatedAt: Date.now(),
    };
    onlineGames.set(nextGame.id, nextGame);
    callback({ ok: true });
    io.to(nextGame.id).emit("onlineGameUpdated", nextGame);
    queueOnlineGamePersistence(nextGame);
  });

  socket.on("respondOnlineDrawOffer", async (data, callback) => {
    const userId = getRequiredUserId(socket);
    if (!userId) {
      callback({ ok: false, error: "Log in to respond to a draw offer" });
      return;
    }

    const game = onlineGames.get(data.gameId);
    if (!game) {
      callback({ ok: false, error: "Online game not found" });
      return;
    }

    if (game.status.type !== "active") {
      callback({ ok: false, error: "This game is already over" });
      return;
    }

    const playerColor = getOnlinePlayerColor(game, userId);
    if (!playerColor) {
      callback({ ok: false, error: "You are not a player in this game" });
      return;
    }

    if (!game.drawOffer) {
      callback({ ok: false, error: "There is no draw offer to respond to" });
      return;
    }

    if (game.drawOffer.offeredBy === playerColor) {
      callback({ ok: false, error: "You cannot respond to your own draw offer" });
      return;
    }

    const nextGame: OnlineGameState = data.accepted
      ? {
        ...game,
        status: { type: "draw", reason: "agreement" },
        drawOffer: undefined,
        updatedAt: Date.now(),
      }
      : {
        ...game,
        drawOffer: undefined,
        updatedAt: Date.now(),
      };
    if (nextGame.status.type === "active") {
      onlineGames.set(nextGame.id, nextGame);
      callback({ ok: true });
      io.to(nextGame.id).emit("onlineGameUpdated", nextGame);
      queueOnlineGamePersistence(nextGame);
      return;
    }

    try {
      await finalizeOnlineGame(nextGame);
      callback({ ok: true });
    } catch (error) {
      console.error("rated game finalization failed", error);
      callback({ ok: false, error: "Unable to finish the rated game" });
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

async function startServer(): Promise<void> {
  await hydrateOnlineGames();
  server.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
}

void startServer();
