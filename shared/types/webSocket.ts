import { ObjectId } from "mongodb";
import { Friend, FriendRequest, FriendsModalData, GameInvitation, GameRequestTd, GamesModalData, GameTd, UserViewData } from "shared/types/general";
import { PieceColor, PieceType } from "shared/types/piece";
import { GameStatus, GameTurn, GameViewData, Point, Timeframe } from "./game";

export interface ClientToServerEvents {
  signIn: (idToken: string) => void;
  autoSignIn: (aad: AutoAuthData) => void;
  signOut: (aad: AutoAuthData) => void;
  removeKey: (aad: AutoAuthData) => void;
  getSignedInRowData: (callback: (gamesModalData: GamesModalData, friendsModalData: FriendsModalData) => void) => void;
  getFriendsSearchData: (name: string, callback: (friendsSearchData: FriendRequest[]) => void) => void;
  friendRequest: (friendId: ObjectId, callback: (success: boolean) => void) => void;
  responseToFriendRequest: (friendId: ObjectId, isAccepted: boolean) => void;
  responseToInvitation: (friendId: ObjectId, isAccepted: boolean) => void;
  deleteFriend: (friendId: ObjectId) => void;
  deleteGameRequest: (callback: () => void) => void;
  getHomeData: (callback: (ratings: number[]) => void) => void;
  getFriends: (callback: (friends: Friend[]) => void) => void;
  createGameRequest: (timeframe: Timeframe, isRated: boolean, ratingRelMin: number, ratingRelMax: number) => void;
  sendGameInvitation: (timeframe: Timeframe, isRated: boolean, friendId: ObjectId, callback: (sent: boolean) => void) => void;
  getGameViewData: (gameId: string, dataCallback: (data: GameViewData | "404") => void) => void;
  playerMove: (gameId: ObjectId, from: Point, to: Point, promotionType: PieceType | null) => void;
}
export interface ServerToClientEvents {
  signedIn: (aad: AutoAuthData, data: UserViewData) => void;
  autoSignedIn: (data: UserViewData) => void;
  signedOut: () => void;
  friendRequestsUpdated: (requests: FriendRequest[]) => void;
  friendsUpdated: (friends: Friend[]) => void;
  gameRequestUpdated: (gameRequestTd: GameRequestTd | null) => void;
  gameInvitationsUpdated: (invitations: GameInvitation[]) => void;
  ongoingGamesUpdated: (gamesTd: GameTd[]) => void;
  createdGame: (path: string) => void;
  playerMoved: (gameId: ObjectId, gameTurn: GameTurn, status: GameStatus, timeCrntTurnMs: number) => void;
  timeout: (gameId: ObjectId, winColor: PieceColor) => void;
}

export type AutoAuthData = {
  id: ObjectId,
  key: string,
}