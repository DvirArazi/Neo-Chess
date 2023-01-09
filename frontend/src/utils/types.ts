import { PieceData } from "shared/types/pieceTypes";
import { ClientToServerEvents, ServerToClientEvents } from "shared/types/webSocketTypes";
import { Socket } from "socket.io-client";

export type WebSocketClient = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>

export type BoardLayout = (PieceData | undefined)[]