import { io, Socket } from "socket.io-client";
import type {
  AuthenticatedUser,
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/socket";

const SESSION_TOKEN_STORAGE_KEY = "neo-chess-session-token";
const AUTHENTICATED_USER_STORAGE_KEY = "neo-chess-authenticated-user";

function getStoredSessionToken(): string | undefined {
  const sessionToken = window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
  return sessionToken ?? undefined;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.VITE_SERVER_URL,
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
