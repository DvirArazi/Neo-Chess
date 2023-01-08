import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import Stateful from "client/src/utils/stateful";

export default function FriendList(props: { friends: string[], chosen: Stateful<string> }) {
  const { friends, chosen } = props;

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
          <ToggleButton key={friend} value={friend}>
            <Box>{friend}</Box>
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}