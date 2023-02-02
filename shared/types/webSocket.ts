import { ObjectId } from "mongodb";
import { Friend, FriendRequest, FriendsModalData, GamesModalData, UserViewData } from "shared/types/general";
import { PieceColor, PieceType } from "shared/types/piece";
import { GameStatus, GameTurn, GameViewData, Point, Timeframe } from "./game";

export interface ClientToServerEvents {
  signIn: (idToken: string) => void;
  autoSignIn: (aad: AutoAuthData) => void;
  signOut: () => void;
  removeKey: (aad: AutoAuthData) => void;
  getSignedInRowData: (callback: (gamesModalData: GamesModalData, friendsModalData: FriendsModalData) => void) => void;
  getFriendsSearchData: (name: string, callback: (friendsSearchData: FriendRequest[]) => void) => void;
  getFriendRequests: (callback: (requests: FriendRequest[]) => void) => void;
  friendRequest: (friendId: ObjectId, callback: (success: boolean) => void) => void;
  getFriends: (callback: (friends: Friend[]) => void) => void;
  responseToFriendRequest: (friendId: ObjectId, isAccepted: boolean) => void;
  deleteFriend: (friendId: ObjectId) => void;
  getHomeData: (callback: (friends: Friend[], ratings: number[]) => void) => void;
  createGameRequest: (timeframe: Timeframe, isRated: boolean, ratingRelMin: number, ratingRelMax: number) => void;
  getGameViewData: (gameId: string, dataCallback: (data: GameViewData | "404") => void) => void;
  playerMove: (gameId: ObjectId, from: Point, to: Point, promotionType: PieceType | null) => void;
}
export interface ServerToClientEvents {
  signedIn: (aad: AutoAuthData, data: UserViewData) => void;
  autoSignedIn: (data: UserViewData) => void;
  signedOut: () => void;
  friendRequestsUpdated: (requests: FriendRequest[]) => void;
  friendsUpdated: (friends: Friend[]) => void;
  createdGame: (path: string) => void;
  playerMoved: (gameId: ObjectId, gameTurn: GameTurn, status: GameStatus, timeCrntTurnMs: number) => void;
  timeout: (gameId: ObjectId, winColor: PieceColor) => void;
}

export type AutoAuthData = {
  id: ObjectId,
  key: string,
}