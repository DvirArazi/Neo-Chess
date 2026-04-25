import type { GameState, PieceBoard, PieceType } from "./types";

export const BOARD_SIZE = 8;

function takeRandom<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length);
  const [item] = items.splice(index, 1);
  return item;
}

function createFischerRandomBackRank(): PieceType[] {
  const backRank: (PieceType | null)[] = Array.from(
    { length: BOARD_SIZE },
    () => null,
  );
  const evenSquares = [0, 2, 4, 6];
  const oddSquares = [1, 3, 5, 7];

  const firstBishop = takeRandom(evenSquares);
  const secondBishop = takeRandom(oddSquares);
  backRank[firstBishop] = "bishop";
  backRank[secondBishop] = "bishop";

  const availableSquares = backRank
    .map((piece, index) => (piece === null ? index : null))
    .filter((index): index is number => index !== null);

  const queenSquare = takeRandom(availableSquares);
  backRank[queenSquare] = "queen";

  const firstKnightSquare = takeRandom(availableSquares);
  backRank[firstKnightSquare] = "knight";
  const secondKnightSquare = takeRandom(availableSquares);
  backRank[secondKnightSquare] = "knight";

  availableSquares.sort((a, b) => a - b);
  backRank[availableSquares[0]] = "rook";
  backRank[availableSquares[1]] = "king";
  backRank[availableSquares[2]] = "rook";

  return backRank.map((piece) => piece ?? "pawn");
}

export function createInitialBoard(): GameState {
  const board: PieceBoard = Array.from(
    { length: BOARD_SIZE },
    () => Array.from({ length: BOARD_SIZE }, () => null),
  );
  const backRank = createFischerRandomBackRank();

  for (let tileX = 0; tileX < BOARD_SIZE; tileX += 1) {
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
