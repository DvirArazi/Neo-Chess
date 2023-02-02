import { Box } from "@mui/material";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import { SOCKET } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { Friend } from "shared/types/general";

export default function FriendsSection() {

  const friends = new Stateful<Friend[]>([]);

  fetchFriends();
  handleFriendsUpdatedEvent();

  return <>
    <ModalTitle title={'Friends'} />
    {getFriends()}
  </>;

  function fetchFriends() {
    SOCKET.emit("getFriends", (newFriends) => {
      friends.set(newFriends);
    });
  }

  function handleFriendsUpdatedEvent() {
    SOCKET.off("friendsUpdated");
    SOCKET.on("friendsUpdated", (newFriends) => {
      friends.set(newFriends);
    });
  }

  function getFriends() {
    if (friends.value.length === 0) {
      return <Box sx={{ padding: `20px` }}>
        {'You don\'t yet have any friends'}
      </Box>
    }

    return friends.value.map(friend =>
      <FriendStrip friend={friend} />
    );
  }
}

function FriendStrip(props: { friend: Friend }) {
  const { friend } = props;

  return <Box sx={{
    display: `flex`,
    alignItems: `center`,
  }}>
    <img
      src={friend.picture}
      style={{
        borderRadius: `50%`,
        width: `30px`,
        height: `30px`,
        boxShadow: `0px 0px 2px 0.1px rgba(0,0,0,0.5)`,
      }}
    />
    <Box sx={{ paddingLeft: `8px` }}>
      {friend.name}
    </Box>
  </Box>
}