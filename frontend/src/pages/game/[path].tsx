import { Box } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import Stateful from "frontend/src/utils/stateful";
import { BoardLayout } from "frontend/src/utils/types";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { BOARD_SIDE } from "shared/globals";
import { GameTurn, GameViewData } from "shared/types/gameTypes";
import { PieceColor, PieceType } from "shared/types/pieceTypes";
import { SOCKET } from "../_app";

export default function Game() {
  const router = useRouter();
  const { path } = router.query;
  const gameViewData = new Stateful<GameViewData | "loading" | "404">("loading");

  useEffect(() => {
    SOCKET.emit("getGameViewData", path as string, (data) => {
      console.log("hwllo");
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

  const {
    role,
    white,
    black,
    isRated,
    start,
    timeframe,
    turns,
  } = gameViewData.value;

  return (
    <Layout>
      <Box sx={{ background: `blue` }}>
        <Board layout={startAndTurnsToBoardLayout(start, turns)} role={role} />
      </Box>
    </Layout>
  );
}

function startAndTurnsToBoardLayout(start: PieceType[], turns: GameTurn[]) {
  const layout: BoardLayout = new Array(BOARD_SIDE * BOARD_SIDE).fill(undefined);

  for (let x = 0; x < BOARD_SIDE; x++) {
    layout[x] = { type: start[x], color: PieceColor.White };
    layout[BOARD_SIDE + x] = { type: PieceType.Pawn, color: PieceColor.White };
    layout[BOARD_SIDE * (BOARD_SIDE - 2) + x] = { type: PieceType.Pawn, color: PieceColor.Black };
    layout[BOARD_SIDE * (BOARD_SIDE - 1) + x] = { type: start[x], color: PieceColor.Black };
  }

  for (const turn of turns) {
    const action = turn.action;
    layout[action[1]] = layout[action[0]];
    layout[action[0]] = undefined;
  }

  return layout;
}