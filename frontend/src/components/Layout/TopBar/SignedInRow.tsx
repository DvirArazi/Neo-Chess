import { Box, IconButton } from "@mui/material";
import Icon from "frontend/src/components/Icon";
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
  const isGamesModalOpen = new Stateful(true); //change to false

  handleSignInRowDataEvent();

  getData();

  return <>
    {getButton("fight", 28, () => isGamesModalOpen.set(true))}
    {getButton("history", 25, () => { })}
    {getButton("friends", 33, () => { })}
    {getGamesModal()}
  </>;

  function getData() {
    useEffect(() => {
      SOCKET.emit("getSignedInRowData");
    }, []);
  }

  function handleSignInRowDataEvent() {
    SOCKET.off("signedInRowData");
    SOCKET.on("signedInRowData", (newGamesModalData) => {
      gamesModalData.set(newGamesModalData);
    });
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
}