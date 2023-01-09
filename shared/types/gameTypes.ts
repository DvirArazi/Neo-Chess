import { ObjectId } from "mongodb";
import { PieceData, PieceType } from "./pieceTypes";

export type Point = {
  x: number,
  y: number,
}

export type Timeframe = {
  timePerTurn: number,
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

export type GameTurn = {
  action: Uint8Array,
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
}

export type GameViewData = {
  role: GameRole,
  white: Player,
  black: Player,
} & GameData