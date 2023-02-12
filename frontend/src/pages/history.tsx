import { Box } from "@mui/material";
import GameThumbnail from "frontend/src/components/GameThumbnail";
import Empty from "frontend/src/components/Empty";
import { SOCKET, USER_DATA } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import Error from "next/error";
import { useEffect } from "react";
import { GameTd } from "shared/types/general";
import { AAD_COOKIE } from "frontend/src/utils/tools/cookies";

export default function history() {
  const gamesTd = new Stateful<GameTd[] | "loading" | "404">("loading");

  useEffect(() => {
    if (AAD_COOKIE.get() !== undefined && USER_DATA === undefined) return;

    SOCKET.emit("getHistoryGames", (newGames) => {
      gamesTd.set(newGames);
    });
  }, [AAD_COOKIE.get(), USER_DATA]);


  if (gamesTd.value === "loading") return <Empty message='Loading...'/>;

  if (gamesTd.value === "404") return <Error statusCode={404} />;

  return <Box>{
    gamesTd.value.length === 0 ?
      <Empty message={'You don\'t yet have any games in your history'} /> :
      gamesTd.value.reverse().map(gameTd => <GameThumbnail key={gameTd.path} data={gameTd} />)
  }</Box>;
}