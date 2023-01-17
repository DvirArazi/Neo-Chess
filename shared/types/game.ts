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
  Untimed,
  Bullet,
  Blitz,
  Rapid,
  Classical,
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
  promotion: PieceType | null
}

export type Player = {
  name: string,
  rating: number,
}

export type GameData = {
  timeframe: Timeframe,
  isRated: boolean,
  start: PieceType[],
  timeLastTurn: number,
}

export type GameViewData = {
  id: ObjectId,
  role: GameRole,
  white: Player,
  black: Player,
  turns: GameTurn[],
} & GameData

export enum MoveError {
  NoPiece = 'There\'s no piece on the specified sqaure',
  WrongColor = 'The piece on the specified square belongs to the opponent',
  NoMoves = 'The piece on the specified square has no moves',
}

export enum GameStatusCatagory {
  Ongoing,
  Win,
  Draw,
}

export enum WinReason {
  Resignation,
  Checkmate,
  KingCaptured,
  Timeout,
}

export enum DrawReason {
  InsufficientMaterial,
  Repetition,
  Agreement,
}

export type GameStatus =
  {
    catagory: GameStatusCatagory.Ongoing,
  } |
  {
    catagory: GameStatusCatagory.Win,
    winSide: PieceColor,
    reason: WinReason,
  } |
  {
    catagory: GameStatusCatagory.Draw,
    reason: DrawReason,
  }