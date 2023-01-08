import { OAuth2Client, TokenPayload } from "google-auth-library";
import { Collection, ObjectId } from "mongodb";
import { GameState, ClientToServerEvents, TimeFormats, GameSettings, ServerToClientEvents, Timeframe, GameRequest, GameHistory, Player } from "shared/types";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export type WebSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type ServerSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export type User = {
  googleId: string,
  socketsIds: {key: string, value: string}[],
  data: TokenPayload,
  gameRequestId: ObjectId | undefined,
  ongoingGamesIds: ObjectId[],
  name: string,
  ratings: number[],
}

export type PlayerWithId = {
  id: ObjectId
} & Player

export type Game = {
  path: string,
  white: PlayerWithId,
  black: PlayerWithId,
  settings: GameSettings,
  history: GameHistory,

}