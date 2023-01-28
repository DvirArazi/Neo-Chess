import { Box, Button, Paper } from "@mui/material";
import { THEME } from "frontend/src/pages/_app";
import Icon from "../../Icon";

export default function CatagoryButton(props: {
  rating?: number,
  catagory: Catagory,
  onClick: ()=>void,
}) {
  const { rating, catagory, onClick } = props;

  return (
    <Box>
      <Button
        onClick={onClick}
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
          borderRadius: `10px`,
        }}
      >
        <Box sx={{fontSize: `13px`}}>{catagory.title}</Box>
        <Box sx={{fontSize: `24px`, textTransform: `none`}}>{
          catagory.title != "Untimed" ?
            `${timeToString(catagory.time)} | ${timeToString(catagory.increment)}` :
            <Box sx={{padding: `4px`}}><Icon name="infinity" side={34} filter={THEME.infinity}/></Box>
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
  return time >= 60 ? `${Math.floor(time / 60)}` : `${time}`;
}