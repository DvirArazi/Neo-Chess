import { TimeFormats, Timeframe } from "./types";

export function removeFirst<T>(arr: T[], value: T) {
  let index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

export function timeFormatByTimeframe(timeframe: Timeframe | undefined): TimeFormats {
  if (timeframe === undefined) return TimeFormats.Untimed;

  const total = timeframe.timePerTurn + timeframe.increment * 40;
  if (total < 180) return TimeFormats.Bullet;
  if (total < 500) return TimeFormats.Blitz;
  if (total < 1500) return TimeFormats.Rapid;
  return TimeFormats.Classical;
}

// export class Ref<T> {
//   value: T;
  
//   constructor(value: T) {
//     this.value = value;
//   }
// }