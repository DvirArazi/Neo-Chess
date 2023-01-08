import { TokenPayload } from "google-auth-library";
import { ObjectId } from "mongodb";
import { PieceData } from "./pieceData";

export interface ClientToServerEvents {
  signIn: (idToken: string) => void;
  autoSignIn: (aad: AutoAuthData) => void;
  signOut: (aad: AutoAuthData) => void;
  createGameRequest: (gameSettings: GameSettings) => void;
  getGameViewData: (gameId: string, dataCallback: (data: GameViewData | undefined) => void) => void;
  playerMoved: (from: Point, to: Point) => void;
}
export interface ServerToClientEvents {
  signedIn: (aad: AutoAuthData, data: TokenPayload) => void;
  autoSignedIn: (data: TokenPayload) => void;
  signedOut: () => void;
  createdGame: (path: string) => void;
  opponentMoved: (from: Point, to: Point) => void;
}

export type AutoAuthData = {
  id: ObjectId,
  key: string,
}

type Point = {
  x: number,
  y: number,
}

export type Timeframe = {
  timePerTurn: number,
  increment: number,
}

export type GameSettings = {
  timeframe: Timeframe,
  isRated: boolean,
}

export type GameRequest = {
  userId: ObjectId,
  data: GameSettings
}

export enum GameRole {
  White,
  Black,
  Viewer,
}

export type GameState = {
  position: Array<PieceData | undefined>,
  whiteTime: number,
  blackTime: number,
};

export type GameHistory = Array<GameState>;

export type Player = {
  name: string,
  rating: number,
}

export type GameViewData = {
  role: GameRole,
  white: Player,
  black: Player,
  settings: GameSettings,
  history: GameHistory,
}

export type TimeFormats =
  "Untimed" |
  "Bullet" |
  "Blitz" |
  "Rapid" |
  "Classical"