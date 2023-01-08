import { Box, Button, MenuItem, Paper, Select, SelectChangeEvent } from "@mui/material";
import Stateful from "client/src/utils/stateful";
import { Timeframe } from "shared/types";

export default function CustomeFormatPanel(props: {
  onPlay: (clock: Timeframe) => void,
}) {
  const { onPlay } = props;

  const time = new Stateful(15 * 60);
  const increment = new Stateful(10);

  const format = (() => {
    const total = time.value + increment.value * 40;
    if (total < 180) return "Bullet";
    if (total < 500) return "Blitz";
    if (total < 1500) return "Rapid";
    return "Classical";
  })();

  return (
    <Box sx={{ margin: `auto`, maxWidth: `300px`, }}>
      <Paper elevation={3} sx={{
        margin: `20px`,
        padding: `20px`,
      }}>
        <Box sx={{ paddingBottom: `15px` }}>{format}</Box>
        <Box sx={{
          display: `flex`,
          flexDirection: `row`,
          justifyContent: `space-around`,
        }}>
          <Box>
            Time per Turn
            <Select
              value={time.value}
              onChange={(e) => handleChange(e, time)}
            >
              {
                times.map((v) =>
                  <MenuItem key={v} value={v}>{timeToString(v)}</MenuItem>
                )
              }
            </Select>
          </Box>
          <Box>
            Increment
            <Select
              value={increment.value}
              onChange={(e: SelectChangeEvent<number>) => handleChange(e, increment)}
            >
              {
                increments.map((v) =>
                  <MenuItem key={v} value={v}>{timeToString(v)}</MenuItem>
                )
              }
            </Select>
          </Box>
        </Box>
        <Button onClick={() => onPlay({
          timePerTurn: time.value,
          increment: increment.value
        })}>Play</Button>
      </Paper>
    </Box>
  );
}

const times = [
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

const timeToString = (time: number) => {
  if (time < 60) {
    return `${time}s`;
  }
  if (time < 60 * 60) {
    return `${time / 60}m`;
  }
  return `${time / (60 * 60)}h`;
}

const handleChange = (e: SelectChangeEvent<number>, time: Stateful<number>) => {
  time.set(e.target.value as number);
}