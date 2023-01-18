import { Point } from "shared/types/game";

export function comparePoints(first: Point, second: Point) {
  return first.x === second.x && first.y === second.y;
}