import { TokenPayload } from "google-auth-library";
import { ObjectId } from "mongodb";
import { BoardLayout, ClientToServerEvents, TimeFormats, GameSettings, ServerToClientEvents, Timeframe } from "shared/types";
import { Server } from "socket.io";

export type WebSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

export type User = {
  googleId: string,
  socketsIds: string[],
  keys: string[],
  data: TokenPayload,
  gameRequestId: ObjectId | undefined,
  ongoingGamesIds: ObjectId[],
  name: string,
  ratings: Map<TimeFormats, number>,
}

export type Game = {
  white: ObjectId,
  black: ObjectId,
  settings: GameSettings,
  boardLayout: BoardLayout,
}

