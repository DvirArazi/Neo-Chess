import { Box, Paper, Slider } from "@mui/material";
import Slide from "@mui/material/Slide";
import Stateful from "client/src/Utils/types";
import SlidePanel from "../SlidePanel";
import Toggle from "../Toggle";

export default function OnlinePanel(
  props: {
    isRated: Stateful<boolean>,
    isRanged: Stateful<boolean>,
    range: Stateful<number[]>
  }
) {
  const { isRated, isRanged, range } = props;

  const handleRangeChange = (_: any, newRange: number[]) => {
    if (newRange[0] != newRange[1]) {
      range.set(newRange);
    }
  }

  return (
    <Paper elevation={3} sx={{
      margin: `10px 20px 20px 20px`,
      padding: `20px 0 20px 0`
    }}>
      <Toggle isOpen={isRated}>
        <Box sx={{ fontSize: `12px`, width: `50px` }}>Rated</Box>
        <Box sx={{ fontSize: `12px`, width: `50px` }}>Casual</Box>
      </Toggle>
      <Box sx={{ marginBottom: `15px` }}></Box>
      <Toggle isOpen={isRanged}>
        <Box sx={{ fontSize: `12px`, width: `100px` }}>Rating Range</Box>
        <Box sx={{ fontSize: `12px`, width: `100px` }}>VS Friend</Box>
      </Toggle>
      <Box sx={{ marginBottom: `15px` }}></Box>
      {/* <Box
        sx={{
          overflow: `hidden`,
          padding: `0 20px 0 20px`,
          position: `relative`,
          height: `150px`,

          background: `blue`,
        }}
      >
        <Slide 
          direction="right"
          in={isRanged.value}
          style={{position: `absolute`, top: 0, left: 0, width: `89%`}}
        >
          <Paper variant="outlined" sx={{
            margin: `5px`,
            padding: `20px 20px 10px 20px`,
          }}>
            <Box>
              {rangeToString(range.value[0])} to {rangeToString(range.value[1])}
            </Box>
            <Slider
              value={range.value}
              onChange={handleRangeChange}
              min={-500}
              max={500}
              step={50}
              marks={[
                { value: -490, label: `-500` },
                { value: 490, label: `500` }
              ]}
            />
          </Paper>
        </Slide>
        <Slide
          direction="left"
          in={!isRanged.value}
          style={{position: `absolute`, top: 0}}
        >
          <Box>
              Hello!
          </Box>
        </Slide>
      </Box> */}
      <SlidePanel isRanged={isRanged.value} />
    </Paper>
  );
}

const rangeToString = (range: number) => {
  return range > 0 ? `+${range}` : range;
}