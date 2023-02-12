import { timeframeToTimeFormat } from "shared/tools/general";
import { getOppositeColor } from "shared/tools/piece";
import { DrawReason, GameStatus, GameStatusCatagory, TimeFormat, Timeframe, WinReason } from "shared/types/game";
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

export function timeframeToString(timeframe: Timeframe) {
  if (timeframe === "untimed") return 'Untimed';

  return `${timeToString(timeframe.overallSec)} | ${timeToString(timeframe.incSec)}`;
}

export function getFormatBannerString(timeframe: Timeframe, isRated: boolean) {
  return `${timeframeToString(timeframe)}` +
    ` • ${timeFormatToString(timeframeToTimeFormat(timeframe))}` +
    ` • ${isRated ? 'Rated' : 'Casual'}`;
}

export function getColorName(color: PieceColor) {
  switch (color) {
    case PieceColor.White: return 'White';
    case PieceColor.Black: return 'Black';
  }
}

export function gameStatusToMessage(status: GameStatus) {
  switch (status.catagory) {
    case GameStatusCatagory.Win: {
      const winColor = getColorName(status.winColor);
      const reason = (() => {
        switch (status.reason) {
          case WinReason.Checkmate: return ' by checkmate';
          case WinReason.Stalemate: return ' by stalemate';
          case WinReason.KingCaptured: return ' by capturing the opponent\'s king';
          case WinReason.Resignation: return `, ${getColorName(getOppositeColor(status.winColor))} resigned`;
          case WinReason.Timeout: return ' by timeout';
        }
      })()
      return `${winColor} won${reason}`;
    }
    case GameStatusCatagory.Draw: {
      const reason = (() => {
        switch (status.reason) {
          case DrawReason.Agreement: return 'agreement';
          case DrawReason.InsufficientMaterial: return 'insufficient material';
          case DrawReason.Repetition: return 'repetition';
        }
      })()
      return `Draw by ${reason}`;
    }
    default: {
      throw new Error(`MenuTitle opened with an invalid status catagory: ${status.catagory}`);
    }
  }
}