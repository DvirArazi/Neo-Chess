import { Box } from "@mui/material";
import Clock from "frontend/src/components/pageExclusives/game/clock";

export default function PlayerBunner(props: { name: string, rating: number | null }) {
  const { name, rating } = props;

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
    <Clock millis={340000} />
  </Box>
}