import { TokenPayload } from "google-auth-library";
import { ObjectId } from "mongodb";
import { GameData, GameTurn, Player, Timeframe } from "shared/types/game";
import { Friend, FriendRequest, GameInvitation } from "shared/types/general";
import { PieceColor } from "shared/types/piece";
import { AutoAuthData, ClientToServerEvents, ServerToClientEvents } from "shared/types/webSocket";
import { Server, Socket } from "socket.io";

export type WebSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type ServerSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export type User = {
  googleId: string,
  socketIds: string[],
  aadKeys: string[],
  data: TokenPayload,
  gameRequestId: string | null,
  outInvitation: GameInvitation | null,
  ongoingGamesIds: string[],
  historyGamesIds: string[],
  name: string,
  ratings: number[],
  friends: Friend[],
  friendRequests: FriendRequest[],
  invitations: GameInvitation[],
}

export type Game = {
  path: string,
  timeoutId: number | null,
  white: Player,
  black: Player,
  viewerSocketIds: string[],
  drawOffer: PieceColor | null,
  takeback: {color: PieceColor, toTurn: number} | null
} & GameData