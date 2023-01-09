export enum PieceType {
  King,
  Queen,
  Rook,
  Knight,
  Bishop,
  Pawn,
}

export enum PieceColor {
  White,
  Black,
}

export type PieceData = {
  type: PieceType,
  color: PieceColor,
}