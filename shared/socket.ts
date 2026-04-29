export type AuthenticatedUser = {
  id: string;
  username: string;
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

export interface ServerToClientEvents {
  roomJoined: (data: { roomId: string; playerId: string }) => void;
  gameStateUpdated: (data: { fenLikeState: string }) => void;
  errorMessage: (message: string) => void;
  authStateChanged: (data: { user: AuthenticatedUser | null }) => void;
  friendsChanged: () => void;
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
  sessionId?: string;
}
