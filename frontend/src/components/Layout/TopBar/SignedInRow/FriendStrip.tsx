import { Box } from "@mui/material";
import { FriendRequest } from "shared/types/general";

export default function FriendStrip(props: { friend: FriendRequest }) {
  const { friend } = props;

  return <>
    <img
      src={friend.picture}
      style={{
        borderRadius: `50%`,
        width: `30px`,
        boxShadow: `0px 0px 2px 0.1px rgba(0,0,0,0.5)`,
      }}
    />
    <Box sx={{ paddingLeft: `8px` }}>
      {`${friend.name} (${friend.email})`}
    </Box>
  </>
}