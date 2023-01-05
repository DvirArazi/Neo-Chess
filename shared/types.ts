import { TokenPayload } from "google-auth-library";
import { ObjectId } from "mongodb";

export interface ClientToServerEvents {
  openGameRequest: (clock: Clock, onCreated: (gameId: string) => void) => void;
  signIn: (idToken: string) => void;
  autoSignIn: (aad: AutoAuthData) => void;
  signOut: (aad: AutoAuthData) => void;
  playerMoved: (from: Point, to: Point) => void;
}
export interface ServerToClientEvents {
  signedIn: (aad: AutoAuthData, data: TokenPayload) => void;
  autoSignedIn: (data: TokenPayload) => void;
  signedOut: () => void;
  opponentMoved: (from: Point, to: Point) => void;
}

export type User = {
  sub: string,
  keys: string[],
  data: TokenPayload,
}

export type AutoAuthData = {
  id: ObjectId,
  key: string,
}

type Point = {
  x: number,
  y: number,
}

export type Clock = {
  time: number,
  increment: number,
}