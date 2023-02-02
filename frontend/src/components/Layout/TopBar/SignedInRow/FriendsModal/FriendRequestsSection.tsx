import { Alert, Box, Button, IconButton, Portal, Snackbar, Tooltip } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import FriendRequestStrip from "frontend/src/components/Layout/TopBar/SignedInRow/FriendStrip";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import { SOCKET, THEME } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { IconName } from "frontend/src/utils/types/iconName";
import { useEffect, useRef } from "react";
import { FriendRequest } from "shared/types/general";

export default function FriendRequestsSection(props: {
  friendRequests: FriendRequest[]
}) {
  const { friendRequests: initFriendRequests } = props;

  const friendRequests = new Stateful<FriendRequest[]>(initFriendRequests);
  const isSnackbarOpen = new Stateful(false);

  const latest = useRef({ friendName: '', isApproved: false });

  handleFriendRequestsUpdatedEvent();

  return <Box>
    <ModalTitle title={'Friend requests'} />
    {getFriendRequests()}
    {getSnackbar()}
  </Box>;

  function handleFriendRequestsUpdatedEvent() {
    SOCKET.off("friendRequestsUpdated");
    SOCKET.on("friendRequestsUpdated", (newRequests) => {
      friendRequests.set(newRequests);
    })
  }

  function getFriendRequests() {
    if (friendRequests.value.length === 0) {
      return <Box sx={{ padding: `20px` }}>
        {'There are no new requests'}
      </Box>;
    }

    console.log('hello', friendRequests.value);

    return <Box sx={{
      display: `flex`,
      flexDirection: `column`,
    }}>
      {friendRequests.value.map((request, i) =>
        <FriendRequest
          request={request}
          onResponse={(isApproved) => {
            latest.current = { friendName: request.name, isApproved: isApproved };

            friendRequests.set(v => { const a = [...v]; a.splice(i, 1); return a; });
            isSnackbarOpen.set(true);
          }}
        />
      )}
    </Box>;
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
            severity={"info"}
          // sx={{ width: '100%' }}
          >
            {
              `Friend request from ${latest.current.friendName}`
              + ` was ${latest.current.isApproved ? 'approved' : 'denied'}`
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

function FriendRequest(props: {
  request: FriendRequest,
  onResponse: (isApproved: boolean) => void,
}) {
  const { request, onResponse } = props;

  return <>
    <Box sx={{
      display: `flex`,
      flexDirection: `row`,
      justifyContent: `space-between`,
      alignItems: `center`,
    }}>
      <Box sx={{ display: `flex` }}>
        <Box sx={{ width: `8px` }} />
        <FriendRequestStrip friend={request} />
      </Box>
      <Box sx={{ display: `flex` }}>
        {getButton(true)}
        {getButton(false)}
      </Box>
    </Box>
  </>;

  function getButton(isAccepted: boolean) {
    const [iconName, color0, color1, hint, radii]:
      [IconName, string, string, string, string] = isAccepted ?
        ["approve", `#00e600`, `#00cc00`, 'Approve', `5px 0 0 5px`] :
        ["deny", `#ff3333`, `#e60000`, 'Deny', `0 5px 5px 0`];

    return <>
      <Tooltip
        title={hint}
        placement={"top"}
        arrow
      >
        <IconButton
          onClick={() => {
            SOCKET.emit("responseToFriendRequest", request.id, isAccepted);
            onResponse(isAccepted);
          }}
          sx={{
            borderRadius: radii,

            background: color0,
            ":hover": { background: color1 },
            // ":disabled": {background: `#a6a6a6`},
          }}
        >
          <Icon name={iconName} side={30} filter={THEME.negativeIcon} />
        </IconButton>
      </Tooltip>
    </>
  }
}