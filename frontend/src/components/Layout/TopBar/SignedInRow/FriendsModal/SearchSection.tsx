import { Alert, Box, Button, Portal, Snackbar, TextField, Tooltip } from "@mui/material";
import FriendRequestStrip from "frontend/src/components/Layout/TopBar/SignedInRow/FriendStrip";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import { SOCKET } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRef } from "react";
import { FriendRequest } from "shared/types/general";

export default function SearchSection() {
  const name = new Stateful("");
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
          value={name.value}
          onChange={handleNameChange}
        />
        {getSearchResults()}
      </Box>
    {getSnackbar()}
  </>;

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newName = event.target.value;

    if (newName != '') {
      SOCKET.emit("getFriendsSearchData", newName, (data) => {
        friends.set(data);
      });
    } else {
      friends.set([]);
    }

    name.set(newName);
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
        console.log('back');
        latest.current = { friendName: friend.name, success: success };
        isSnackbarOpen.set(true);
      });
    }
  }

  function getSnackbar() {
    console.log('rerender');

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
                `Friend request sent successfuly to ${latest.current.friendName}!` :
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