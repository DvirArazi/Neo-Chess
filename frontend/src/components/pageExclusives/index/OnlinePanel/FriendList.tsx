import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import Stateful from "frontend/src/utils/tools/stateful";

export default function FriendList(props: { friends: string[], friendChosen: Stateful<string> }) {
  const { friends, friendChosen: chosen } = props;

  const handleChange = (_: any, newChosen: string) => {
    chosen.set(newChosen);
  };

  return (
    <ToggleButtonGroup
      orientation="vertical"
      value={chosen.value}
      exclusive
      onChange={handleChange}
      sx={{ width: `100%` }}
    >
      {friends.map((friend) => {
        return (
          <ToggleButton key={friend}
            value={friend}
            sx={{ borderRadius: `10px`, }}
          >
            <Box >{friend}</Box>
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}