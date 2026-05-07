import { io, Socket } from "socket.io-client";
import type {
  AuthenticatedUser,
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/socket";

const SESSION_TOKEN_STORAGE_KEY = "neo-chess-session-token";
const AUTHENTICATED_USER_STORAGE_KEY = "neo-chess-authenticated-user";
const LOCAL_SERVER_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isLocalServerHostname(hostname: string): boolean {
  return LOCAL_SERVER_HOSTS.has(hostname);
}

export function getServerOrigin(): string {
  const configuredServerUrl = import.meta.env.VITE_SERVER_URL;
  if (
    typeof configuredServerUrl !== "string" ||
    configuredServerUrl.trim().length === 0
  ) {
    return window.location.origin;
  }

  try {
    const serverUrl = new URL(configuredServerUrl, window.location.origin);
    if (
      !isLocalServerHostname(window.location.hostname) &&
      isLocalServerHostname(serverUrl.hostname)
    ) {
      return window.location.origin;
    }

    return serverUrl.origin;
  } catch {
    return window.location.origin;
  }
}

function getStoredSessionToken(): string | undefined {
  const sessionToken = window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
  return sessionToken ?? undefined;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  getServerOrigin(),
  {
    autoConnect: false,
    transports: ["websocket"],
    auth: {
      sessionToken: getStoredSessionToken(),
    },
  }
);

export function getStoredAuthenticatedUser(): AuthenticatedUser | null {
  const storedUser = window.localStorage.getItem(AUTHENTICATED_USER_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    const user = JSON.parse(storedUser) as Partial<AuthenticatedUser>;
    if (typeof user.id !== "string" || typeof user.username !== "string") {
      window.localStorage.removeItem(AUTHENTICATED_USER_STORAGE_KEY);
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      elo: typeof user.elo === "number" ? user.elo : 1200,
    };
  } catch {
    window.localStorage.removeItem(AUTHENTICATED_USER_STORAGE_KEY);
    return null;
  }
}

export function setStoredAuthenticatedUser(user: AuthenticatedUser): void {
  window.localStorage.setItem(
    AUTHENTICATED_USER_STORAGE_KEY,
    JSON.stringify(user),
  );
}

export function clearStoredAuthenticatedUser(): void {
  window.localStorage.removeItem(AUTHENTICATED_USER_STORAGE_KEY);
}

export function setSessionToken(sessionToken: string): void {
  window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, sessionToken);
  socket.auth = {
    ...socket.auth,
    sessionToken,
  };
}

export function clearSessionToken(): void {
  window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  socket.auth = {
    ...socket.auth,
    sessionToken: undefined,
  };
}
