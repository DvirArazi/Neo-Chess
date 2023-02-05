import { Alert, Box, Button, Portal, Snackbar, TextField, Tooltip } from "@mui/material";
import FriendRequestStrip from "frontend/src/components/Layout/TopBar/SignedInRow/FriendRequestStrip";
import { ModalTitle } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import { SOCKET } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRef } from "react";
import { FriendRequest } from "shared/types/general";

export default function FriendsSearchSection() {
  const friendName = new Stateful("");
  const friends = new Stateful<FriendRequest[]>([]);
  const isSnackbarOpen = new Stateful(false);

  const latest = useRef({ friendName: '', success: false });

  return <>
    <ModalTitle title={'Send a friend request'} />
    <Box sx={{ height: `10px` }} />
    <Box sx={{ padding: `0 30px` }}>
      <TextField
        fullWidth
        variant={"outlined"}
        label={'Enter friend\'s name'}
        value={friendName.value}
        onChange={handleFriendNameChange}
      />
      {getSearchResults()}
    </Box>
    {getSnackbar()}
  </>;

  function handleFriendNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newFriendName = event.target.value;

    if (newFriendName != '') {
      SOCKET.emit("getFriendsSearchData", newFriendName, (data) => {
        friends.set(data);
      });
    } else {
      friends.set([]);
    }

    friendName.set(newFriendName);
  }

  function getSearchResults() {
    return friends.value.map(friend =>
      <SearchResult key={friend.id.toString()}
        friend={friend}
        onClick={handleClick}
      />
    );

    function handleClick(friend: FriendRequest) {
      SOCKET.emit("friendRequest", friend.id, (success) => {
        latest.current = { friendName: friend.name, success: success };
        isSnackbarOpen.set(true);
      });
    }
  }

  function getSnackbar() {
    return <Box sx={{ position: `relative` }}>
      <Portal>
        <Snackbar
          open={isSnackbarOpen.value}
          autoHideDuration={3000}
          onClose={handleClose}
        >
          <Alert
            onClose={handleClose}
            severity={latest.current.success ? "success" : "error"}
          >
            {
              latest.current.success ?
                `Friend request was successfuly sent to ${latest.current.friendName}!` :
                'User could not be found'
            }
          </Alert>
        </Snackbar>
      </Portal>
    </Box>;

    function handleClose() {
      isSnackbarOpen.set(false);
    }
  }
}

function SearchResult(props: {
  friend: FriendRequest,
  onClick: (friend: FriendRequest) => void,
}) {
  const { friend, onClick } = props;

  const isEnabled = new Stateful(true);

  return <Tooltip
    title={'send request'}
    placement={"top"}
    arrow
  >
    <Button
      disabled={!isEnabled.value}
      onClick={() => {
        onClick(friend);
        isEnabled.set(false)
      }}
      sx={{
        fontFamily: `unset !important`,
        textTransform: `unset !important`,
        padding: `10px`,
      }}
    >
      <FriendRequestStrip friend={friend} />
    </Button>
  </Tooltip>;
}