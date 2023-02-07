import { Box } from "@mui/material";
import GameOnline from "frontend/src/components/pageExclusives/game/GameOnline";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { GameViewData } from "shared/types/game";
import { SOCKET } from "../_app";
import Error from "next/error";
import Loading from "frontend/src/components/Loading";

export default function Game() {
  const router = useRouter();

  const path = router.query.path as string | undefined;

  console.log(`path`, path);

  const gameViewData = new Stateful<GameViewData | "loading" | "404">("loading");

  useEffect(() => {
    if (path === undefined) return;

    SOCKET.emit("getGameViewData", path, (data) => {
      gameViewData.set(data);
      console.log('data recieved');
    });
  }, [path]);

  if (gameViewData.value === "loading") return <Loading />;

  if (gameViewData.value === "404") return <Error statusCode={404} />;

  return <GameOnline key={path} data={gameViewData.value} />
}