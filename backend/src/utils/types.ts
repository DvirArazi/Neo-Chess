import { TokenPayload } from "google-auth-library";
import { ObjectId } from "mongodb";
import { GameData, GameTurn, Player, Timeframe } from "shared/types/game";
import { ClientToServerEvents, ServerToClientEvents } from "shared/types/webSocket";
import { Server, Socket } from "socket.io";

export type WebSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type ServerSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export type User = {
  googleId: string,
  socketsIds: { key: string, values: string[] }[],
  data: TokenPayload,
  gameRequestId: ObjectId | undefined,
  ongoingGamesIds: ObjectId[],
  name: string,
  ratings: number[],
}

export type PlayerWithId = {
  id: ObjectId
} & Player

export type GameTurnWithRep = {
  rep: string
} & GameTurn

export type Game = {
  path: string,
  white: PlayerWithId,
  black: PlayerWithId,
  turns: GameTurnWithRep[],
  startRep: string,
} & GameData