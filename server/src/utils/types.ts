import { OAuth2Client, TokenPayload } from "google-auth-library";
import { Collection, ObjectId } from "mongodb";
import { BoardLayout, ClientToServerEvents, TimeFormats, GameSettings, ServerToClientEvents, Timeframe, GameRequest } from "shared/types";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export type WebSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type ServerSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

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

export type HandlerParams = {
  webSocketServer: WebSocketServer,
  socket: ServerSocket,
  userId: ObjectId | undefined,
  oAuth2Client: OAuth2Client,
  usersCollection: Collection<User>,
  gameRequestsCollection: Collection<GameRequest>,
  ongoingGamesCollection: Collection<Game>,
}

