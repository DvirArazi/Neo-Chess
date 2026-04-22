export type Square = {
  x: number;
  y: number;
};

export type PieceType =
  | "bishop"
  | "king"
  | "knight"
  | "pawn"
  | "queen"
  | "rook";

export type PieceColor = "white" | "black";

export type MoveInput = {
  from: Square;
  to: Square;
  promotion?: PieceType;
};

export type Piece = {
  type: PieceType;
  color: PieceColor;
};

export type PieceBoard = (Piece | null)[][];

export type GameState = {
  board: PieceBoard;
  turn: PieceColor;
  enPassantTarget: Square | null;
};
