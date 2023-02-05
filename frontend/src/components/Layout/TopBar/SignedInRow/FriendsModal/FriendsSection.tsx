import { Alert, Box, IconButton, Portal, Snackbar, Tooltip } from "@mui/material";
import AlertSnackbar from "frontend/src/components/AlertSnackbar";
import Icon from "frontend/src/components/Icon";
import { ModalEmpty, ModalTitle } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import { SOCKET, THEME } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";
import { Friend } from "shared/types/general";

export default function FriendsSection(props: {
  friends: Friend[],
}) {
  const { friends: initFriends } = props;

  const friends = new Stateful<Friend[]>(initFriends);
  const isSnackbarOpen = new Stateful(false);

  const latest = useRef('');

  initFriendsValue();
  handleFriendsUpdatedEvent();

  return <>
    <ModalTitle title={'Friends'} />
    {getFriends()}
    {getSnackbar()}
  </>;

  function handleFriendsUpdatedEvent() {
    useEffect(() => {
      SOCKET.on("friendsUpdated", (newFriends) => {
        friends.set(newFriends);
      });
    }, []);
  }

  function initFriendsValue() {
    useEffect(() => {
      friends.set(initFriends);
    }, [initFriends]);
  }

  function getFriends() {
    if (friends.value.length === 0) {
      return <ModalEmpty text={'You don\'t have any friends yet'} />
    }

    return friends.value.map((friend, i) =>
      <FriendStrip key={friend.id.toString()}
        friend={friend}
        onDelete={() => {
          friends.set(v => { const a = [...v]; a.splice(i, 1); return a; });

          latest.current = friend.name;
          isSnackbarOpen.set(true);
        }}
      />
    );
  }

  function getSnackbar() {
    return <AlertSnackbar
      isOpen={isSnackbarOpen}
      message={`${latest.current} was removed from your friend list`}
      severity={"info"}
    />
  }
}

function FriendStrip(props: { friend: Friend, onDelete: () => void }) {
  const { friend, onDelete } = props;

  return <Box sx={{
    padding: `10px 10px`,

    display: `flex`,
    justifyContent: `space-between`,
  }}>
    <Box sx={{
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
    <Tooltip
      title={'Delete friend'}
      placement={"top"}
      arrow
    >
      <IconButton onClick={() => {
        SOCKET.emit("deleteFriend", friend.id);
        onDelete();
      }}>
        <Icon name="delete" side={25} filter={THEME.icon} />
      </IconButton>
    </Tooltip>
  </Box>
}