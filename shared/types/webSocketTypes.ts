import { TokenPayload } from "google-auth-library";
import { ObjectId } from "mongodb";
import { GameViewData, Point, Timeframe } from "./gameTypes";

export interface ClientToServerEvents {
  signIn: (idToken: string) => void;
  autoSignIn: (aad: AutoAuthData) => void;
  signOut: (aad: AutoAuthData) => void;
  createGameRequest: (timeframe: Timeframe, isRated: boolean, ratingRelMin: number, ratingRelMax: number) => void;
  getGameViewData: (gameId: string, dataCallback: (data: GameViewData | "404") => void) => void;
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

