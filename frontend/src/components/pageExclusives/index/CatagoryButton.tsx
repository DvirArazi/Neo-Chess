import { Box, Button, Paper } from "@mui/material";
import { THEME } from "frontend/src/pages/_app";
import Icon from "../../Icon";

export default function CatagoryButton(props: {
  rating?: number,
  catagory: Catagory
}) {
  const { rating, catagory } = props;

  return (
    <Box>
      <Button
        variant="outlined"
        sx={{
          display: `flex`,
          flexDirection: `column`,
          width: `100px`,
          height: `100px`,
          margin: `5px`,
          background: `white`,
          fontFamily: `roboto-regular`,
          whiteSpace: `nowrap`,
        }}
      >
        <Box sx={{fontSize: `13px`}}>{catagory.title}</Box>
        <Box sx={{fontSize: `20px`, textTransform: `none`}}>{
          catagory.title != "Untimed" ?
            `${timeToString(catagory.time)} | ${timeToString(catagory.increment)}` :
            <Icon name="infinity" side={34} filter={THEME.infinity}/>
        }</Box>
        {rating != null ? <Box sx={{fontSize: `13px`}}>{rating}</Box> : null}
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