import { BOARD_SIDE } from "shared/tools/boardLayout";
import { GameTurn, Point } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export function turnsToColor(turns: GameTurn[]) {
  return turns.length % 2 == 0 ? PieceColor.White : PieceColor.Black;
}

export function pointsToAction(from: Point, to: Point) {
  return (
    from.x +
    from.y * BOARD_SIDE +
    to.x * BOARD_SIDE ** 2 +
    to.y * BOARD_SIDE ** 3
  );
}

export function actionToIndexes(action: number): {from: Point, to: Point} {
  const from: Point = {
    x: action % BOARD_SIDE,
    y: Math.floor(action % BOARD_SIDE ** 2 / BOARD_SIDE),
  };
  const to: Point = {
    x: Math.floor(action / BOARD_SIDE ** 2) % BOARD_SIDE,
    y: Math.floor(action / BOARD_SIDE ** 3)
  };
  return { from: from, to: to };
}