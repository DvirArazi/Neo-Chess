export type AuthenticatedUser = {
  id: string;
  username: string;
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

export interface ServerToClientEvents {
  roomJoined: (data: { roomId: string; playerId: string }) => void;
  gameStateUpdated: (data: { fenLikeState: string }) => void;
  errorMessage: (message: string) => void;
  authStateChanged: (data: { user: AuthenticatedUser | null }) => void;
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
