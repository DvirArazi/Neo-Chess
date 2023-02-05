import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { SOCKET, USER_DATA } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";
import { Friend } from "shared/types/general";

export default function FriendList(props: {
  isRanged: boolean,
  friendChosen: Stateful<Friend | null>
}) {
  const { isRanged, friendChosen } = props;

  const friends = new Stateful<Friend[]>([]);
  const friendIndex = new Stateful(0);

  fetchFriendsOnline();
  handlefriendIndexChange();

  return <>
    {getFriends()}
  </>;

  function fetchFriendsOnline() {
    useEffect(() => {
      if (isRanged) {
        friends.set([]);
        return
      };

      SOCKET.emit("getFriendsOnline", (newFriends) => {
        friends.set(newFriends);
      });

    }, [isRanged]);
  }

  function getFriends() {
    if (friends.value.length === 0) {
      return <Box>{'Loading...'}</Box>
    }

    return <Box sx={{
      maxHeight: `215px`,
      overflow: `auto`,
    }}>
      <ToggleButtonGroup
        exclusive
        value={friendIndex.value}
        onChange={(_, i: number)=>{
          friendIndex.set(i);
        }}
        orientation="vertical"
        sx={{
          width: `100%`,
          borderRadius: `10px`,
          background: `white`,
        }}
      > {
        friends.value.map((friend, i) => {
          return (
            <ToggleButton key={friend.id.toString()}
              value={i}
              sx={{
                borderRadius: `10px`,
                fontFamily: `unset !important`,
                textTransform: `unset !important`,
              }}
            >
              <FriendStrip friend={ friend } />
            </ToggleButton>
          );
        })
      }</ToggleButtonGroup>
    </Box>
  }

  function handlefriendIndexChange() {
    useEffect(()=>{
      friendChosen.set(friends.value[friendIndex.value]);
    }, [friendIndex.value]);
  }
}

function FriendStrip(props: { friend: Friend }) {
  const { friend } = props;

  return <Box sx={{
    display: `flex`,
    justifyContent: `center`,
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