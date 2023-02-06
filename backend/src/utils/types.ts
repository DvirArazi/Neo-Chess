import { TokenPayload } from "google-auth-library";
import { ObjectId } from "mongodb";
import { GameData, GameTurn, Player, Timeframe } from "shared/types/game";
import { Friend, FriendRequest, GameInvitation } from "shared/types/general";
import { AutoAuthData, ClientToServerEvents, ServerToClientEvents } from "shared/types/webSocket";
import { Server, Socket } from "socket.io";

export type WebSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type ServerSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export type User = {
  googleId: string,
  socketIds: string[],
  aadKeys: string[],
  data: TokenPayload,
  gameRequestId: ObjectId | null,
  outInvitation: GameInvitation | null,
  ongoingGamesIds: ObjectId[],
  name: string,
  ratings: number[],
  friends: Friend[],
  friendRequests: FriendRequest[],
  invitations: GameInvitation[],
}

export type PlayerWithId = {
  id: ObjectId
} & Player


export type Game = {
  path: string,
  white: PlayerWithId,
  black: PlayerWithId,
  timeoutId: number | null,
} & GameData