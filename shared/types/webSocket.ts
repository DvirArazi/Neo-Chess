import { TokenPayload } from "google-auth-library";
import { ObjectId } from "mongodb";
import { GameTurn, GameViewData, Point, Timeframe } from "./game";

export interface ClientToServerEvents {
  signIn: (idToken: string) => void;
  autoSignIn: (aad: AutoAuthData) => void;
  signOut: () => void;
  removeKey: (aad: AutoAuthData) => void;
  createGameRequest: (timeframe: Timeframe, isRated: boolean, ratingRelMin: number, ratingRelMax: number) => void;
  getGameViewData: (gameId: string, dataCallback: (data: GameViewData | "404") => void) => void;
  playerMove: (gameId: ObjectId, from: Point, to: Point) => void;
}
export interface ServerToClientEvents {
  signedIn: (aad: AutoAuthData, data: TokenPayload) => void;
  autoSignedIn: (data: TokenPayload) => void;
  signedOut: () => void;
  createdGame: (path: string) => void;
  playerMoved: (gameTurn: GameTurn) => void;
}

export type AutoAuthData = {
  id: ObjectId,
  key: string,
}

