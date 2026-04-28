import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/socket";

const SESSION_TOKEN_STORAGE_KEY = "neo-chess-session-token";

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
