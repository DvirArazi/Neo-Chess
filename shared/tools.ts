import { Terminal } from "backend/src/utils/terminal";
import { BoardLayout } from "frontend/src/utils/types";
import { BOARD_SIDE } from "shared/globals";
import { PieceColor } from "shared/types/pieceTypes";
import { MoveError, Point, TimeFormats, Timeframe } from "./types/gameTypes";

export function removeFirst<T>(arr: T[], value: T) {
  let index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

export function timeframeToTimeFormat(timeframe: Timeframe | undefined): TimeFormats {
  if (timeframe === undefined) return TimeFormats.Untimed;

  const total = timeframe.timeOverall + timeframe.increment * 40;
  if (total < 180) return TimeFormats.Bullet;
  if (total < 500) return TimeFormats.Blitz;
  if (total < 1500) return TimeFormats.Rapid;
  return TimeFormats.Classical;
}

export function remove<T>(array: T[], value: T): boolean {
  const index = array.indexOf(value);
  if (index <= -1) return false;

  array.splice(index, 1);

  return true;
}

// export class Ref<T> {
//   value: T;
  
//   constructor(value: T) {
//     this.value = value;
//   }
// }