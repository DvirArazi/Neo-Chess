import { Box } from "@mui/material";
import { timeFormatToString, timeToString } from "frontend/src/utils/tools/general";
import { timeframeToTimeFormat } from "shared/tools/general";
import { TimeFormat, Timeframe } from "shared/types/game";

export default function TopBanner(props: {
  timeframe: Timeframe,
  isRated: boolean | null
}) {
  const { timeframe, isRated } = props;

  const timeStr = `${timeToString(timeframe.timeOverall)} | ${timeToString(timeframe.increment)}`;
  const formatStr = ` • ${timeFormatToString(timeframeToTimeFormat(timeframe))}`;
  const isRatedStr = isRated === null ? '' : ` • ${isRated ? 'Rated' : 'Casual'}`

  return <Box sx={{
    padding: `15px 0 0 0`,
    textAlign: 'center',
  }}>
    {timeStr}{formatStr}{isRatedStr}
  </Box>
}
