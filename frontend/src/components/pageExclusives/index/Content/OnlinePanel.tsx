import { Accordion, AccordionDetails, AccordionSummary, Box, List, ListItem, Paper, Slider } from "@mui/material";
import { THEME } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { Friend } from "shared/types/general";
import Toggle from "../../../Toggle";
import FriendList from "./OnlinePanel/FriendList";

export default function OnlinePanel(
  props: {
    isRated: Stateful<boolean>,
    isRanged: Stateful<boolean>,
    range: Stateful<number[]>
    chosenFriend: Stateful<Friend | null>
  }
) {
  const { isRated, isRanged, range, chosenFriend } = props;

  const handleRangeChange = (newRange: number[]) => {
    if (newRange[0] != newRange[1]) {
      range.set(newRange);
    }
  }

  return (
    <Box sx={{
      padding: `10px`,

      display: `flex`,
      justifyContent: `center`,
    }}>
      <Accordion
        expanded={true}
        sx={{
          background: `transparent`,
          boxShadow: `none`,
          width: `500px`,
        }}
      >
        <AccordionSummary sx={{ display: `none` }} />
        <AccordionDetails sx={{
          padding: `0`,
        }}>
          <Paper elevation={3} style={{
            padding: `20px 5px 5px 5px`,
            marginBottom: `10px`,
            borderRadius: `15px`,
            background: THEME.boxBackground2,
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

              borderRadius: `10px`,
            }}>
              <Box>
                {rangeToString(range.value[0])} to {rangeToString(range.value[1])}
              </Box>
              <Slider
                value={range.value}
                onChange={(_, value) => { handleRangeChange(value as number[]) }}
                min={-500}
                max={500}
                step={50}
                marks={[
                  { value: -495, label: `-500` },
                  { value: 495, label: `500` }
                ]}
              />
            </Paper>
            <div style={{
              display: isRanged.value ? `none` : `block`,
            }}>
              <FriendList
                isRanged={isRanged.value}
                friendChosen={chosenFriend}
              />
            </div>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

const rangeToString = (range: number) => {
  return range > 0 ? `+${range}` : range;
}