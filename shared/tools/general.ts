import { TimeFormat, Timeframe } from "../types/game";

export function removeFirst<T>(arr: T[], value: T) {
  let index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

export function timeframeToTimeFormat(timeframe: Timeframe): TimeFormat {
  if (timeframe === "untimed") return TimeFormat.Untimed;

  const total = timeframe.overallSec + timeframe.incSec * 40;
  if (total < 180) return TimeFormat.Bullet;
  if (total < 500) return TimeFormat.Blitz;
  if (total < 1500) return TimeFormat.Rapid;
  return TimeFormat.Classical;
}

export function remove<T>(array: T[], value: T): boolean {
  const index = array.indexOf(value);
  if (index <= -1) return false;

  array.splice(index, 1);

  return true;
}

export function getOrFallback<T>(value: T | undefined, fallback: T): T {
  if (value === undefined) return fallback;

  return value;
}

// export class Ref<T> {
//   value: T;
  
//   constructor(value: T) {
//     this.value = value;
//   }
// }