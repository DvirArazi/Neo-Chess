import { PieceColor, PieceData, PieceType } from "./piece";

export type Point = {
  x: number,
  y: number,
}

export type Timeframe = {
  overallSec: number,
  incSec: number,
} | "untimed"

export enum TimeFormat {
  Untimed,
  Bullet,
  Blitz,
  Rapid,
  Classical,
}

export type GameRequest = {
  userId: string,
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
  timeLeftMs: number,
  promotionType: PieceType | null,
  rep: string,
}

export type Player = {
  id: string,
  name: string,
  rating: number,
  ratingMod: number | null,
}

export type GameData = {
  timeframe: Timeframe,
  isRated: boolean,
  start: PieceType[],
  timeLastTurnMs: number,
  startRep: string,
  turns: GameTurn[],
  status: GameStatus,
}

export type GameDataWithPlayers = {
  timeframe: Timeframe,
  isRated: boolean,
  start: PieceType[],
  timeLastTurnMs: number,
  startRep: string,
  turns: GameTurn[],
  status: GameStatus,
  white: Player,
  black: Player,
}

export type GameViewData = {
  id: string,
  role: GameRole,
} & GameDataWithPlayers

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
  Stalemate,
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
    winColor: PieceColor,
    reason: WinReason,
  } |
  {
    catagory: GameStatusCatagory.Draw,
    reason: DrawReason,
  }