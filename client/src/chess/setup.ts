import type { GameState, PieceBoard, PieceType } from "./types";

export const BOARD_SIZE = 8;

export function createInitialBoard(): GameState {
  const board: PieceBoard = Array.from(
    { length: BOARD_SIZE },
    () => Array.from({ length: BOARD_SIZE }, () => null),
  );

  const backRank: PieceType[] = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];
  for (let tileX = 0; tileX < BOARD_SIZE; tileX++) {
    board[0][tileX] = { type: backRank[tileX], color: "black" };
    board[1][tileX] = { type: "pawn", color: "black" };
    board[6][tileX] = { type: "pawn", color: "white" };
    board[7][tileX] = { type: backRank[tileX], color: "white" };
  }

  return {
    board,
    turn: "white",
    enPassantTarget: null,
  };
}
