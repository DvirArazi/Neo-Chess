import { PieceColor, PieceData } from "shared/types/piece";

export function comparePieces(first: PieceData, second: PieceData) {
  return first.type === second.type && first.color === second.color;
}

export function getOppositeColor(color: PieceColor) {
  return color === PieceColor.White ? PieceColor.Black : PieceColor.White;
}