import { Box } from "@mui/material";
import GameThumbnail from "frontend/src/components/GameThumbnail";
import Loading from "frontend/src/components/Loading";
import { SOCKET, USER_DATA } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import Error from "next/error";
import { useEffect } from "react";
import { GameTd } from "shared/types/general";

export default function history() {
  const gamesTd = new Stateful<GameTd[] | "loading" | "404">("loading");

  useEffect(() => {
    if (USER_DATA === undefined) {
      gamesTd.set("404");
      return;
    }

    SOCKET.emit("getHistoryGames", (newGames) => {
      gamesTd.set(newGames);
    });
  }, [USER_DATA]);


  if (gamesTd.value === "loading") return <Loading />;

  if (gamesTd.value === "404") return <Error statusCode={404} />;

  return <Box>{
    gamesTd.value.map(gameTd => <GameThumbnail key={gameTd.path} data={gameTd} />)
  }</Box>;
}