export interface ServerToClientEvents {
  roomJoined: (data: { roomId: string; playerId: string }) => void;
  gameStateUpdated: (data: { fenLikeState: string }) => void;
  errorMessage: (message: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (data: { roomId: string; name: string }) => void;
  createRoom: (data: { name: string }) => void;
  makeMove: (data: { roomId: string; from: string; to: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  playerId?: string;
  roomId?: string;
}