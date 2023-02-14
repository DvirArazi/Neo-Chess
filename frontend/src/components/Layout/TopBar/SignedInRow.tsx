import { Box, IconButton } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import FriendsModal from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal";
import GamesModal from "frontend/src/components/Layout/TopBar/SignedInRow/GamesModal";
import { SOCKET, THEME } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { IconName } from "frontend/src/utils/types/iconName";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FriendsModalData, GamesModalData } from "shared/types/general";

export default function SignedInRow() {
  const router = useRouter();

  const gamesModalData = new Stateful<GamesModalData>({
    ongoingGamesTd: [],
    invitations: [],
    requestTd: null
  });
  const friendsModalData = new Stateful<FriendsModalData>({
    friends: [],
    friendRequests: [],
  });
  const isGamesModalOpen = new Stateful(false);
  const isFriendsModalOpen = new Stateful(false);

  getData();
  handleInvitationsUpdatedEvent();
  handleFriendRequestsUpdatedEvent();
  handleOngoingGamesUpdatedEvent();

  return <>
    <Box>
      {getButton("fight", 28, () => isGamesModalOpen.set(true))}
      {gamesModalData.value.invitations.length > 0 || alertGameTd() ? getAlert() : <></>}
    </Box>
    <Box>
      {getButton("friends", 33, () => isFriendsModalOpen.set(true))}
      {friendsModalData.value.friendRequests.length > 0 ? getAlert() : <></>}
    </Box>
    {getButton("history", 25, () => router.push('/history'))}
    {getGamesModal()}
    {getFriendsModal()}
  </>;

  function getData() {
    useEffect(() => {
      SOCKET.emit("getSignedInRowData", (newGamesModalData, newFriendsModalData) => {
        gamesModalData.set(newGamesModalData);
        friendsModalData.set(newFriendsModalData);
      });
    }, []);
  }

  function getButton(name: IconName, side: number, onClick: () => void) {
    const padding = 33 - side;

    return <IconButton
      onClick={onClick}
    >
      <Box sx={{ padding: `${padding / 2}px` }}>
        <Icon
          name={name}
          side={side}
          filter={THEME.icon}
        />
      </Box>
    </IconButton>
  }

  function handleInvitationsUpdatedEvent() {
    useEffect(() => {
      SOCKET.on("gameInvitationsUpdated", (newInvitations) => {
        gamesModalData.set(v => ({
          ...v,
          invitations: newInvitations
        }));
      });
    }, []);
  }

  function handleFriendRequestsUpdatedEvent() {
    useEffect(() => {
      SOCKET.on("friendRequestsUpdated", (newRequests) => {
        friendsModalData.set(v => ({
          ...v,
          friendRequests: newRequests
        }));
      })
    }, []);
  }

  function handleOngoingGamesUpdatedEvent() {
    useEffect(() => {
      SOCKET.on("ongoingGamesUpdated", (gamesTd) => {
        gamesModalData.set(v => ({
          ...v,
          ongoingGamesTd: gamesTd
        }));
      })
    }, []);
  }

  function getGamesModal() {
    return <GamesModal
      isOpen={isGamesModalOpen}
      data={gamesModalData.value}
    />;
  }

  function getFriendsModal() {
    return <FriendsModal
      isOpen={isFriendsModalOpen}
      data={friendsModalData.value}
    />
  }

  function getAlert() {
    return <Box sx={{
      position: `absolute`,
      width: `20px`,
      height: `20px`,
      borderRadius: `50%`,
      background: `#ff4d4d`,
      transform: `translate(30px, -20px)`,
      boxShadow: `0px 2px 5px 0px rgba(0,0,0,0.3)`,
      pointerEvents: `none`,
    }}>
      <Box sx={{
        fontWeight: `bold`,
        position: `absolute`,
        top: `1px`,
        left: `50%`,
        transform: `translateX(-50%)`,
        color: `white`,
        fontFamily: `roboto`
      }}>{'!'}</Box>
    </Box>
  }

  function alertGameTd(): boolean {
    return (gamesModalData.value.ongoingGamesTd.some(td => 
      td.userColor === td.turnColor && window.location.pathname !== `/game/${td.path}`
    )
    )
  }
}