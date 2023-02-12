import { Box, Button, Divider, MenuItem, Paper, Select, SelectChangeEvent } from "@mui/material";
import { THEME } from "frontend/src/pages/_app";
import { timeFormatToString, timeToString } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { timeframeToTimeFormat } from "shared/tools/general";
import { TimeFormat, Timeframe } from "shared/types/game";

export default function CustomeFormatPanel(props: {
  onPlay: (clock: Timeframe) => void,
  ratings: number[] | undefined,
}) {
  const { onPlay, ratings } = props;

  const timeOverall = new Stateful(15 * 60);
  const increment = new Stateful(10);

  const format = timeframeToTimeFormat({
    overallSec: timeOverall.value, incSec: increment.value
  });

  const formatStr = timeFormatToString(format);

  const ratingStr = ratings === undefined ?
    '' :
    ` • ${ratings[format as number]}`;

  return <Box sx={{ margin: `auto`, maxWidth: `300px`, fontFamily: `roboto-regular`}}>
    <Paper elevation={3} sx={{
      margin: `20px`,
      padding: `20px`,
      borderRadius: `15px`,
      background: THEME.boxBackground2,
    }}>
      <Box sx={{ paddingBottom: `15px`, fontSize: `13px` }}>{formatStr.toUpperCase()}{ratingStr.toUpperCase()}</Box>
      <Box sx={{
        display: `flex`,
        flexDirection: `row`,
        justifyContent: `space-around`,
      }}>
        {getSelect(timeOverall, timeOveralls)}
        <Divider orientation="vertical" variant="middle" flexItem></Divider>
        {getSelect(increment, increments)}
      </Box>
      <Box sx={{padding: `10px`}}/>
      <Button
        variant="outlined"
        onClick={() => onPlay({
          overallSec: timeOverall.value,
          incSec: increment.value
        })}
        sx={{fontSize: `16px`}}
      >Play</Button>
    </Paper>
  </Box>;

  function getSelect(time: Stateful<number>, times: number[]) {
    return <Box>
      <Select
        value={time.value}
        onChange={(e) => handleChange(e, time)}
        MenuProps={{sx:{overflow: `none`}}}
        sx={{
          width: `90px`,
          background: `white`,
          fontFamily: `roboto-regular`,
          borderRadius: `10px`,
        }}
      >
        {times.map((v, i) =>
          <MenuItem key={i} value={v}>{timeToString(v)}</MenuItem>
        )}
      </Select>
    </Box>
  }
}

const timeOveralls = [
  15,
  30,
  45,
  60,
  60 * 2,
  60 * 3,
  60 * 4,
  60 * 5,
  60 * 6,
  60 * 7,
  60 * 8,
  60 * 9,
  60 * 10,
  60 * 15,
  60 * 20,
  60 * 25,
  60 * 30,
  60 * 45,
  60 * 60,
  60 * 60 * 1.5,
  60 * 60 * 2,
  60 * 60 * 2.5,
  60 * 3,
];

const increments = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  15,
  20,
  25,
  30,
  45,
  60,
  60 * 1.5,
  60 * 2,
  60 * 2.5,
  60 * 3
];

const handleChange = (e: SelectChangeEvent<number>, time: Stateful<number>) => {
  time.set(e.target.value as number);
}