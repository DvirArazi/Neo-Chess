import { Box, IconButton } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import FriendsModal from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal";
import GamesModal from "frontend/src/components/Layout/TopBar/SignedInRow/GamesModal";
import { SOCKET, THEME } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { IconName } from "frontend/src/utils/types/iconName";
import { useEffect } from "react";
import { GamesModalData } from "shared/types/general";

export default function SignedInRow() {

  const gamesModalData = new Stateful<GamesModalData>({
    ongoingGamesTd: [],
    invitationsTd: [],
    requestTd: null
  });
  const isGamesModalOpen = new Stateful(false);
  const isFriendsModalOpen = new Stateful(true);

  getData();

  return <>
    {getButton("fight", 28, () => isGamesModalOpen.set(true))}
    {getButton("history", 25, () => {})}
    {getButton("friends", 33, () => isFriendsModalOpen.set(true))}
    {getGamesModal()}
    {getFriendsModal()}
  </>;

  function getData() {
    useEffect(() => {
      SOCKET.emit("getSignedInRowData", (data)=>{
        gamesModalData.set(data);
      });
    }, []);
  }

  function getButton(name: IconName, side: number, onClick: () => void) {
    const padding = 25 - side;

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

  function getGamesModal() {
    return <GamesModal
      isOpen={isGamesModalOpen}
      data={gamesModalData.value}
    />;
  }

  function getFriendsModal() {
    return <FriendsModal
      isOpen={isFriendsModalOpen}

    />
  }
}