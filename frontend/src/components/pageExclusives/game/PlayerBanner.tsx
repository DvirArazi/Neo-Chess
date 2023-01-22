import { Box } from "@mui/material";
import Clock from "frontend/src/components/pageExclusives/game/clock";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect } from "react";

export default function PlayerBunner(props: {
  name: string,
  rating: number | null,
  timeLeftMil: number,
  tick: boolean,
}) {
  const { name, rating, timeLeftMil, tick } = props;

  console.log(timeLeftMil);

  return <Box sx={{
    margin: `10px`,
    display: `flex`,
    flexDirection: `row`,
    justifyContent: `space-between`,
    alignItems: `center`,
  }}>
    <Box sx={{ textAlign: `left` }}>
      <Box sx={{ fontSize: `16px` }}>{name}</Box>
      <Box sx={{ fontSize: `14px` }}>{rating}</Box>
    </Box>
    <Clock
      timeLeftMil={timeLeftMil}
      tick={tick}
    />
  </Box>
}