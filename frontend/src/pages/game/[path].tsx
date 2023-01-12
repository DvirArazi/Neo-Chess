import { Box } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import GameContainer from "frontend/src/components/pageExclusives/game/GameContainer";
import Board from "frontend/src/components/pageExclusives/game/GameContainer/Board";
import Stateful from "frontend/src/utils/stateful";
import { BoardLayout } from "frontend/src/utils/types";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { BOARD_SIDE } from "shared/globals";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { GameTurn, GameViewData } from "shared/types/gameTypes";
import { PieceColor, PieceType } from "shared/types/pieceTypes";
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