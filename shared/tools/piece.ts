import { IconName } from "frontend/src/utils/types/iconName";
import { PieceColor, PieceData, PieceType } from "shared/types/piece";

export function comparePieces(first: PieceData, second: PieceData) {
  return first.type === second.type && first.color === second.color;
}

export function getOppositeColor(color: PieceColor) {
  return color === PieceColor.White ? PieceColor.Black : PieceColor.White;
}

export function pieceDataToIconName(data: PieceData): IconName {
  const compare = (other: PieceData) => {
    return comparePieces(data, other);
  }

  if (compare({ type: PieceType.Pawn, color: PieceColor.Black })) return "chessPawnBlack";
  if (compare({ type: PieceType.Bishop, color: PieceColor.Black })) return "chessBishopBlack";
  if (compare({ type: PieceType.Knight, color: PieceColor.Black })) return "chessKnightBlack";
  if (compare({ type: PieceType.Rook, color: PieceColor.Black })) return "chessRookBlack";
  if (compare({ type: PieceType.Queen, color: PieceColor.Black })) return "chessQueenBlack";
  if (compare({ type: PieceType.King, color: PieceColor.Black })) return "chessKingBlack";
  if (compare({ type: PieceType.Pawn, color: PieceColor.White })) return "chessPawnWhite";
  if (compare({ type: PieceType.Bishop, color: PieceColor.White })) return "chessBishopWhite";
  if (compare({ type: PieceType.Knight, color: PieceColor.White })) return "chessKnightWhite";
  if (compare({ type: PieceType.Rook, color: PieceColor.White })) return "chessRookWhite";
  if (compare({ type: PieceType.Queen, color: PieceColor.White })) return "chessQueenWhite";
  if (compare({ type: PieceType.King, color: PieceColor.White })) return "chessKingWhite";

  throw new Error(`PieceData provided does not correlate to any icon name: ${data.type}, ${data.color}`);
}

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