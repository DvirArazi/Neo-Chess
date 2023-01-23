import { ClientToServerEvents, ServerToClientEvents } from "shared/types/webSocket";
import { Socket } from "socket.io-client";

export type WebSocketClient = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>