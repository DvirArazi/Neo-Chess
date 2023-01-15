import { Box } from "@mui/material";
import GameContainer from "frontend/src/components/pageExclusives/game/GameContainer";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { GameViewData } from "shared/types/game";
import { SOCKET } from "../_app";

export default function Game() {
  const router = useRouter();
  const path = router.query.path as string;
  const gameViewData = new Stateful<GameViewData | "loading" | "404">("loading");

  useEffect(() => {
    SOCKET.emit("getGameViewData", path, (data) => {
      gameViewData.set(data);
    });
  }, []);

  if (gameViewData.value === "loading") {
    return (
      <Box>
        Loading
      </Box>
    );
  }

  if (gameViewData.value === "404") {
    return (
      <Box>
        404
      </Box>
    );
  }

  return <GameContainer data={gameViewData.value} />;
}