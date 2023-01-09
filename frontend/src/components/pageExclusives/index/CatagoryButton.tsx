import { Box, Button, Paper } from "@mui/material";
import Icon from "../../Icon";

export default function CatagoryButton(props: { rating?: number, catagory: Catagory }) {
  const { rating, catagory } = props;

  return (
    <Box>
      {rating != null ? <Box>{rating}</Box> : null}
      <Button variant="outlined" sx={{
        display: `flex`,
        flexDirection: `column`,
      }}>
        <Box>{catagory.title}</Box>
        <Box>{
          catagory.title != "Untimed" ?
            `${timeToString(catagory.time)} | ${timeToString(catagory.increment)}` :
            <Icon path="infinity" />
        }</Box>
      </Button>
    </Box>
  );
}

export type Catagory =
  {
    title: "Untimed",
  } |
  {
    title: "Bullet" | "Blitz" | "Rapid" | "Classical"
    time: number,
    increment: number,
  }
  ;

const timeToString = (time: number) => {
  return time >= 60 ? `${Math.floor(time / 60)}m` : `${time}s`;
}