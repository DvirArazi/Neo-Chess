import { ObjectId } from "mongodb";
import { PieceColor, PieceData, PieceType } from "./piece";

export type Point = {
  x: number,
  y: number,
}

export type Timeframe = {
  timeOverall: number,
  increment: number,
}

export enum TimeFormats {
  Untimed = 0,
  Bullet = 1,
  Blitz = 2,
  Rapid = 3,
  Classical = 4,
}

export type GameRequest = {
  userId: ObjectId,
  timeframe: Timeframe,
  isRated: boolean,
  ratingAbsMin: number,
  ratingAbsMax: number,
}

export enum EGameRole {
  Viewer = 2,
}
export type GameRole = PieceColor | EGameRole.Viewer

export type GameState = {
  position: Array<PieceData | undefined>,
  whiteTime: number,
  blackTime: number,
};

export type GameTurn = {
  action: number,
  whiteTime: number,
  blackTime: number,
}

export type Player = {
  name: string,
  rating: number,
}

export type GameData = {
  timeframe: Timeframe,
  isRated: boolean,
  start: PieceType[],
  turns: GameTurn[],
  timeLastTurn: number,
}

export type GameViewData = {
  id: ObjectId,
  role: GameRole,
  white: Player,
  black: Player,
} & GameData

export enum MoveError {
  NoPiece = 'There\'s no piece on the specified sqaure',
  WrongColor = 'The piece on the specified square belongs to the opponent',
  NoMoves = 'The piece on the specified square has no moves',
}