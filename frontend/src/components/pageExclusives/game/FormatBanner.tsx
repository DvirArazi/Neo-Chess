import { Box } from "@mui/material";
import { timeFormatToString, timeToString } from "frontend/src/utils/tools/general";
import { timeframeToTimeFormat } from "shared/tools/general";
import { TimeFormat, Timeframe } from "shared/types/game";

export default function FormatBanner(props: {
  timeframe: Timeframe,
  isRated: boolean | null,
  isWide: boolean,
}) {
  const { timeframe, isRated, isWide } = props;

  const timeStr = timeframe === "untimed" ? 'Untimed' :
    `${timeToString(timeframe.overallSec)} | ${timeToString(timeframe.incSec)} • ` +
    timeFormatToString(timeframeToTimeFormat(timeframe));
  const isRatedStr = isRated === null ? '' : `${isRated ? 'Rated' : 'Casual'}`

  return <Box sx={{
    padding: `0 0 0 0`,
    textAlign: 'center',
    fontFamily: 'robotoslab',
  }}>
    <>
      {timeStr}
      {getRatedComponent()}
    </>
  </Box>;

  function getRatedComponent() {
    if (isRated === null) return <></>;

    const isRatedStr = isRated ? 'Rated' : 'Casual';

    return isWide ? <Box>{isRatedStr}</Box> : ` • ${isRatedStr}`;
  }
}
