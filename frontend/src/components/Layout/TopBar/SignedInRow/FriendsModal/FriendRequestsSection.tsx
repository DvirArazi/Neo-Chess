import { Alert, Box, Button, IconButton, Portal, Snackbar, Tooltip } from "@mui/material";
import FriendRequestStrip from "frontend/src/components/Layout/TopBar/SignedInRow/FriendRequestStrip";
import { ModalEmpty, ModalTitle, VXButtons } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import { SOCKET} from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";
import { FriendRequest } from "shared/types/general";

export default function FriendRequestsSection(props: {
  friendRequests: FriendRequest[]
}) {
  const { friendRequests: initFriendRequests } = props;

  const friendRequests = new Stateful<FriendRequest[]>(initFriendRequests);
  const isSnackbarOpen = new Stateful(false);

  const latest = useRef({ friendName: '', isApproved: false });

  initFriendRequestsValue();
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

  function initFriendRequestsValue() {
    useEffect(()=>{
      friendRequests.set(initFriendRequests);
    },[initFriendRequests]);
  }

  function getFriendRequests() {
    if (friendRequests.value.length === 0) {
      return <ModalEmpty text={'You have no new requests'} />;
    }

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
      <VXButtons onClick={(isAccepted) => {
        SOCKET.emit("responseToFriendRequest", request.id, isAccepted);
        onResponse(isAccepted);
      }} />
    </Box>
  </>;
}