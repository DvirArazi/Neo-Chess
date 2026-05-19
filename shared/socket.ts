import type { GameState, MoveInput, PieceColor } from "./chess/types.js";

export type AuthenticatedUser = {
  id: string;
  username: string;
  elo: number;
};

export type FriendRequest = {
  id: string;
  userId: string;
  username: string;
};

export type FriendEntry = {
  id: string;
  username: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
};

export type AuthActionResponse =
  | {
    ok: true;
    user: AuthenticatedUser;
    sessionToken: string;
  }
  | {
    ok: false;
    error: string;
  };

export type BasicActionResponse =
  | { ok: true }
  | { ok: false; error: string };

export type FriendsActionResponse =
  | {
    ok: true;
    requests: FriendRequest[];
    users: FriendEntry[];
    hasUnseenRequests: boolean;
  }
  | { ok: false; error: string };

export type OnlineMatchRequest = {
  mode: "rated" | "casual";
  timeControlId: string;
  opponentId: string | null;
  ratingMin: number;
  ratingMax: number;
};

export type OnlineMatchFound = {
  gameId: string;
  color: "white" | "black";
  opponent: AuthenticatedUser;
  timeControlId: string;
  mode: "rated" | "casual";
};

export type OnlineMatchResponse =
  | { ok: true; status: "queued" }
  | { ok: true; status: "matched"; match: OnlineMatchFound }
  | { ok: false; error: string };

export type OnlineGamePlayer = AuthenticatedUser & {
  color: PieceColor;
};

export type OnlineGameStatus =
  | { type: "active" }
  | { type: "draw"; reason: "agreement" | "insufficient-material" | "stalemate" }
  | { type: "resigned"; winner: PieceColor; loser: PieceColor }
  | {
    type: "win";
    reason: "checkmate" | "stalemate" | "threefold-repetition";
    winner: PieceColor;
    loser: PieceColor;
  }
  | { type: "checkmate"; winner: PieceColor; loser: PieceColor };

export type OnlineGamePieRule = {
  originalBlackUserId: string;
  wasUsed: boolean;
};

export type OnlineGameState = {
  id: string;
  mode: "rated" | "casual";
  timeControlId: string;
  players: Record<PieceColor, OnlineGamePlayer>;
  state: GameState;
  history: GameState[];
  moves: MoveInput[];
  status: OnlineGameStatus;
  pieRule?: OnlineGamePieRule;
  ratingDeltas?: Record<PieceColor, number>;
  drawOffer?: {
    offeredBy: PieceColor;
  };
  createdAt: number;
  updatedAt: number;
};

export type OnlineGameListEntry = {
  id: string;
  mode: OnlineGameState["mode"];
  timeControlId: string;
  players: OnlineGameState["players"];
  state: GameState;
  status: OnlineGameStatus;
  updatedAt: number;
};

export type OnlineGamesActionResponse =
  | { ok: true; games: OnlineGameListEntry[] }
  | { ok: false; error: string };

export interface ServerToClientEvents {
  roomJoined: (data: { roomId: string; playerId: string }) => void;
  gameStateUpdated: (data: { fenLikeState: string }) => void;
  errorMessage: (message: string) => void;
  authStateChanged: (data: { user: AuthenticatedUser | null }) => void;
  friendsChanged: () => void;
  onlineMatchFound: (data: OnlineMatchFound) => void;
  onlineGameUpdated: (data: OnlineGameState) => void;
}

export interface ClientToServerEvents {
  signUp: (
    data: {
      username: string;
      password: string;
      passwordConfirmation?: string;
    },
    callback: (response: AuthActionResponse) => void,
  ) => void;
  logIn: (
    data: { username: string; password: string },
    callback: (response: AuthActionResponse) => void,
  ) => void;
  logOut: (callback: (response: BasicActionResponse) => void) => void;
  getFriends: (
    data: { search?: string; markRequestsSeen?: boolean },
    callback: (response: FriendsActionResponse) => void,
  ) => void;
  sendFriendRequest: (
    data: { userId: string },
    callback: (response: BasicActionResponse) => void,
  ) => void;
  approveFriendRequest: (
    data: { requestId: string },
    callback: (response: BasicActionResponse) => void,
  ) => void;
  denyFriendRequest: (
    data: { requestId: string },
    callback: (response: BasicActionResponse) => void,
  ) => void;
  unfriend: (
    data: { userId: string },
    callback: (response: BasicActionResponse) => void,
  ) => void;
  findOnlineMatch: (
    data: OnlineMatchRequest,
    callback: (response: OnlineMatchResponse) => void,
  ) => void;
  cancelOnlineMatch: (callback: (response: BasicActionResponse) => void) => void;
  getOnlineGame: (
    data: { gameId: string },
    callback: (
      response:
        | { ok: true; game: OnlineGameState }
        | { ok: false; error: string },
    ) => void,
  ) => void;
  listOnlineGames: (
    callback: (response: OnlineGamesActionResponse) => void,
  ) => void;
  makeOnlineMove: (
    data: { gameId: string; move: MoveInput },
    callback: (response: BasicActionResponse) => void,
  ) => void;
  useOnlinePieRule: (
    data: { gameId: string },
    callback: (response: BasicActionResponse) => void,
  ) => void;
  resignOnlineGame: (
    data: { gameId: string },
    callback: (response: BasicActionResponse) => void,
  ) => void;
  offerOnlineDraw: (
    data: { gameId: string },
    callback: (response: BasicActionResponse) => void,
  ) => void;
  respondOnlineDrawOffer: (
    data: { gameId: string; accepted: boolean },
    callback: (response: BasicActionResponse) => void,
  ) => void;
  joinRoom: (data: { roomId: string; name: string }) => void;
  createRoom: (data: { name: string }) => void;
  makeMove: (data: { roomId: string; from: string; to: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  playerId?: string;
  roomId?: string;
  userId?: string;
  username?: string;
  elo?: number;
  sessionId?: string;
}
