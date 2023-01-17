import { Game } from "backend/src/utils/types";
import { comparePieces } from "shared/tools/piece";
import { BoardLayout } from "shared/types/boardLayout";
import { PieceColor, PieceData, PieceType } from "shared/types/piece";

export function pieceDataToRepChar(data: PieceData): string {
  const compare = (other: PieceData) => {
    return comparePieces(data, other);
  }

  if (compare({ type: PieceType.Pawn, color: PieceColor.Black })) return 'p';
  if (compare({ type: PieceType.Bishop, color: PieceColor.Black })) return 'b';
  if (compare({ type: PieceType.Knight, color: PieceColor.Black })) return 'n';
  if (compare({ type: PieceType.Rook, color: PieceColor.Black })) return 'r';
  if (compare({ type: PieceType.Queen, color: PieceColor.Black })) return 'q';
  if (compare({ type: PieceType.King, color: PieceColor.Black })) return 'k';
  if (compare({ type: PieceType.Pawn, color: PieceColor.White })) return 'P';
  if (compare({ type: PieceType.Bishop, color: PieceColor.White })) return 'B';
  if (compare({ type: PieceType.Knight, color: PieceColor.White })) return 'N';
  if (compare({ type: PieceType.Rook, color: PieceColor.White })) return 'R';
  if (compare({ type: PieceType.Queen, color: PieceColor.White })) return 'Q';
  if (compare({ type: PieceType.King, color: PieceColor.White })) return 'K';

  throw new Error(`PieceData provided does not correlate to any character: ${data.type}, ${data.color}`);
}

export function boardLayoutToRep(layout: BoardLayout) {
  let rep = '';
  for (const square of layout) {
    if (square === undefined) {
      rep += '*';
      continue;
    }

    rep += pieceDataToRepChar(square);
  }

  return rep;
}

export function hasCausedRepetition(game: Game): boolean {
  const repLast = game.turns[game.turns.length - 1].rep;
  if (game.startRep === repLast) {
    console.log('start rep', repLast);
    return true;
  }

  for (let i = 0; i < game.turns.length - 2; i++) {
    if (game.turns[i].rep === repLast) {
      console.log('rep', repLast);
      return true;
    }
  }

  return false;
}