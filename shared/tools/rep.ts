import { BOARD_SIDE } from "shared/tools/boardLayout";
import { pieceDataToRepChar } from "shared/tools/piece";
import { BoardLayout } from "shared/types/boardLayout";
import { GameTurn } from "shared/types/game";

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

export function hasCausedRepetition(turns: GameTurn[], startRep: string): boolean {
  const repLast = turns[turns.length - 1].rep;
  if (startRep === repLast) {
    return true;
  }

  for (let i = 0; i < turns.length - 2; i++) {
    if (turns[i].rep === repLast) {
      return true;
    }
  }

  return false;
}