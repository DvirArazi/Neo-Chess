import { TokenPayload } from "google-auth-library";
import { ObjectId } from "mongodb";
import { PieceData } from "./pieceData";

export interface ClientToServerEvents {
  signIn: (idToken: string) => void;
  autoSignIn: (aad: AutoAuthData) => void;
  signOut: (aad: AutoAuthData) => void;
  openGameRequest: (gameSettings: GameSettings) => void;
  playerMoved: (from: Point, to: Point) => void;
}
export interface ServerToClientEvents {
  signedIn: (aad: AutoAuthData, data: TokenPayload) => void;
  autoSignedIn: (data: TokenPayload) => void;
  signedOut: () => void;
  gameCreated: (
    isWhite: boolean,
    player0: Player,
    player1: Player,
    boardLayout: BoardLayout,
    gameSettings: GameSettings
  ) => void;
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

export type BoardLayout = Array<PieceData | undefined>;

export type Player = {
  name: string,
  rating: number,
}

export enum TimeFormats {
  Untimed,
  Bullet,
  Blitz,
  Rapid,
  Classical,
}