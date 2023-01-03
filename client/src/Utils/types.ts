import { ClientToServerEvents, ServerToClientEvents } from "shared/types";
import { Socket } from "socket.io-client";

export type SocketClient = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;