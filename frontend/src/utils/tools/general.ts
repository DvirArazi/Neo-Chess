import { TimeFormat } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export function timeToString(time: number) {
  if (time < 60) {
    return `${time}s`;
  }
  if (time < 60 * 60) {
    return `${time / 60}m`;
  }
  return `${time / (60 * 60)}h`;
}

export function timeFormatToString(timeFormat: TimeFormat): string {
  switch (timeFormat) {
    case TimeFormat.Untimed: return "Untimed";
    case TimeFormat.Bullet: return "Bullet";
    case TimeFormat.Blitz: return "Blitz";
    case TimeFormat.Rapid: return "Rapid";
    case TimeFormat.Classical: return "Classical";
  }
}

export function getColorName(color: PieceColor) {
  switch (color) {
    case PieceColor.White: return 'White';
    case PieceColor.Black: return 'Black';
  }
}