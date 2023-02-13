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
  friendRequest: (friendId: string, callback: (success: boolean) => void) => void;
  responseToFriendRequest: (friendId: string, isAccepted: boolean) => void;
  responseToInvitation: (friendId: string, isAccepted: boolean) => void;
  deleteFriend: (friendId: string) => void;
  deleteGameRequest: (callback: () => void) => void;
  getHomeData: (callback: (ratings: number[]) => void) => void;
  getFriends: (callback: (friends: Friend[]) => void) => void;
  createGameRequest: (timeframe: Timeframe, isRated: boolean, ratingRelMin: number, ratingRelMax: number) => void;
  sendGameInvitation: (timeframe: Timeframe, isRated: boolean, friendId: string, callback: (sent: boolean) => void) => void;
  getGameViewData: (gameId: string, dataCallback: (data: GameViewData | "404") => void) => void;
  getHistoryGames: (callback: (games: GameTd[] | "404") => void) => void;
  playerMove: (gameId: string, from: Point, to: Point, promotionType: PieceType | null) => void;
  resign: (gameId: string) => void;
  drawOffer: (gameId: string) => void;
  drawAccept: (gameId: string) => void;
  takebackRequest: (gameId: string) => void;
  takebackAccept: (gameId: string) => void;
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
  playerMoved: (gameId: string, gameTurn: GameTurn, status: GameStatus, timeCrntTurnMs: number) => void;
  timeout: (gameId: string, winColor: PieceColor) => void;
  resigned: (gameId: string, winColor: PieceColor) => void;
  drawOffered: (gameId: string) => void;
  drawAccepted: (gameId: string) => void;
  takebackRequested: (gameId: string) => void;
  takebackAccepted: (gameId: string, toTurn: number, timeCrntTurnMs: number) => void;
}

export type AutoAuthData = {
  id: string,
  key: string,
}