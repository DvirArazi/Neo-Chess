import { Box, List, ListItem, Paper, Slider } from "@mui/material";
import Stateful from "frontend/src/utils/stateful";
import Toggle from "../../Toggle";
import FriendList from "./OnlinePanel/FriendList";

export default function OnlinePanel(
  props: {
    isRated: Stateful<boolean>,
    isRanged: Stateful<boolean>,
    range: Stateful<number[]>
    chosen: Stateful<string>
  }
) {
  const { isRated, isRanged, range, chosen } = props;

  const handleRangeChange = (newRange: number[]) => {
    if (newRange[0] != newRange[1]) {
      range.set(newRange);
    }
  }

  return (
    <Paper elevation={3} style={{
      margin: `10px 20px 20px 20px`,
      padding: `20px 5px 5px 5px`,
      height: `100%`,
      // transition: `height 2s ease-out`,
      // background: `blue`,
    }}>
      <Toggle isOn={isRated}>
        <Box sx={{ fontSize: `12px`, width: `50px` }}>Rated</Box>
        <Box sx={{ fontSize: `12px`, width: `50px` }}>Casual</Box>
      </Toggle>
      <Box sx={{ marginBottom: `15px` }}></Box>
      <Toggle isOn={isRanged}>
        <Box sx={{ fontSize: `12px`, width: `100px` }}>Rating Range</Box>
        <Box sx={{ fontSize: `12px`, width: `100px` }}>VS Friend</Box>
      </Toggle>
      <Box sx={{ marginBottom: `15px` }}></Box>

      <Paper variant="outlined" sx={{
        padding: `20px 20px 10px 20px`,
        display: isRanged.value ? `block` : `none`,
        // transition: `visibility 0s, opacity 0.5s linear`,
      }}>
        <Box>
          {rangeToString(range.value[0])} to {rangeToString(range.value[1])}
        </Box>
        <Slider
          value={range.value}
          onChange={(_, value)=>{handleRangeChange(value as number[])}}
          min={-500}
          max={500}
          step={50}
          marks={[
            { value: -490, label: `-500` },
            { value: 490, label: `500` }
          ]}
        />
      </Paper>
      <div style={{
        display: isRanged.value ? `none` : `block`,
        // transition: `display 0.2s ease-out`,
      }}>
        <FriendList
          friends={["Avishay", "Yonatan"]}
          chosen={chosen}
        />
      </div>
    </Paper>
  );
}

const rangeToString = (range: number) => {
  return range > 0 ? `+${range}` : range;
}