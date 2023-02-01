import { Box, Button } from "@mui/material";
import FriendStrip from "frontend/src/components/Layout/TopBar/SignedInRow/FriendStrip";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import { SOCKET } from "frontend/src/pages/_app";
import { getFormatBannerString } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect } from "react";
import { FriendRequest } from "shared/types/general";

export default function WaitingRequests() {
  const requests = new Stateful<FriendRequest[]>([]);

  fetchFriendRequestsData();
  handleRecievedFriendRequests();

  return <Box>
    <ModalTitle title={'Waiting friend requests'} />
    {getFriendRequests()}
  </Box>

  function fetchFriendRequestsData() {
    useEffect(() => {
      SOCKET.emit("getFriendRequests", (newRequests) => {
        requests.set(newRequests);
      });
    }, []);
  }

  function handleRecievedFriendRequests() {
    SOCKET.off("recievedFriendRequest");
    SOCKET.on("recievedFriendRequest", (newRequests)=>{
      requests.set(newRequests);
    })
  }

  function getFriendRequests() {
    if (requests.value.length === 0) {
      return <Box>{'There are no new requests'}</Box>;
    }

    return <Box sx={{
      display: `flex`,
      flexDirection: `column`,
    }}>
      {requests.value.map(request=>
        <Box sx={{
          display: `flex`,
          flexDirection: `row`,
        }}>
          <FriendStrip friend={request} />
          <Button></Button>
        </Box>
      )}
    </Box>;
  }
}